import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { WsProvider } from "./context/WsContext";
import { ToastProvider } from "./components/ui/Toast";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import ProtectedRoute from "./routes/ProtectedRoute";

import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentClasses from "./pages/student/StudentClasses";
import StudentHistory from "./pages/student/StudentHistory";
import { ROLES, ROUTES } from "./utils/constants";

const teacherRoute = (element) => <ProtectedRoute role={ROLES.TEACHER}>{element}</ProtectedRoute>;
const studentRoute = (element) => <ProtectedRoute role={ROLES.STUDENT}>{element}</ProtectedRoute>;

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <WsProvider>
            <Routes>
              <Route path={ROUTES.HOME} element={<LandingPage />} />
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.SIGNUP} element={<SignupPage />} />

              <Route path={ROUTES.TEACHER_DASHBOARD} element={teacherRoute(<TeacherDashboard />)} />
              <Route path={ROUTES.TEACHER_CLASSES} element={teacherRoute(<TeacherClasses />)} />
              <Route path={ROUTES.TEACHER_ATTENDANCE} element={teacherRoute(<TeacherAttendance />)} />

              <Route path={ROUTES.STUDENT_DASHBOARD} element={studentRoute(<StudentDashboard />)} />
              <Route path={ROUTES.STUDENT_CLASSES} element={studentRoute(<StudentClasses />)} />
              <Route path={ROUTES.STUDENT_HISTORY} element={studentRoute(<StudentHistory />)} />

              {/* Unknown paths land on the marketing page, not the login form. */}
              <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
            </Routes>
          </WsProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
