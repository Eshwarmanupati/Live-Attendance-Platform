/**
 * Displays a single class with teacher actions:
 * edit, delete, start/end attendance session.
 */
const ClassCard = ({ cls, sessionClassId, onEdit, onDelete, onStartSession, onEndSession }) => {
  const isActive = sessionClassId === cls._id;

  return (
    <div className={`card group transition-all duration-300 hover:border-ink-700
      ${isActive ? "border-jade-500/40 shadow-glow-jade" : "border-ink-800"}`}
    >
      {/* Status badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate group-hover:text-pulse-300 transition-colors">
            {cls.title}
          </h3>
          <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">
            {cls.description || "No description"}
          </p>
        </div>
        {isActive && (
          <span className="badge-active ml-2 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-jade-400 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-ink-500 font-mono mb-4">
        <span>👥 {cls.students?.length || 0} students</span>
        <span>·</span>
        <span>{new Date(cls.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 border-t border-ink-800 pt-3">
        {!isActive ? (
          <button onClick={() => onStartSession(cls._id)} className="btn-success text-xs">
            ▶ Start Session
          </button>
        ) : (
          <button onClick={() => onEndSession(cls._id)} className="btn-danger text-xs">
            ■ End Session
          </button>
        )}
        <button onClick={() => onEdit(cls)} className="btn-ghost text-xs px-3 py-1.5">
          ✎ Edit
        </button>
        <button onClick={() => onDelete(cls._id)} className="btn-danger text-xs px-3 py-1.5">
          ✕ Delete
        </button>
      </div>
    </div>
  );
};

export default ClassCard;
