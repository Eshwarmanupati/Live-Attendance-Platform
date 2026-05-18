import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import WsIndicator from "../ui/WsIndicator";

const TeacherLinks = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: "⊞" },
  { to: "/teacher/classes", label: "Classes", icon: "◫" },
  { to: "/teacher/attendance", label: "Attendance", icon: "✓" },
];

const StudentLinks = [
  { to: "/student/dashboard", label: "Dashboard", icon: "⊞" },
  { to: "/student/classes", label: "My Classes", icon: "◫" },
  { to: "/student/history", label: "History", icon: "◷" },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === "teacher" ? TeacherLinks : StudentLinks;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-60 flex-shrink-0 h-screen sticky top-0 glass border-r border-ink-800 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-ink-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-pulse-600 flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Attend</p>
            <p className="text-[10px] font-mono text-ink-500 uppercase tracking-widest">Live System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-mono text-ink-600 uppercase tracking-widest px-3 pb-2">
          {user?.role === "teacher" ? "Teacher" : "Student"} Menu
        </p>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <span className="text-base leading-none">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User block */}
      <div className="px-3 py-4 border-t border-ink-800 space-y-2">
        <WsIndicator />
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-pulse-600/30 border border-pulse-500/30 flex items-center justify-center text-pulse-300 text-xs font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] font-mono text-ink-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-xs text-ink-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-150 flex items-center gap-2"
        >
          <span>⎋</span> Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
