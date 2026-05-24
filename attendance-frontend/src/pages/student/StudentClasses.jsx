import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { classService } from "../../api/classes";
import { useToast } from "../../components/ui/Toast";
import { CardSkeleton } from "../../components/ui/Skeleton";

const StudentClasses = () => {
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    classService.getAll()
      .then((r) => setClasses(r.data.data.classes))
      .catch(() => toast("Failed to load classes", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  const filtered = classes.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="My Classes" subtitle="Browse all available classes">
      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          className="input-field max-w-sm"
          placeholder="Search classes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-ink-700">
          <p className="text-4xl mb-3">◫</p>
          <p className="text-ink-400 text-sm">{search ? "No classes match your search" : "No classes available"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cls) => (
            <div key={cls._id} className="card border-ink-800 hover:border-ink-700 transition-all duration-200">
              <h3 className="font-semibold text-white mb-1">{cls.title}</h3>
              <p className="text-xs text-ink-500 line-clamp-2 mb-3">{cls.description || "No description"}</p>
              <div className="text-xs font-mono text-ink-500 space-y-1">
                <p>👨‍🏫 {cls.teacher?.name}</p>
                <p>🗓 {new Date(cls.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentClasses;
