import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { WsProvider } from "./context/WsContext";
import { ToastProvider } from "./components/ui/Toast";
import ProtectedRoute from "./routes/ProtectedRoute";

import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentClasses from "./pages/student/StudentClasses";
import StudentHistory from "./pages/student/StudentHistory";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <WsProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/teacher/dashboard" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/classes" element={<ProtectedRoute role="teacher"><TeacherClasses /></ProtectedRoute>} />
            <Route path="/teacher/attendance" element={<ProtectedRoute role="teacher"><TeacherAttendance /></ProtectedRoute>} />
            <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/classes" element={<ProtectedRoute role="student"><StudentClasses /></ProtectedRoute>} />
            <Route path="/student/history" element={<ProtectedRoute role="student"><StudentHistory /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </WsProvider>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
