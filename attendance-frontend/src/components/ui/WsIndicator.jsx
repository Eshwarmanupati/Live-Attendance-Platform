import { useWs } from "../../context/WsContext";

const WsIndicator = () => {
  const { connected } = useWs();
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink-900 border border-ink-800">
      <span
        className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-jade-400 animate-pulse_slow" : "bg-rose-400"}`}
      />
      <span className={`text-xs font-mono ${connected ? "text-jade-400" : "text-rose-400"}`}>
        {connected ? "LIVE" : "OFF"}
      </span>
    </div>
  );
};

export default WsIndicator;
