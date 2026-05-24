import { useState, useCallback, createContext, useContext } from "react";

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
  const styles = {
    success: "border-jade-500/40 bg-jade-500/10 text-jade-300",
    error: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    info: "border-pulse-500/40 bg-pulse-500/10 text-pulse-300",
    warning: "border-ember-400/40 bg-ember-400/10 text-ember-400",
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border glass-lighter
                        text-sm font-display max-w-sm animate-fade-up shadow-card ${styles[t.type]}`}
          >
            <span className="text-base leading-none">{icons[t.type]}</span>
            <span className="text-ink-200">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be within ToastProvider");
  return ctx.toast;
};
