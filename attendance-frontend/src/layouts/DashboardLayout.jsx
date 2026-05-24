import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

const DashboardLayout = ({ children, title, subtitle }) => (
  <div className="flex min-h-screen">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Topbar title={title} subtitle={subtitle} />
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  </div>
);

export default DashboardLayout;
