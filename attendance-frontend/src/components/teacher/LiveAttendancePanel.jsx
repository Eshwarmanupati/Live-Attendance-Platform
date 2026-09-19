import { useState, useEffect, useMemo } from "react";
import { useWs } from "../../context/WsContext";
import { attendanceService } from "../../api/attendance";
import { WS_OUT, ATTENDANCE_STATUS } from "../../utils/constants";
import { formatTime, elapsedSince } from "../../utils/formatDate";
import { RowSkeleton } from "../ui/Skeleton";
import StatusBadge from "../ui/StatusBadge";
import Icon from "../ui/Icon";

/** Ticks once a second so the session timer stays honest. */
const useElapsed = (startedAt) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!startedAt) return undefined;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  return startedAt ? elapsedSince(startedAt) : null;
};

const LiveAttendancePanel = ({ session }) => {
  const { subscribe } = useWs();
  const { classId, sessionId, startedAt, enrolled } = session;
  const [records, setRecords] = useState([]);
  // A panel is mounted per session (keyed by class), so the initial value is
  // all that is needed — no synchronous reset inside the effect.
  const [loading, setLoading] = useState(Boolean(sessionId));
  const elapsed = useElapsed(startedAt);

  // Load whatever was already marked, so a teacher refreshing mid-session sees
  // the full roster rather than only the marks that arrive from now on.
  useEffect(() => {
    if (!sessionId) return undefined;

    let cancelled = false;
    attendanceService
      .getSessionAttendance(sessionId)
      .then((res) => {
        if (!cancelled) setRecords(res.data.data.records ?? []);
      })
      .catch(() => {
        if (!cancelled) setRecords([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    return subscribe(WS_OUT.ATTENDANCE_UPDATED, (payload) => {
      if (String(payload.classId) !== String(classId)) return;

      setRecords((prev) => {
        const alreadyListed = prev.some(
          (record) => String(record.studentId?._id ?? record.studentId) === String(payload.student.id)
        );
        if (alreadyListed) return prev;

        return [
          ...prev,
          {
            _id: `live-${payload.student.id}`,
            studentId: { _id: payload.student.id, name: payload.student.name },
            status: payload.status,
            markedAt: payload.markedAt,
            isNew: true,
          },
        ];
      });
    });
  }, [classId, subscribe]);

  const counts = useMemo(() => {
    const present = records.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length;
    const late = records.filter((r) => r.status === ATTENDANCE_STATUS.LATE).length;
    return { present, late, attended: present + late };
  }, [records]);

  const total = enrolled ?? 0;
  const percentage = total > 0 ? Math.round((counts.attended / total) * 100) : 0;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3 justify-between mb-3">
        <div className="flex items-center gap-3">
          <p className="stat-label">Marked in</p>
          <span className="badge-active">
            {counts.attended}
            {total > 0 ? ` / ${total}` : ""} present
          </span>
          {counts.late > 0 && (
            <span className="text-xs font-mono text-ember-400">{counts.late} late</span>
          )}
        </div>
        {elapsed && (
          <span className="flex items-center gap-1.5 text-xs font-mono text-ink-300">
            <Icon name="clock" size={13} /> {elapsed}
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="w-full bg-ink-800 rounded-full h-1.5 mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-pulse-500 to-jade-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={counts.attended}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label="Students marked in"
          />
        </div>
      )}

      {loading ? (
        <RowSkeleton count={3} />
      ) : records.length === 0 ? (
        <p className="text-sm text-ink-400 text-center py-8">
          Waiting for students to mark in…
        </p>
      ) : (
        <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {records.map((record) => (
            <li
              key={record._id}
              className={`list-row ${record.isNew ? "animate-slide-in border-jade-500/30" : ""}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="avatar">{record.studentId?.name?.[0]?.toUpperCase()}</span>
                <span className="text-sm text-ink-100 truncate">{record.studentId?.name ?? "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={record.status} />
                <span className="text-[11px] font-mono text-ink-400 hidden sm:inline">
                  {formatTime(record.markedAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LiveAttendancePanel;
