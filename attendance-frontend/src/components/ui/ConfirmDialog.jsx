import Modal from "./Modal";
import Spinner from "./Spinner";

/**
 * Replaces window.confirm, which cannot be styled, is blocked in some embedded
 * browsers, and froze the whole page while open.
 */
const ConfirmDialog = ({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => (
  <Modal open={open} onClose={loading ? () => {} : onCancel} title={title} size="sm">
    <p className="text-sm text-ink-300 leading-relaxed">{message}</p>
    <div className="flex gap-2 justify-end mt-6">
      <button type="button" className="btn-ghost" onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </button>
      <button
        type="button"
        className={destructive ? "btn-danger-solid" : "btn-primary"}
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" /> Working…
          </span>
        ) : (
          confirmLabel
        )}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
