import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { classService } from "../../api/classes";
import { attendanceService } from "../../api/attendance";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/Toast";
import { getUserId } from "../../utils/userId";

const StudentHistory = () => {
  const { user } = useAuth();
  const userId = getUserId(user);
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchHistory = async () => {
      try {
        const classRes = await classService.getAll();
        const allClasses = classRes.data.data.classes;
        setClasses(allClasses);

        const results = await Promise.allSettled(
          allClasses.map((cls) =>
            attendanceService.getStudentAttendance(cls._id, userId).then((r) => ({
              class: cls,
              record: r.data.data.attendance,
            }))
          )
        );

        const filled = results
          .filter((r) => r.status === "fulfilled" && r.value.record)
          .map((r) => r.value);

        setRecords(filled);
      } catch {
        toast("Failed to load history", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userId, toast]);

  return (
    <DashboardLayout title="Attendance History" subtitle="Your attendance across all classes">
      <div className="max-w-2xl">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-white">{classes.length}</p>
            <p className="text-xs font-mono text-ink-500 mt-1">Total Classes</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-jade-400">{records.length}</p>
            <p className="text-xs font-mono text-ink-500 mt-1">Present</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-rose-400">{classes.length - records.length}</p>
            <p className="text-xs font-mono text-ink-500 mt-1">Absent</p>
          </div>
        </div>

        {/* Attendance rate bar */}
        {classes.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono text-ink-400 uppercase tracking-wider">Attendance Rate</p>
              <p className="text-sm font-bold text-white">
                {Math.round((records.length / classes.length) * 100)}%
              </p>
            </div>
            <div className="w-full bg-ink-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-pulse-600 to-jade-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(records.length / classes.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Record list */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-ink-800 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="card text-center py-10 border-dashed border-ink-700">
            <p className="text-ink-500 text-sm">No classes enrolled yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {classes.map((cls) => {
              const rec = records.find((r) => r.class._id === cls._id);
              return (
                <div key={cls._id} className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-ink-900 border border-ink-800">
                  <div>
                    <p className="text-sm font-semibold text-white">{cls.title}</p>
                    {rec && (
                      <p className="text-[10px] font-mono text-ink-600 mt-0.5">
                        {new Date(rec.record.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-mono px-2.5 py-1 rounded-full border
                    ${rec
                      ? "text-jade-400 bg-jade-500/10 border-jade-500/30"
                      : "text-rose-400 bg-rose-500/10 border-rose-500/30"
                    }`}>
                    {rec ? "✓ Present" : "✕ Absent"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentHistory;
