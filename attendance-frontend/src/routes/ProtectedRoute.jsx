import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/ui/Spinner";
import { dashboardFor, ROUTES } from "../utils/constants";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait for the stored token to be verified before deciding, otherwise a
  // refresh flashes the login page for an authenticated user.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;

  // Signed in as the wrong role: send them to their own dashboard.
  if (role && user.role !== role) return <Navigate to={dashboardFor(user.role)} replace />;

  return children;
};

export default ProtectedRoute;
