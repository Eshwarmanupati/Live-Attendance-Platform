import { WebSocket } from "ws";
import * as sessionService from "../services/session.service.js";
import * as classService from "../services/class.service.js";
import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import { firstZodIssue } from "../utils/zodError.js";
import {
  sessionEventSchema,
  markAttendanceSchema,
  subscribeSchema,
} from "../validations/attendance.validation.js";
import { WS_OUT, ROLES } from "../utils/constants.js";

export const send = (ws, type, payload = {}) => {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, ...payload }));
};

const sendError = (ws, message, code) => send(ws, WS_OUT.ERROR, { message, code });

/** Emits to every socket subscribed to a class, optionally skipping one. */
export const broadcast = (rooms, classId, type, payload = {}, { except } = {}) => {
  const message = JSON.stringify({ type, ...payload });
  rooms.members(classId).forEach((client) => {
    if (client === except) return;
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
};

const parsed = (schema, payload, ws) => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    sendError(ws, firstZodIssue(result.error), "VALIDATION_ERROR");
    return null;
  }
  return result.data;
};

/**
 * Subscribes the socket to the classes it is entitled to. Membership is looked
 * up server-side; a client asking for a class it does not belong to is ignored.
 */
export const handleSubscribe = async (ctx, payload) => {
  const { ws, user, rooms } = ctx;
  const data = parsed(subscribeSchema, payload ?? {}, ws);
  if (!data) return;

  const allowed = await classService.getSubscribableClassIds(user);
  const requested = data.classIds?.length ? data.classIds.filter((id) => allowed.includes(id)) : allowed;

  requested.forEach((classId) => rooms.join(classId, ws));

  const activeSessions = await sessionService.listActiveSessionsForUser(user);
  send(ws, WS_OUT.SUBSCRIBED, { classIds: requested, activeSessions });
};

export const handleStartSession = async (ctx, payload) => {
  const { ws, user, rooms } = ctx;
  if (user.role !== ROLES.TEACHER) return sendError(ws, "Only teachers can start a session.");

  const data = parsed(sessionEventSchema, payload, ws);
  if (!data) return;

  try {
    const { session, cls } = await sessionService.startSession(data.classId, user);
    rooms.join(cls._id, ws);

    broadcast(rooms, cls._id, WS_OUT.SESSION_STARTED, {
      sessionId: String(session._id),
      classId: String(cls._id),
      classTitle: cls.title,
      teacher: { id: String(user._id), name: user.name },
      startedAt: session.startedAt,
      enrolled: cls.students.length,
    });

    logger.info("Session started", { classId: String(cls._id), teacher: user.email });
  } catch (error) {
    handleWsError(ws, error, "start session");
  }
};

export const handleMarkAttendance = async (ctx, payload) => {
  const { ws, user, rooms } = ctx;
  if (user.role !== ROLES.STUDENT) return sendError(ws, "Only students can mark attendance.");

  const data = parsed(markAttendanceSchema, payload, ws);
  if (!data) return;

  try {
    // studentId comes from the authenticated socket, not the payload, so a
    // student can never mark attendance on someone else's behalf.
    const { record, session, counts, studentCount } = await sessionService.markAttendance({
      classId: data.classId,
      studentId: user._id,
    });

    send(ws, WS_OUT.ATTENDANCE_CONFIRMED, {
      classId: data.classId,
      sessionId: String(session._id),
      status: record.status,
      markedAt: record.markedAt,
    });

    broadcast(rooms, data.classId, WS_OUT.ATTENDANCE_UPDATED, {
      classId: data.classId,
      sessionId: String(session._id),
      student: { id: String(user._id), name: user.name },
      status: record.status,
      markedAt: record.markedAt,
      counts,
      enrolled: studentCount,
    });
  } catch (error) {
    handleWsError(ws, error, "mark attendance");
  }
};

export const handleEndSession = async (ctx, payload) => {
  const { ws, user, rooms } = ctx;
  if (user.role !== ROLES.TEACHER) return sendError(ws, "Only teachers can end a session.");

  const data = parsed(sessionEventSchema, payload, ws);
  if (!data) return;

  try {
    const { session, cls, counts } = await sessionService.endSession(data.classId, user);

    broadcast(rooms, cls._id, WS_OUT.SESSION_ENDED, {
      sessionId: String(session._id),
      classId: String(cls._id),
      classTitle: cls.title,
      endedAt: session.endedAt,
      summary: session.summary,
      counts,
    });

    logger.info("Session ended", { classId: String(cls._id), ...counts });
  } catch (error) {
    handleWsError(ws, error, "end session");
  }
};

const handleWsError = (ws, error, action) => {
  if (error instanceof ApiError || error.isOperational) {
    return sendError(ws, error.message, error.code);
  }
  logger.error(`WebSocket failure while trying to ${action}`, { error: error.message, stack: error.stack });
  sendError(ws, "Something went wrong. Please try again.");
};
