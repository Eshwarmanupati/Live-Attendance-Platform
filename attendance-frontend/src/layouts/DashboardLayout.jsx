import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

/**
 * Shared layout for all dashboard pages.
 * Accepts title/subtitle props forwarded to the Topbar.
 */
const DashboardLayout = ({ children, title, subtitle }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
