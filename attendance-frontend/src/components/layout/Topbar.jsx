import { useAuth } from "../../context/AuthContext";

const Topbar = ({ title, subtitle }) => {
  const { user } = useAuth();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="sticky top-0 z-30 glass border-b border-ink-800 px-6 py-3.5 flex items-center justify-between">
      <div>
        <h1 className="text-base font-bold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-ink-400">{greeting()},</p>
          <p className="text-xs font-semibold text-white">{user?.name}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-pulse-600/30 border border-pulse-500/30 flex items-center justify-center text-pulse-300 text-sm font-bold">
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
