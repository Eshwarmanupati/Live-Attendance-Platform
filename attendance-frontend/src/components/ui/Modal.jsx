import { useEffect } from "react";

const Modal = ({ open, onClose, title, children }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md glass rounded-2xl shadow-2xl animate-fade-up border border-ink-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-800">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-ink-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ink-800"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
