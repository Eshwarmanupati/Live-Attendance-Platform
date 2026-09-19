export const ROLES = Object.freeze({
  TEACHER: "teacher",
  STUDENT: "student",
});

export const ATTENDANCE_STATUS = Object.freeze({
  PRESENT: "present",
  LATE: "late",
  ABSENT: "absent",
});

export const SESSION_STATUS = Object.freeze({
  ACTIVE: "active",
  ENDED: "ended",
});

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

/** Application-level close codes (4000-4999 is the range reserved for apps). */
export const WS_CLOSE = Object.freeze({
  UNAUTHORIZED: 4001,
  RATE_LIMITED: 4029,
});

export const ERROR_CODES = Object.freeze({
  ALREADY_MARKED: "ALREADY_MARKED",
  NO_ACTIVE_SESSION: "NO_ACTIVE_SESSION",
  SESSION_ALREADY_ACTIVE: "SESSION_ALREADY_ACTIVE",
  NOT_ENROLLED: "NOT_ENROLLED",
  NOT_CLASS_OWNER: "NOT_CLASS_OWNER",
});
