import { useEffect, useRef } from "react";
import Icon from "./Icon";

const Modal = ({ open, onClose, title, children, size = "md" }) => {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    // Move focus into the dialog, and keep Tab inside it while it is open.
    const focusFirst = () => {
      const target = panelRef.current?.querySelector(
        "input, textarea, select, button:not([data-close])"
      );
      (target ?? panelRef.current)?.focus();
    };
    focusFirst();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative w-full ${widths[size]} glass rounded-t-2xl sm:rounded-2xl shadow-2xl
                    animate-fade-up border border-ink-700 max-h-[92vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-ink-800 sticky top-0 glass z-10">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            type="button"
            data-close
            onClick={onClose}
            className="text-ink-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ink-800 focus-ring"
            aria-label="Close"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
