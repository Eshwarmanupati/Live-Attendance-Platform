import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { classService } from "../../api/classes";
import { useWs } from "../../context/WsContext";
import { useToast } from "../../components/ui/Toast";
import LiveAttendancePanel from "../../components/teacher/LiveAttendancePanel";

const TeacherAttendance = () => {
  const toast = useToast();
  const { send, subscribe, activeSession } = useWs();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classService.getAll()
      .then((r) => setClasses(r.data.data.classes))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsub = subscribe("SESSION_ENDED", (payload) => {
      toast(`Session ended. ${payload.finalPresentCount} attended.`, "info");
    });
    return unsub;
  }, [subscribe, toast]);

  const handleStart = (classId) => send("START_SESSION", { classId });
  const handleEnd = (classId) => send("END_SESSION", { classId });

  return (
    <DashboardLayout title="Attendance Control" subtitle="Start and manage live attendance sessions">
      <div className="max-w-2xl space-y-4">
        {activeSession && (
          <div className="card border-jade-500/40 shadow-glow-jade animate-fade-up">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-jade-400 animate-pulse" />
              <p className="text-sm font-semibold text-jade-300">Active Session</p>
              <span className="text-xs font-mono text-ink-500 ml-auto">{activeSession.classTitle}</span>
            </div>
            <LiveAttendancePanel classId={activeSession.classId} />
            <button
              onClick={() => handleEnd(activeSession.classId)}
              className="btn-danger w-full mt-4 text-center"
            >
              ■ End Session
            </button>
          </div>
        )}

        <div className="card">
          <p className="text-xs font-mono text-ink-400 uppercase tracking-wider mb-3">
            Select a class to start attendance
          </p>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-ink-800 animate-pulse rounded-lg" />)}
            </div>
          ) : classes.length === 0 ? (
            <p className="text-ink-600 text-sm text-center py-6">No classes found. Create one first.</p>
          ) : (
            <div className="space-y-2">
              {classes.map((cls) => {
                const isLive = String(activeSession?.classId) === String(cls._id);
                return (
                  <div
                    key={cls._id}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200
                      ${isLive ? "bg-jade-500/5 border-jade-500/30" : "bg-ink-900 border-ink-800 hover:border-ink-700"}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{cls.title}</p>
                      <p className="text-xs text-ink-500 font-mono">{cls.students?.length || 0} students enrolled</p>
                    </div>
                    {!activeSession ? (
                      <button onClick={() => handleStart(cls._id)} className="btn-success text-xs flex-shrink-0">
                        ▶ Start
                      </button>
                    ) : isLive ? (
                      <span className="badge-active flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-jade-400 animate-pulse" /> LIVE
                      </span>
                    ) : (
                      <span className="badge-inactive flex-shrink-0">session active</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherAttendance;
