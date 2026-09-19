import { useWs } from "../../context/WsContext";
import Icon from "./Icon";

const STATES = {
  open: { label: "Live", className: "text-jade-400", dot: "bg-jade-400 animate-pulse_slow" },
  connecting: { label: "Connecting", className: "text-ink-300", dot: "bg-ink-400 animate-pulse" },
  reconnecting: { label: "Reconnecting", className: "text-ember-400", dot: "bg-ember-400 animate-pulse" },
  unauthorized: { label: "Signed out", className: "text-rose-400", dot: "bg-rose-400" },
  idle: { label: "Offline", className: "text-ink-400", dot: "bg-ink-500" },
};

const WsIndicator = ({ showRetry = true }) => {
  const { status, reconnect } = useWs();
  const state = STATES[status] ?? STATES.idle;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-ink-900/80 border border-ink-800">
      <span className={`w-1.5 h-1.5 rounded-full ${state.dot}`} />
      <span className={`text-xs font-mono ${state.className}`}>{state.label}</span>
      {showRetry && (status === "reconnecting" || status === "idle") && (
        <button
          type="button"
          onClick={reconnect}
          className="text-ink-400 hover:text-white transition-colors focus-ring rounded"
          aria-label="Retry connection"
          title="Retry connection"
        >
          <Icon name="refresh" size={12} />
        </button>
      )}
    </div>
  );
};

export default WsIndicator;
