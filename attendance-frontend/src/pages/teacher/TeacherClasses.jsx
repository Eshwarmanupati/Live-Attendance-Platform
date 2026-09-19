import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { attendanceService, downloadClassCsv } from "../../api/attendance";
import { errorMessage } from "../../api/axios";
import { useToast } from "../../components/ui/Toast";
import useClasses from "../../hooks/useClasses";
import { CardSkeleton, RowSkeleton } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import Icon from "../../components/ui/Icon";
import Spinner from "../../components/ui/Spinner";
import { formatDate, formatDateTime, formatTime } from "../../utils/formatDate";

const TeacherClasses = () => {
  const toast = useToast();
  const { classes, loading } = useClasses({ onError: (m) => toast(m, "error") });

  const [selected, setSelected] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [exporting, setExporting] = useState(false);

  const openClass = async (cls) => {
    setSelected(cls);
    setSessions([]);
    setExpanded(null);
    setSessionsLoading(true);
    try {
      const res = await attendanceService.getClassAttendance(cls.id ?? cls._id);
      const loaded = res.data.data.sessions;
      setSessions(loaded);
      // Open the most recent session, which is what a teacher wants to see.
      setExpanded(loaded[0]?.session.id ?? null);
    } catch (error) {
      toast(errorMessage(error, "Could not load attendance."), "error");
    } finally {
      setSessionsLoading(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadClassCsv(selected.id ?? selected._id);
      toast("Export downloaded.", "success");
    } catch (error) {
      toast(error.message || "Export failed.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout title="Classes" subtitle="Browse rosters and attendance history">
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-3">
          <p className="stat-label">{loading ? "Loading" : `${classes.length} classes`}</p>

          {loading ? (
            Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)
          ) : classes.length === 0 ? (
            <EmptyState title="No classes yet" message="Create a class from the dashboard first." />
          ) : (
            classes.map((cls) => {
              const id = cls.id ?? cls._id;
              const isSelected = String(selected?.id ?? selected?._id) === String(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => openClass(cls)}
                  aria-pressed={isSelected}
                  className={`card w-full text-left transition-colors duration-200 focus-ring
                    ${isSelected ? "border-pulse-500/50 shadow-glow-pulse" : "border-ink-800 hover:border-ink-700"}`}
                >
                  <h3 className="text-sm font-semibold text-white truncate">{cls.title}</h3>
                  <p className="text-xs text-ink-400 mt-1 font-mono flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1.5">
                      <Icon name="users" size={12} /> {cls.students?.length ?? 0}
                    </span>
                    <span>{formatDate(cls.createdAt)}</span>
                    <span className="badge-code">{cls.joinCode}</span>
                  </p>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <EmptyState
              icon="chart"
              title="Select a class"
              message="Pick a class to see every session it has held and who attended."
            />
          ) : (
            <div className="card">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-white truncate">{selected.title}</h2>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">
                    {sessions.length} session{sessions.length === 1 ? "" : "s"} ·{" "}
                    {selected.students?.length ?? 0} enrolled
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportCsv}
                  className="btn-ghost btn-sm"
                  disabled={exporting || sessions.length === 0}
                >
                  {exporting ? <Spinner size="sm" /> : <Icon name="download" size={14} />} CSV
                </button>
              </div>

              {selected.students?.length > 0 && (
                <div className="mb-5">
                  <p className="stat-label mb-2">Roster</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.students.map((student) => (
                      <span
                        key={student._id ?? student.id}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-ink-900 border border-ink-800 text-xs text-ink-200"
                      >
                        <span className="avatar !w-5 !h-5 !text-[10px]">
                          {student.name?.[0]?.toUpperCase()}
                        </span>
                        {student.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="stat-label mb-2">Sessions</p>
              {sessionsLoading ? (
                <RowSkeleton count={4} />
              ) : sessions.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-8">
                  No sessions held yet. Start one from the dashboard.
                </p>
              ) : (
                <ul className="space-y-2">
                  {sessions.map(({ session, records }) => {
                    const isOpen = expanded === session.id;
                    const attended = (session.summary?.present ?? 0) + (session.summary?.late ?? 0);
                    return (
                      <li key={session.id} className="rounded-xl bg-ink-900/70 border border-ink-800 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : session.id)}
                          aria-expanded={isOpen}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-ink-800/40 transition-colors focus-ring"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-ink-100">{formatDateTime(session.startedAt)}</p>
                            <p className="text-[11px] font-mono text-ink-400 mt-0.5">
                              {session.status === "active" ? (
                                <span className="text-jade-300">live now</span>
                              ) : (
                                `${attended} in · ${session.summary?.absent ?? 0} absent`
                              )}
                            </p>
                          </div>
                          <span className="text-xs font-mono text-ink-300 flex items-center gap-2">
                            {records.length} records
                            <Icon name={isOpen ? "close" : "chart"} size={13} />
                          </span>
                        </button>

                        {isOpen && (
                          <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-ink-800">
                            {records.length === 0 ? (
                              <p className="text-xs text-ink-400 py-3 text-center">Nobody marked in.</p>
                            ) : (
                              records.map((record) => (
                                <div key={record._id} className="flex items-center justify-between gap-3 px-2 py-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="avatar">
                                      {record.studentId?.name?.[0]?.toUpperCase()}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-sm text-ink-100 truncate">{record.studentId?.name}</p>
                                      <p className="text-[10px] font-mono text-ink-400 truncate">
                                        {record.studentId?.email}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <StatusBadge status={record.status} />
                                    {record.status !== "absent" && (
                                      <span className="text-[10px] font-mono text-ink-400 hidden sm:inline">
                                        {formatTime(record.markedAt)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherClasses;
