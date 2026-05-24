import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { classService } from "../../api/classes";
import { useWs } from "../../context/WsContext";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../context/AuthContext";
import ClassCard from "../../components/teacher/ClassCard";
import LiveAttendancePanel from "../../components/teacher/LiveAttendancePanel";
import Modal from "../../components/ui/Modal";
import ClassForm from "../../components/teacher/ClassForm";
import { CardSkeleton } from "../../components/ui/Skeleton";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { send, subscribe, activeSession } = useWs();
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await classService.getAll();
      setClasses(res.data.data.classes);
    } catch {
      toast("Failed to load classes", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchClasses();
    });
    return () => { active = false; };
  }, [fetchClasses]);

  useEffect(() => {
    const unsub1 = subscribe("SESSION_STARTED", () => {
      toast("Session started", "success");
    });
    const unsub2 = subscribe("SESSION_ENDED", (payload) => {
      toast(`Session ended. ${payload.finalPresentCount} students present.`, "info");
    });
    return () => { unsub1(); unsub2(); };
  }, [subscribe, toast]);

  const handleCreate = async (data) => {
    setFormLoading(true);
    try {
      const res = await classService.create(data);
      setClasses((p) => [res.data.data.class, ...p]);
      toast("Class created!", "success");
      setModalOpen(false);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to create class", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setFormLoading(true);
    try {
      const res = await classService.update(editing._id, data);
      setClasses((p) => p.map((c) => (c._id === editing._id ? res.data.data.class : c)));
      toast("Class updated!", "success");
      setEditing(null);
      setModalOpen(false);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to update class", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this class?")) return;
    try {
      await classService.delete(id);
      setClasses((p) => p.filter((c) => c._id !== id));
      toast("Class deleted", "info");
    } catch {
      toast("Failed to delete class", "error");
    }
  };

  const handleStartSession = (classId) => send("START_SESSION", { classId });
  const handleEndSession = (classId) => send("END_SESSION", { classId });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (cls) => { setEditing(cls); setModalOpen(true); };

  return (
    <DashboardLayout
      title="Teacher Dashboard"
      subtitle="Manage your classes and live attendance sessions"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Classes", value: classes.length, icon: "◫" },
          { label: "Active Session", value: activeSession ? "1 LIVE" : "None", icon: "⊙", accent: activeSession ? "jade" : null },
          { label: "Total Students", value: classes.reduce((acc, c) => acc + (c.students?.length || 0), 0), icon: "👥" },
          { label: "Your Name", value: user?.name, icon: "👤" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-ink-500 uppercase tracking-wider">{s.label}</span>
              <span className="text-ink-600">{s.icon}</span>
            </div>
            <p className={`text-lg font-bold ${s.accent === "jade" ? "text-jade-400" : "text-white"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {activeSession && (
        <div className="card border-jade-500/40 shadow-glow-jade mb-6 animate-fade-up">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-jade-400 animate-pulse" />
            <p className="text-sm font-semibold text-jade-300">Live Session Active</p>
            <span className="text-xs font-mono text-ink-500 ml-auto">
              {activeSession.classTitle}
            </span>
          </div>
          <LiveAttendancePanel classId={activeSession.classId} />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ink-300 uppercase tracking-wider font-mono">
          Your Classes ({classes.length})
        </h2>
        <button onClick={openCreate} className="btn-primary text-xs px-4 py-2">
          + New Class
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-ink-700">
          <p className="text-4xl mb-3">◫</p>
          <p className="text-ink-400 text-sm">No classes yet.</p>
          <button onClick={openCreate} className="btn-primary mt-4 text-xs">
            Create your first class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <ClassCard
              key={cls._id}
              cls={cls}
              sessionClassId={activeSession?.classId}
              onEdit={openEdit}
              onDelete={handleDelete}
              onStartSession={handleStartSession}
              onEndSession={handleEndSession}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? "Edit Class" : "Create New Class"}
      >
        <ClassForm
          key={editing?._id || "new"}
          initial={editing || {}}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          loading={formLoading}
        />
      </Modal>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
