import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import WsIndicator from "../ui/WsIndicator";
import Icon from "../ui/Icon";
import { ROLES, ROUTES } from "../../utils/constants";

const TEACHER_LINKS = [
  { to: ROUTES.TEACHER_DASHBOARD, label: "Dashboard", icon: "dashboard" },
  { to: ROUTES.TEACHER_CLASSES, label: "Classes", icon: "classes" },
  { to: ROUTES.TEACHER_ATTENDANCE, label: "Live Sessions", icon: "bolt" },
];

const STUDENT_LINKS = [
  { to: ROUTES.STUDENT_DASHBOARD, label: "Dashboard", icon: "dashboard" },
  { to: ROUTES.STUDENT_CLASSES, label: "My Classes", icon: "classes" },
  { to: ROUTES.STUDENT_HISTORY, label: "History", icon: "history" },
];

const Sidebar = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const isTeacher = user?.role === ROLES.TEACHER;
  const links = isTeacher ? TEACHER_LINKS : STUDENT_LINKS;

  return (
    <div className="h-full flex flex-col glass border-r border-ink-800">
      <div className="px-5 py-5 border-b border-ink-800">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-pulse-600 flex items-center justify-center text-white">
            <Icon name="bolt" size={16} filled />
          </span>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Attend</p>
            <p className="text-[10px] font-mono text-ink-400 uppercase tracking-widest">Live attendance</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        <p className="text-[10px] font-mono text-ink-500 uppercase tracking-widest px-3 pb-2">
          {isTeacher ? "Teacher" : "Student"}
        </p>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <Icon name={link.icon} size={17} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-ink-800 space-y-3">
        <WsIndicator />
        <div className="flex items-center gap-2.5 px-2">
          <span className="w-8 h-8 rounded-full bg-pulse-600/25 border border-pulse-500/30 flex items-center justify-center text-pulse-200 text-xs font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] font-mono text-ink-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full px-3 py-2 text-xs text-ink-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2 focus-ring"
        >
          <Icon name="logout" size={15} /> Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
