import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { classService } from "../../api/classes";
import { attendanceService } from "../../api/attendance";
import { errorMessage } from "../../api/axios";
import { useWs } from "../../context/WsContext";
import { useToast } from "../../components/ui/Toast";
import useClasses from "../../hooks/useClasses";
import ClassCard from "../../components/teacher/ClassCard";
import ClassForm from "../../components/teacher/ClassForm";
import LiveAttendancePanel from "../../components/teacher/LiveAttendancePanel";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { WS_IN, WS_OUT } from "../../utils/constants";

const TeacherDashboard = () => {
  const toast = useToast();
  const { send, subscribe, activeSessions, sessionFor, connected } = useWs();
  const { classes, loading, upsert, remove } = useClasses({ onError: (m) => toast(m, "error") });

  const [stats, setStats] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadStats = useCallback(() => {
    attendanceService
      .getStats()
      .then((res) => setStats(res.data.data.stats))
      .catch(() => setStats(null));
  }, []);

  useEffect(loadStats, [loadStats]);

  useEffect(() => {
    const unsubStarted = subscribe(WS_OUT.SESSION_STARTED, (payload) =>
      toast(`Session live for ${payload.classTitle}.`, "success")
    );
    const unsubEnded = subscribe(WS_OUT.SESSION_ENDED, (payload) => {
      const { present = 0, late = 0, absent = 0 } = payload.summary ?? {};
      toast(`Session ended — ${present + late} in, ${absent} absent.`, "info");
      loadStats();
    });
    const unsubError = subscribe(WS_OUT.ERROR, (payload) => toast(payload.message, "error"));

    return () => {
      unsubStarted();
      unsubEnded();
      unsubError();
    };
  }, [subscribe, toast, loadStats]);

  const createClass = async (data) => {
    setSaving(true);
    try {
      const res = await classService.create(data);
      upsert(res.data.data.class);
      toast("Class created.", "success");
      setFormOpen(false);
      loadStats();
    } catch (error) {
      toast(errorMessage(error, "Could not create the class."), "error");
    } finally {
      setSaving(false);
    }
  };

  const updateClass = async (data) => {
    setSaving(true);
    try {
      const res = await classService.update(editing.id ?? editing._id, data);
      upsert(res.data.data.class);
      toast("Class updated.", "success");
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      toast(errorMessage(error, "Could not update the class."), "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const id = pendingDelete.id ?? pendingDelete._id;
      await classService.remove(id);
      remove(id);
      toast(`${pendingDelete.title} deleted.`, "info");
      setPendingDelete(null);
      loadStats();
    } catch (error) {
      toast(errorMessage(error, "Could not delete the class."), "error");
    } finally {
      setDeleting(false);
    }
  };

  const requireConnection = () => {
    if (connected) return true;
    toast("Not connected to the live server yet. Try again in a moment.", "warning");
    return false;
  };

  const startSession = (cls) => {
    if (requireConnection()) send(WS_IN.START_SESSION, { classId: String(cls.id ?? cls._id) });
  };
  const endSession = (cls) => {
    if (requireConnection()) send(WS_IN.END_SESSION, { classId: String(cls.id ?? cls._id) });
  };

  const liveSessions = Object.values(activeSessions);

  const tiles = [
    { label: "Classes", value: stats?.classes ?? classes.length, icon: "classes" },
    { label: "Students", value: stats?.students ?? "—", icon: "users" },
    { label: "Sessions held", value: stats?.sessions ?? "—", icon: "history" },
    {
      label: "Live now",
      value: liveSessions.length > 0 ? `${liveSessions.length} live` : "None",
      icon: "bolt",
      accent: liveSessions.length > 0,
    },
  ];

  return (
    <DashboardLayout
      title="Teacher dashboard"
      subtitle="Create classes and run live attendance sessions"
      actions={
        <button type="button" onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-primary btn-sm">
          <Icon name="plus" size={14} /> <span className="hidden sm:inline">New class</span>
        </button>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {tiles.map((tile) => (
          <div key={tile.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">{tile.label}</span>
              <span className={tile.accent ? "text-jade-400" : "text-ink-500"}>
                <Icon name={tile.icon} size={15} />
              </span>
            </div>
            <p className={`stat-value ${tile.accent ? "text-jade-300" : ""}`}>{tile.value}</p>
          </div>
        ))}
      </div>

      {stats && stats.sessions > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="stat-label">Overall attendance rate</p>
            <p className="text-sm font-bold text-white">{stats.attendanceRate}%</p>
          </div>
          <div className="w-full bg-ink-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-pulse-500 to-jade-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${stats.attendanceRate}%` }}
            />
          </div>
          <p className="text-xs text-ink-400 font-mono mt-2">
            {stats.present} present · {stats.late} late · {stats.absent} absent
          </p>
        </div>
      )}

      {liveSessions.map((session) => (
        <div key={session.classId} className="card border-jade-500/40 shadow-glow-jade mb-4 animate-fade-up">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-jade-400 animate-pulse" />
            <p className="text-sm font-semibold text-jade-300">Live: {session.classTitle}</p>
            <button
              type="button"
              onClick={() => send(WS_IN.END_SESSION, { classId: session.classId })}
              className="btn-danger btn-sm ml-auto"
            >
              <Icon name="stop" size={12} filled /> End
            </button>
          </div>
          <LiveAttendancePanel session={session} />
        </div>
      ))}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ink-200 uppercase tracking-wider font-mono">
          Your classes {!loading && `(${classes.length})`}
        </h2>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          title="No classes yet"
          message="Create your first class, then share its join code with your students."
          action={
            <button type="button" onClick={() => setFormOpen(true)} className="btn-primary">
              <Icon name="plus" size={15} /> Create a class
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => (
            <ClassCard
              key={cls.id ?? cls._id}
              cls={cls}
              session={sessionFor(cls.id ?? cls._id)}
              onEdit={(target) => { setEditing(target); setFormOpen(true); }}
              onDelete={setPendingDelete}
              onStartSession={startSession}
              onEndSession={endSession}
            />
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        title={editing ? "Edit class" : "Create a class"}
      >
        <ClassForm
          key={editing?.id ?? editing?._id ?? "new"}
          initial={editing ?? {}}
          onSubmit={editing ? updateClass : createClass}
          onCancel={() => { setFormOpen(false); setEditing(null); }}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this class?"
        message={`"${pendingDelete?.title}" and all of its sessions and attendance records will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete class"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </DashboardLayout>
  );
};

export default TeacherDashboard;
