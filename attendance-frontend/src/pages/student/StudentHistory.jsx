import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { attendanceService } from "../../api/attendance";
import { errorMessage } from "../../api/axios";
import { useToast } from "../../components/ui/Toast";
import { RowSkeleton } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import Icon from "../../components/ui/Icon";
import { formatDateTime } from "../../utils/formatDate";
import { ROUTES } from "../../utils/constants";

const rateColour = (rate) => {
  if (rate === null) return "text-ink-300";
  if (rate >= 85) return "text-jade-300";
  if (rate >= 70) return "text-ember-400";
  return "text-rose-300";
};

const StudentHistory = () => {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  /**
   * One request for everything. This page used to fire a request per class and
   * then treat "a record exists" as attendance for the whole class.
   */
  useEffect(() => {
    let cancelled = false;
    attendanceService
      .getMySummary()
      .then((res) => {
        if (!cancelled) setSummary(res.data.data);
      })
      .catch((error) => {
        if (!cancelled) toast(errorMessage(error, "Could not load your history."), "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = summary?.totals;

  return (
    <DashboardLayout title="Attendance history" subtitle="Your record across every class">
      <div className="max-w-3xl">
        {loading ? (
          <RowSkeleton count={5} />
        ) : !summary || summary.classes.length === 0 ? (
          <EmptyState
            icon="history"
            title="No history yet"
            message="Once you join a class and attend a session, it shows up here."
            action={
              <Link to={ROUTES.STUDENT_CLASSES} className="btn-primary">
                <Icon name="key" size={15} /> Join a class
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="stat-card">
                <span className="stat-label">Rate</span>
                <p className={`stat-value ${rateColour(totals.rate)}`}>{totals.rate}%</p>
              </div>
              <div className="stat-card">
                <span className="stat-label">Present</span>
                <p className="stat-value text-jade-300">{totals.present}</p>
              </div>
              <div className="stat-card">
                <span className="stat-label">Late</span>
                <p className="stat-value text-ember-400">{totals.late}</p>
              </div>
              <div className="stat-card">
                <span className="stat-label">Absent</span>
                <p className="stat-value text-rose-300">{totals.absent}</p>
              </div>
            </div>

            <div className="card mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="stat-label">
                  Attended {totals.attended} of {totals.sessions} sessions
                </p>
                <p className="text-sm font-bold text-white">{totals.rate}%</p>
              </div>
              <div className="w-full bg-ink-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-pulse-500 to-jade-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${totals.rate}%` }}
                  role="progressbar"
                  aria-valuenow={totals.rate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Overall attendance rate"
                />
              </div>
            </div>

            <h2 className="text-sm font-semibold text-ink-200 uppercase tracking-wider font-mono mb-3">
              By class
            </h2>

            <ul className="space-y-2">
              {summary.classes.map((row) => {
                const isOpen = expanded === row.class.id;
                return (
                  <li key={row.class.id} className="rounded-xl bg-ink-900/70 border border-ink-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : row.class.id)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-ink-800/40 transition-colors focus-ring"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{row.class.title}</p>
                        <p className="text-[11px] font-mono text-ink-400 mt-0.5">
                          {row.class.teacher?.name} · {row.present} present · {row.late} late ·{" "}
                          {row.absent} absent
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className={`text-sm font-bold ${rateColour(row.rate)}`}>
                            {row.rate === null ? "—" : `${row.rate}%`}
                          </p>
                          <p className="text-[10px] font-mono text-ink-400">
                            {row.attended}/{row.sessions}
                          </p>
                        </div>
                        <Icon name={isOpen ? "close" : "history"} size={14} className="text-ink-400" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-ink-800 px-3 py-2 space-y-1">
                        {row.records.length === 0 ? (
                          <p className="text-xs text-ink-400 text-center py-3">
                            No sessions recorded for this class yet.
                          </p>
                        ) : (
                          row.records.map((record) => (
                            <div
                              key={record._id}
                              className="flex items-center justify-between gap-3 px-2 py-2"
                            >
                              <span className="text-xs font-mono text-ink-300">
                                {formatDateTime(record.markedAt)}
                              </span>
                              <StatusBadge status={record.status} />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentHistory;
