import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { classService } from "../../api/classes";
import { attendanceService } from "../../api/attendance";
import { useToast } from "../../components/ui/Toast";
import Modal from "../../components/ui/Modal";
import ClassForm from "../../components/teacher/ClassForm";
import { CardSkeleton } from "../../components/ui/Skeleton";

const TeacherClasses = () => {
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchClasses = useCallback(() => {
    classService.getAll()
      .then((r) => setClasses(r.data.data.classes))
      .catch(() => toast("Failed to load classes", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const loadAttendance = async (cls) => {
    setSelected(cls);
    setAttendanceLoading(true);
    try {
      const res = await attendanceService.getByClass(cls._id);
      setAttendance(res.data.data.attendance);
    } catch {
      toast("Failed to load attendance", "error");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setFormLoading(true);
    try {
      const res = await classService.update(editing._id, data);
      setClasses((p) => p.map((c) => (c._id === editing._id ? res.data.data.class : c)));
      toast("Class updated!", "success");
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      toast(err.response?.data?.message || "Update failed", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this class?")) return;
    try {
      await classService.delete(id);
      setClasses((p) => p.filter((c) => c._id !== id));
      if (selected?._id === id) setSelected(null);
      toast("Class deleted", "info");
    } catch {
      toast("Failed to delete", "error");
    }
  };

  return (
    <DashboardLayout title="All Classes" subtitle="View and manage your classes">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-mono text-ink-500 uppercase tracking-wider mb-3">
            {classes.length} Classes
          </p>
          {loading ? (
            [...Array(3)].map((_, i) => <CardSkeleton key={i} />)
          ) : classes.map((cls) => (
            <div
              key={cls._id}
              onClick={() => loadAttendance(cls)}
              className={`card cursor-pointer transition-all duration-200
                ${selected?._id === cls._id ? "border-pulse-500/50 shadow-glow-pulse" : "border-ink-800 hover:border-ink-700"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{cls.title}</h3>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {cls.students?.length || 0} students · {new Date(cls.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(cls); setModalOpen(true); }}
                    className="p-1.5 rounded-lg hover:bg-ink-700 text-ink-500 hover:text-white transition-colors text-xs"
                  >✎</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(cls._id); }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-ink-500 hover:text-rose-400 transition-colors text-xs"
                  >✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <div className="card text-center py-20 border-dashed border-ink-800 h-full flex flex-col items-center justify-center">
              <p className="text-3xl mb-3">◫</p>
              <p className="text-ink-500 text-sm">Select a class to view attendance records</p>
            </div>
          ) : (
            <div className="card h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">{selected.title}</h2>
                  <p className="text-xs text-ink-500 font-mono">Attendance Records</p>
                </div>
                <span className="text-xs font-mono bg-pulse-500/10 text-pulse-400 border border-pulse-500/20 px-2 py-1 rounded-full">
                  {attendance.length} records
                </span>
              </div>

              {attendanceLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-ink-800 animate-pulse rounded-lg" />)}
                </div>
              ) : attendance.length === 0 ? (
                <p className="text-ink-600 text-sm text-center py-10">No attendance records yet</p>
              ) : (
                <div className="space-y-1.5 overflow-y-auto max-h-[500px] pr-1">
                  {attendance.map((r) => (
                    <div key={r._id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-ink-900 border border-ink-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-pulse-600/20 flex items-center justify-center text-xs font-bold text-pulse-300">
                          {r.studentId?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-ink-200">{r.studentId?.name}</p>
                          <p className="text-[10px] font-mono text-ink-600">{r.studentId?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full border
                          ${r.status === "present"
                            ? "text-jade-400 bg-jade-500/10 border-jade-500/30"
                            : "text-rose-400 bg-rose-500/10 border-rose-500/30"}`}>
                          {r.status}
                        </span>
                        <span className="text-[10px] font-mono text-ink-600">
                          {new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title="Edit Class">
        <ClassForm
          key={editing?._id || "new"}
          initial={editing || {}}
          onSubmit={handleUpdate}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          loading={formLoading}
        />
      </Modal>
    </DashboardLayout>
  );
};

export default TeacherClasses;
