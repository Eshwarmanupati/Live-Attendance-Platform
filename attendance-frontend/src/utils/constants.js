export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
export const WS_URL  = import.meta.env.VITE_WS_URL  || "ws://localhost:5001";

export const ROLES = Object.freeze({
  TEACHER: "teacher",
  STUDENT: "student",
});

export const WS_EVENTS = Object.freeze({
  START_SESSION:       "START_SESSION",
  END_SESSION:         "END_SESSION",
  MARK_ATTENDANCE:     "MARK_ATTENDANCE",
  SESSION_STARTED:     "SESSION_STARTED",
  SESSION_ENDED:       "SESSION_ENDED",
  ATTENDANCE_UPDATED:  "ATTENDANCE_UPDATED",
  ERROR:               "ERROR",
});

export const ROUTES = Object.freeze({
  LOGIN:              "/login",
  SIGNUP:             "/signup",
  TEACHER_DASHBOARD:  "/teacher/dashboard",
  TEACHER_CLASSES:    "/teacher/classes",
  TEACHER_ATTENDANCE: "/teacher/attendance",
  STUDENT_DASHBOARD:  "/student/dashboard",
  STUDENT_CLASSES:    "/student/classes",
  STUDENT_HISTORY:    "/student/history",
});