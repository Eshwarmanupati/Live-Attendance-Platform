import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/ui/Spinner";

/**
 * Wraps a route to require authentication and optionally a specific role.
 * Shows spinner while session is being restored from localStorage.
 */
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    // Redirect to the correct dashboard if wrong role
    return <Navigate to={user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"} replace />;
  }

  return children;
};

export default ProtectedRoute;
