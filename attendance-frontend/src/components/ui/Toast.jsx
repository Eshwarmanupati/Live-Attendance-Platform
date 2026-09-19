import { useState, useCallback, createContext, useContext, useMemo, useRef, useEffect } from "react";
import Icon from "./Icon";

const ToastContext = createContext(null);

const VARIANTS = {
  success: { icon: "check", className: "border-jade-500/40 bg-jade-500/10 text-jade-300" },
  error: { icon: "alert", className: "border-rose-500/40 bg-rose-500/10 text-rose-300" },
  info: { icon: "info", className: "border-pulse-500/40 bg-pulse-500/10 text-pulse-300" },
  warning: { icon: "alert", className: "border-ember-400/40 bg-ember-400/10 text-ember-400" },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Set());

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (message, type = "info", { duration = 4000 } = {}) => {
      const id = (idRef.current += 1);
      setToasts((prev) => {
        // Cap the stack so a burst of WebSocket errors cannot cover the screen.
        const next = [...prev, { id, message, type }];
        return next.slice(-4);
      });

      const timer = setTimeout(() => {
        dismiss(id);
        timersRef.current.delete(timer);
      }, duration);
      timersRef.current.add(timer);

      return id;
    },
    [dismiss]
  );

  // Clear pending timers on unmount so nothing writes to a dead component.
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 left-4 sm:left-auto z-[9999] flex flex-col gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const variant = VARIANTS[t.type] ?? VARIANTS.info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border glass-lighter
                          text-sm sm:max-w-sm animate-fade-up shadow-card ${variant.className}`}
            >
              <Icon name={variant.icon} size={16} className="mt-0.5" />
              <span className="text-ink-100 flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-ink-400 hover:text-white transition-colors"
                aria-label="Dismiss notification"
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
};
