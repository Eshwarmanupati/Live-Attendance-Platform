import Icon from "./Icon";

const EmptyState = ({ icon = "classes", title, message, action }) => (
  <div className="card text-center py-14 border-dashed border-ink-700">
    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-ink-800/60 text-ink-400 mb-4">
      <Icon name={icon} size={22} />
    </span>
    <p className="text-sm font-semibold text-ink-200">{title}</p>
    {message && <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto">{message}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export default EmptyState;
