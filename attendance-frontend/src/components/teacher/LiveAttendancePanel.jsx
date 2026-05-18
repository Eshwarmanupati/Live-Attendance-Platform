import { useState, useEffect } from "react";
import { useWs } from "../../context/WsContext";
import { attendanceService } from "../../api/attendance";

/**
 * Real-time attendance panel shown during an active teacher session.
 * Subscribes to WS ATTENDANCE_UPDATED events and shows live count.
 */
const LiveAttendancePanel = ({ classId }) => {
  const { subscribe } = useWs();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load existing attendance records for this session
  useEffect(() => {
    if (!classId) return;
    attendanceService.getByClass(classId)
      .then((res) => setRecords(res.data.data.attendance || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [classId]);

  // Subscribe to live attendance updates
  useEffect(() => {
    const unsub = subscribe("ATTENDANCE_UPDATED", (payload) => {
      if (payload.classId !== classId) return;
      // Add new student entry to the top
      setRecords((prev) => {
        const exists = prev.some((r) => r.studentId?._id === payload.studentId || r.studentId === payload.studentId);
        if (exists) return prev;
        return [
          {
            _id: Date.now(),
            studentId: { _id: payload.studentId, name: payload.studentName },
            status: "present",
            timestamp: payload.timestamp,
            isNew: true,
          },
          ...prev,
        ];
      });
    });
    return unsub;
  }, [classId, subscribe]);

  if (loading) {
    return (
      <div className="space-y-2 mt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 bg-ink-800 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-mono text-ink-400 uppercase tracking-wider">Present Students</p>
        <span className="text-xs font-mono bg-jade-500/15 text-jade-400 border border-jade-500/30 px-2 py-0.5 rounded-full">
          {records.length} present
        </span>
      </div>

      {records.length === 0 ? (
        <p className="text-xs text-ink-600 text-center py-6">Waiting for students to mark attendance…</p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {records.map((r, idx) => (
            <div
              key={r._id}
              className={`flex items-center justify-between px-3 py-2 rounded-lg bg-ink-900 border border-ink-800
                ${r.isNew ? "animate-slide-in border-jade-500/30" : ""}`}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-pulse-600/20 flex items-center justify-center text-pulse-300 text-xs font-bold">
                  {r.studentId?.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-ink-200">{r.studentId?.name || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-jade-400">✓ present</span>
                <span className="text-[10px] font-mono text-ink-600">
                  {new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveAttendancePanel;
