import Icon from "./Icon";
import { ATTENDANCE_STATUS } from "../../utils/constants";

const VARIANTS = {
  [ATTENDANCE_STATUS.PRESENT]: { label: "Present", icon: "check", className: "text-jade-400 bg-jade-500/10 border-jade-500/30" },
  [ATTENDANCE_STATUS.LATE]: { label: "Late", icon: "clock", className: "text-ember-400 bg-ember-400/10 border-ember-400/30" },
  [ATTENDANCE_STATUS.ABSENT]: { label: "Absent", icon: "close", className: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
};

const StatusBadge = ({ status, className = "" }) => {
  const variant = VARIANTS[status];
  if (!variant) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${variant.className} ${className}`}
    >
      <Icon name={variant.icon} size={12} />
      {variant.label}
    </span>
  );
};

export default StatusBadge;
