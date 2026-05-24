import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { classService } from "../../api/classes";
import { useWs } from "../../context/WsContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/Toast";
import { getUserId } from "../../utils/userId";
import { CardSkeleton } from "../../components/ui/Skeleton";

const StudentDashboard = () => {
  const { user } = useAuth();
  const userId = getUserId(user);
  const { send, subscribe, activeSession } = useWs();
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markedClasses, setMarkedClasses] = useState(new Set());
  const [marking, setMarking] = useState(null);

  useEffect(() => {
    classService.getAll()
      .then((r) => setClasses(r.data.data.classes))
      .catch(() => toast("Failed to load classes", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessionClassId = activeSession?.classId;

  // Reset marked state when the active session changes
  const currentMarked = useMemo(() => {
    if (!sessionClassId) return new Set();
    return markedClasses;
  }, [sessionClassId, markedClasses]);

  useEffect(() => {
    const unsub1 = subscribe("SESSION_STARTED", () => {
      toast(`Attendance session started`, "info");
    });
    const unsub2 = subscribe("SESSION_ENDED", () => {
      toast("Session has ended", "warning");
      setMarkedClasses(new Set());
    });
    const unsub3 = subscribe("ERROR", (payload) => {
      toast(payload.message, "error");
      setMarking(null);
    });
    const unsub4 = subscribe("ATTENDANCE_UPDATED", (payload) => {
      if (String(payload.studentId) === String(userId)) {
        setMarkedClasses((prev) => new Set([...prev, String(payload.classId)]));
        setMarking(null);
        toast("Attendance marked!", "success");
      }
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [subscribe, toast, userId]);

  const handleMarkAttendance = (classId) => {
    if (!userId || !activeSession || String(activeSession.classId) !== String(classId)) return;
    setMarking(classId);
    send("MARK_ATTENDANCE", { classId, studentId: userId });
  };

  return (
    <DashboardLayout
      title="Student Dashboard"
      subtitle="Join live sessions and mark your attendance"
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs font-mono text-ink-500 uppercase tracking-wider mb-2">Enrolled Classes</p>
          <p className="text-lg font-bold text-white">{classes.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-mono text-ink-500 uppercase tracking-wider mb-2">Session Status</p>
          <p className={`text-lg font-bold ${activeSession ? "text-jade-400" : "text-ink-500"}`}>
            {activeSession ? "LIVE NOW" : "No Session"}
          </p>
        </div>
        <div className="stat-card col-span-2 lg:col-span-1">
          <p className="text-xs font-mono text-ink-500 uppercase tracking-wider mb-2">Student</p>
          <p className="text-lg font-bold text-white truncate">{user?.name}</p>
        </div>
      </div>

      {activeSession && (
        <div className="card border-jade-500/40 shadow-glow-jade mb-6 animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-jade-400 animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-jade-300">
                Live Session: {activeSession.classTitle}
              </p>
              <p className="text-xs text-ink-500 font-mono mt-0.5">
                Started {new Date(activeSession.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {!currentMarked.has(String(activeSession.classId)) ? (
              <button
                onClick={() => handleMarkAttendance(activeSession.classId)}
                disabled={!!marking}
                className="btn-success flex-shrink-0"
              >
                {marking === activeSession.classId ? "Marking…" : "✓ Mark Present"}
              </button>
            ) : (
              <span className="badge-active flex-shrink-0">✓ Marked</span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ink-300 uppercase tracking-wider font-mono">
          Available Classes
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-ink-700">
          <p className="text-4xl mb-3">◫</p>
          <p className="text-ink-400 text-sm">No classes available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const isSessionClass = String(activeSession?.classId) === String(cls._id);
            const isMarked = currentMarked.has(String(cls._id));
            return (
              <div
                key={cls._id}
                className={`card transition-all duration-300
                  ${isSessionClass ? "border-jade-500/40 shadow-glow-jade" : "border-ink-800 hover:border-ink-700"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{cls.title}</h3>
                    <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">
                      {cls.description || "No description"}
                    </p>
                  </div>
                  {isSessionClass && (
                    <span className="badge-active ml-2 flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-jade-400 animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>

                <div className="text-xs text-ink-500 font-mono mb-4">
                  <span>👨‍🏫 {cls.teacher?.name || "Teacher"}</span>
                </div>

                <div className="border-t border-ink-800 pt-3">
                  {isSessionClass && !isMarked && (
                    <button
                      onClick={() => handleMarkAttendance(cls._id)}
                      disabled={!!marking}
                      className="btn-success w-full text-center text-sm"
                    >
                      {marking === cls._id ? "Marking…" : "✓ Mark Attendance"}
                    </button>
                  )}
                  {isSessionClass && isMarked && (
                    <div className="flex items-center justify-center gap-2 py-2 text-jade-400 text-sm">
                      <span>✓</span>
                      <span>Attendance Marked</span>
                    </div>
                  )}
                  {!isSessionClass && (
                    <p className="text-xs text-ink-600 text-center py-1.5">
                      {activeSession ? "Different session active" : "No session running"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
