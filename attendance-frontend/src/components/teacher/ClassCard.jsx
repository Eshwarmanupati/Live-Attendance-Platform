import { useState } from "react";
import Icon from "../ui/Icon";
import { formatDate } from "../../utils/formatDate";

const ClassCard = ({ cls, session, onEdit, onDelete, onStartSession, onEndSession, busy }) => {
  const [copied, setCopied] = useState(false);
  const isLive = Boolean(session);

  const copyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(cls.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked; the code is displayed either way.
    }
  };

  return (
    <div
      className={`card flex flex-col transition-colors duration-300
        ${isLive ? "border-jade-500/40 shadow-glow-jade" : "border-ink-800 hover:border-ink-700"}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-white truncate">{cls.title}</h3>
          <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">
            {cls.description || "No description"}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isLive && (
            <span className="badge-active mr-1">
              <span className="w-1.5 h-1.5 rounded-full bg-jade-400 animate-pulse" />
              Live
            </span>
          )}
          {/* Secondary actions sit here as icon buttons so the card keeps a
              single row of controls at the bottom. */}
          <button
            type="button"
            onClick={() => onEdit(cls)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-400 hover:text-white hover:bg-ink-800 transition-colors focus-ring"
            aria-label={`Edit ${cls.title}`}
            title="Edit class"
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(cls)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors focus-ring"
            aria-label={`Delete ${cls.title}`}
            title="Delete class"
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-400 font-mono mb-4">
        <span className="flex items-center gap-1.5">
          <Icon name="users" size={13} /> {cls.students?.length ?? 0}
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="clock" size={13} /> {formatDate(cls.createdAt)}
        </span>
        <button
          type="button"
          onClick={copyJoinCode}
          className="badge-code hover:border-pulse-500/50 transition-colors focus-ring"
          title="Copy join code"
        >
          <Icon name={copied ? "check" : "copy"} size={11} />
          {cls.joinCode}
        </button>
      </div>

      <div className="border-t border-ink-800 pt-3 mt-auto">
        {isLive ? (
          <button type="button" onClick={() => onEndSession(cls)} className="btn-danger w-full" disabled={busy}>
            <Icon name="stop" size={14} filled /> End session
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onStartSession(cls)}
            className="btn-success w-full"
            disabled={busy}
          >
            <Icon name="play" size={14} filled /> Start session
          </button>
        )}
      </div>
    </div>
  );
};

export default ClassCard;
