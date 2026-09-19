import { useAuth } from "../../context/AuthContext";
import Icon from "../ui/Icon";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const Topbar = ({ title, subtitle, onOpenMenu, actions }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 glass border-b border-ink-800 px-4 sm:px-6 py-3.5 flex items-center gap-3">
      {/* Only rendered on small screens, where the sidebar is a drawer. */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-ink-700 text-ink-300 hover:text-white hover:border-ink-600 transition-colors focus-ring"
        aria-label="Open navigation menu"
      >
        <Icon name="menu" size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="text-base font-bold text-white truncate">{title}</h1>
        {subtitle && <p className="text-xs text-ink-400 mt-0.5 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <div className="text-right hidden md:block">
          <p className="text-xs text-ink-400">{greeting()},</p>
          <p className="text-xs font-semibold text-white">{user?.name}</p>
        </div>
        <span className="w-8 h-8 rounded-full bg-pulse-600/25 border border-pulse-500/30 flex items-center justify-center text-pulse-200 text-sm font-bold flex-shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </span>
      </div>
    </header>
  );
};

export default Topbar;
