import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

/**
 * The sidebar was a fixed 240px column with no mobile handling, so on a phone
 * it ate most of the screen and the content beside it was unusable. Below `lg`
 * it is now a drawer opened from the top bar.
 */
const DashboardLayout = ({ children, title, subtitle, actions }) => {
  const { pathname } = useLocation();
  /**
   * The drawer records the route it was opened on, so navigating anywhere
   * closes it automatically — derived state rather than an effect that fires a
   * second render on every route change.
   */
  const [openedOn, setOpenedOn] = useState(null);
  const menuOpen = openedOn === pathname;
  const closeMenu = () => setOpenedOn(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpenedOn(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:block w-60 flex-shrink-0 h-screen sticky top-0">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
            onClick={closeMenu}
            aria-label="Close navigation menu"
            tabIndex={-1}
          />
          <div className="relative w-64 max-w-[80vw] h-full animate-slide-in">
            <Sidebar onNavigate={closeMenu} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={title}
          subtitle={subtitle}
          actions={actions}
          onOpenMenu={() => setOpenedOn(pathname)}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
