import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { attendanceService } from "../../api/attendance";
import { useWs } from "../../context/WsContext";
import { useToast } from "../../components/ui/Toast";
import useClasses from "../../hooks/useClasses";
import { CardSkeleton } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";
import Icon from "../../components/ui/Icon";
import { WS_IN, WS_OUT, ROUTES } from "../../utils/constants";
import { formatTime } from "../../utils/formatDate";

const StudentDashboard = () => {
  const toast = useToast();
  const { send, subscribe, activeSessions, sessionFor, connected } = useWs();
  const { classes, loading } = useClasses({ onError: (m) => toast(m, "error") });

  const [summary, setSummary] = useState(null);
  /** classId -> attendance status, for sessions marked in this browser session. */
  const [marked, setMarked] = useState({});
  const [marking, setMarking] = useState(null);

  const loadSummary = useCallback(() => {
    attendanceService
      .getMySummary()
      .then((res) => setSummary(res.data.data))
      .catch(() => setSummary(null));
  }, []);

  useEffect(loadSummary, [loadSummary]);

  useEffect(() => {
    const unsubStarted = subscribe(WS_OUT.SESSION_STARTED, (payload) => {
      toast(`${payload.classTitle} is live — mark yourself present.`, "info");
      // A new session for this class means the previous mark no longer applies.
      setMarked((prev) => {
        const next = { ...prev };
        delete next[String(payload.classId)];
        return next;
      });
    });

    const unsubConfirmed = subscribe(WS_OUT.ATTENDANCE_CONFIRMED, (payload) => {
      setMarked((prev) => ({ ...prev, [String(payload.classId)]: payload.status }));
      setMarking(null);
      toast(
        payload.status === "late" ? "Marked present, recorded as late." : "You are marked present.",
        payload.status === "late" ? "warning" : "success"
      );
      loadSummary();
    });

    const unsubEnded = subscribe(WS_OUT.SESSION_ENDED, (payload) => {
      toast(`${payload.classTitle} session ended.`, "info");
      setMarked((prev) => {
        const next = { ...prev };
        delete next[String(payload.classId)];
        return next;
      });
      loadSummary();
    });

    const unsubError = subscribe(WS_OUT.ERROR, (payload) => {
      toast(payload.message, payload.code === "ALREADY_MARKED" ? "warning" : "error");
      setMarking(null);
      // Reconcile: the server says we are already counted for this session.
      if (payload.code === "ALREADY_MARKED") loadSummary();
    });

    return () => {
      unsubStarted();
      unsubConfirmed();
      unsubEnded();
      unsubError();
    };
  }, [subscribe, toast, loadSummary]);

  const markPresent = (classId) => {
    if (!connected) {
      toast("Not connected to the live server yet. Try again in a moment.", "warning");
      return;
    }
    setMarking(String(classId));
    send(WS_IN.MARK_ATTENDANCE, { classId: String(classId) });
  };

  const live = Object.values(activeSessions);

  return (
    <DashboardLayout
      title="Student dashboard"
      subtitle="Mark yourself present while a session is live"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="stat-card">
          <span className="stat-label">Classes</span>
          <p className="stat-value">{classes.length}</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Attendance rate</span>
          <p className="stat-value">{summary ? `${summary.totals.rate}%` : "—"}</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Sessions attended</span>
          <p className="stat-value">
            {summary ? `${summary.totals.attended}/${summary.totals.sessions}` : "—"}
          </p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Live now</span>
          <p className={`stat-value ${live.length > 0 ? "text-jade-300" : ""}`}>
            {live.length > 0 ? `${live.length} live` : "None"}
          </p>
        </div>
      </div>

      {live.length > 0 && (
        <div className="space-y-3 mb-6">
          {live.map((session) => {
            const status = marked[String(session.classId)];
            const isMarking = marking === String(session.classId);
            return (
              <div
                key={session.classId}
                className="card border-jade-500/40 shadow-glow-jade animate-fade-up"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-jade-400 animate-pulse mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-jade-300 truncate">
                        {session.classTitle}
                      </p>
                      <p className="text-xs text-ink-400 font-mono mt-0.5">
                        Started {formatTime(session.startedAt)}
                      </p>
                    </div>
                  </div>
                  {status ? (
                    <StatusBadge status={status} className="self-start sm:self-auto" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => markPresent(session.classId)}
                      disabled={isMarking}
                      className="btn-success-solid w-full sm:w-auto flex-shrink-0"
                    >
                      {isMarking ? <Spinner size="sm" /> : <Icon name="check" size={16} />}
                      Mark me present
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="text-sm font-semibold text-ink-200 uppercase tracking-wider font-mono mb-4">
        My classes
      </h2>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          title="You have not joined a class yet"
          message="Ask your teacher for their six-character join code."
          action={
            <Link to={ROUTES.STUDENT_CLASSES} className="btn-primary">
              <Icon name="key" size={15} /> Join a class
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => {
            const id = cls.id ?? cls._id;
            const session = sessionFor(id);
            const status = marked[String(id)];
            const classSummary = summary?.classes.find(
              (row) => String(row.class.id) === String(id)
            );

            return (
              <div
                key={id}
                className={`card flex flex-col transition-colors duration-300
                  ${session ? "border-jade-500/40 shadow-glow-jade" : "border-ink-800 hover:border-ink-700"}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{cls.title}</h3>
                    <p className="text-xs text-ink-400 mt-0.5 flex items-center gap-1.5 font-mono">
                      <Icon name="user" size={12} /> {cls.teacher?.name ?? "Teacher"}
                    </p>
                  </div>
                  {session && (
                    <span className="badge-active flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-jade-400 animate-pulse" /> Live
                    </span>
                  )}
                </div>

                {classSummary && (
                  <p className="text-xs text-ink-400 font-mono mb-3">
                    {classSummary.attended}/{classSummary.sessions} sessions
                    {classSummary.rate !== null && ` · ${classSummary.rate}%`}
                  </p>
                )}

                <div className="border-t border-ink-800 pt-3 mt-auto">
                  {session && status ? (
                    <div className="flex justify-center">
                      <StatusBadge status={status} />
                    </div>
                  ) : session ? (
                    <button
                      type="button"
                      onClick={() => markPresent(id)}
                      disabled={marking === String(id)}
                      className="btn-success w-full"
                    >
                      {marking === String(id) ? <Spinner size="sm" /> : <Icon name="check" size={14} />}
                      Mark present
                    </button>
                  ) : (
                    <p className="text-xs text-ink-400 text-center py-1.5">No session running</p>
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
