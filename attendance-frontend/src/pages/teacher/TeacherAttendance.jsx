import { useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useWs } from "../../context/WsContext";
import { useToast } from "../../components/ui/Toast";
import useClasses from "../../hooks/useClasses";
import LiveAttendancePanel from "../../components/teacher/LiveAttendancePanel";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import { RowSkeleton } from "../../components/ui/Skeleton";
import { WS_IN, WS_OUT } from "../../utils/constants";

const TeacherAttendance = () => {
  const toast = useToast();
  const { send, subscribe, activeSessions, sessionFor, connected } = useWs();
  const { classes, loading } = useClasses({ onError: (m) => toast(m, "error") });

  useEffect(() => {
    const unsubEnded = subscribe(WS_OUT.SESSION_ENDED, (payload) => {
      const { present = 0, late = 0, absent = 0 } = payload.summary ?? {};
      toast(`${payload.classTitle}: ${present + late} attended, ${absent} absent.`, "info");
    });
    const unsubError = subscribe(WS_OUT.ERROR, (payload) => toast(payload.message, "error"));
    return () => {
      unsubEnded();
      unsubError();
    };
  }, [subscribe, toast]);

  const act = (event, classId) => {
    if (!connected) {
      toast("Not connected to the live server yet. Try again in a moment.", "warning");
      return;
    }
    send(event, { classId: String(classId) });
  };

  const live = Object.values(activeSessions);

  return (
    <DashboardLayout
      title="Live sessions"
      subtitle="Open a session and watch students mark in"
    >
      <div className="max-w-3xl space-y-4">
        {live.map((session) => (
          <div key={session.classId} className="card border-jade-500/40 shadow-glow-jade animate-fade-up">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-jade-400 animate-pulse" />
              <p className="text-sm font-semibold text-jade-300">{session.classTitle}</p>
              <span className="badge-active ml-auto">Live</span>
            </div>
            <LiveAttendancePanel session={session} />
            <button
              type="button"
              onClick={() => act(WS_IN.END_SESSION, session.classId)}
              className="btn-danger w-full mt-4"
            >
              <Icon name="stop" size={14} filled /> End session
            </button>
          </div>
        ))}

        <div className="card">
          <p className="stat-label mb-3">
            {live.length > 0 ? "Start another class" : "Choose a class to start"}
          </p>

          {loading ? (
            <RowSkeleton count={3} />
          ) : classes.length === 0 ? (
            <EmptyState title="No classes yet" message="Create a class before running a session." />
          ) : (
            <ul className="space-y-2">
              {classes.map((cls) => {
                const id = cls.id ?? cls._id;
                const session = sessionFor(id);
                return (
                  <li
                    key={id}
                    className={`list-row ${session ? "!bg-jade-500/5 !border-jade-500/30" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{cls.title}</p>
                      <p className="text-xs text-ink-400 font-mono flex items-center gap-1.5">
                        <Icon name="users" size={12} /> {cls.students?.length ?? 0} enrolled
                        {(cls.students?.length ?? 0) === 0 && (
                          <span className="text-ember-400">· share code {cls.joinCode}</span>
                        )}
                      </p>
                    </div>
                    {session ? (
                      <span className="badge-active flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-jade-400 animate-pulse" /> Live
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => act(WS_IN.START_SESSION, id)}
                        className="btn-success btn-sm flex-shrink-0"
                      >
                        <Icon name="play" size={12} filled /> Start
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherAttendance;
