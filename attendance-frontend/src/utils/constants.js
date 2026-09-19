const stripTrailingSlash = (value) => value.replace(/\/$/, "");

export const API_URL = stripTrailingSlash(import.meta.env.VITE_API_URL || "http://localhost:5001/api");

/**
 * Derive the WebSocket URL from the API URL when it is not set explicitly, so a
 * deploy that forgets VITE_WS_URL still talks to the right host instead of
 * silently falling back to localhost.
 */
export const WS_URL = stripTrailingSlash(
  import.meta.env.VITE_WS_URL || API_URL.replace(/^http/, "ws").replace(/\/api$/, "")
);

export const ROLES = Object.freeze({ TEACHER: "teacher", STUDENT: "student" });

/** Client -> server */
export const WS_IN = Object.freeze({
  SUBSCRIBE: "SUBSCRIBE",
  START_SESSION: "START_SESSION",
  END_SESSION: "END_SESSION",
  MARK_ATTENDANCE: "MARK_ATTENDANCE",
});

/** Server -> client */
export const WS_OUT = Object.freeze({
  CONNECTED: "CONNECTED",
  SUBSCRIBED: "SUBSCRIBED",
  SESSION_STARTED: "SESSION_STARTED",
  SESSION_ENDED: "SESSION_ENDED",
  ATTENDANCE_UPDATED: "ATTENDANCE_UPDATED",
  ATTENDANCE_CONFIRMED: "ATTENDANCE_CONFIRMED",
  ERROR: "ERROR",
});

export const ATTENDANCE_STATUS = Object.freeze({ PRESENT: "present", LATE: "late", ABSENT: "absent" });

export const ROUTES = Object.freeze({
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  TEACHER_DASHBOARD: "/teacher/dashboard",
  TEACHER_CLASSES: "/teacher/classes",
  TEACHER_ATTENDANCE: "/teacher/attendance",
  STUDENT_DASHBOARD: "/student/dashboard",
  STUDENT_CLASSES: "/student/classes",
  STUDENT_HISTORY: "/student/history",
});

export const dashboardFor = (role) =>
  role === ROLES.TEACHER ? ROUTES.TEACHER_DASHBOARD : ROUTES.STUDENT_DASHBOARD;

/** Credentials created by the backend seed script, shown on the landing page. */
export const DEMO_ACCOUNTS = Object.freeze({
  teacher: { email: "teacher@demo.dev", password: "demopass123" },
  student: { email: "student@demo.dev", password: "demopass123" },
});
