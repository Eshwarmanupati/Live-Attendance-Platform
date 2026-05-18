import { WebSocket } from "ws";
import Class from "../models/Class.js";
import { markAttendance, countPresentForSession } from "../services/attendance.service.js";
import { sessionSchema, markAttendanceSchema } from "../validations/attendance.validation.js";
import { WS_EVENTS, ROLES } from "../utils/constants.js";
import { firstZodIssue } from "../utils/zodError.js";

let activeSession = null;

export const getActiveSession = () => activeSession;

const sendTo = (ws, type, payload = {}) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
};

const broadcastAll = (wss, type, payload = {}) => {
  const msg = JSON.stringify({ type, ...payload });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
};

export const notifyActiveSession = async (ws) => {
  if (!activeSession) return;

  const cls = await Class.findById(activeSession.classId).select("title");
  sendTo(ws, WS_EVENTS.SESSION_STARTED, {
    classId: activeSession.classId,
    classTitle: cls?.title,
    startedAt: activeSession.startedAt,
    sessionDate: activeSession.sessionDate,
    message: "A session is already in progress.",
  });
};

export const handleStartSession = async (ws, wss, user, payload) => {
  if (user.role !== ROLES.TEACHER) {
    return sendTo(ws, WS_EVENTS.ERROR, { message: "Only teachers can start a session." });
  }

  const parsed = sessionSchema.safeParse(payload);
  if (!parsed.success) {
    return sendTo(ws, WS_EVENTS.ERROR, { message: firstZodIssue(parsed.error) });
  }

  const { classId } = parsed.data;

  if (activeSession) {
    return sendTo(ws, WS_EVENTS.ERROR, {
      message: `A session is already active for class ${activeSession.classId}.`,
    });
  }

  const cls = await Class.findById(classId);
  if (!cls) return sendTo(ws, WS_EVENTS.ERROR, { message: "Class not found." });
  if (cls.teacher.toString() !== user._id.toString()) {
    return sendTo(ws, WS_EVENTS.ERROR, { message: "You do not own this class." });
  }

  const sessionDate = new Date();
  activeSession = {
    classId,
    teacherId: user._id.toString(),
    startedAt: new Date(),
    sessionDate,
  };

  console.log(`🟢 Session STARTED: ${cls.title} (${classId})`);

  broadcastAll(wss, WS_EVENTS.SESSION_STARTED, {
    classId,
    classTitle: cls.title,
    teacher: { id: user._id, name: user.name },
    startedAt: activeSession.startedAt,
    sessionDate: activeSession.sessionDate,
  });
};

export const handleMarkAttendance = async (ws, wss, user, payload) => {
  if (user.role !== ROLES.STUDENT) {
    return sendTo(ws, WS_EVENTS.ERROR, { message: "Only students can mark attendance." });
  }

  const parsed = markAttendanceSchema.safeParse(payload);
  if (!parsed.success) {
    return sendTo(ws, WS_EVENTS.ERROR, { message: firstZodIssue(parsed.error) });
  }

  const { classId, studentId } = parsed.data;

  if (!activeSession) {
    return sendTo(ws, WS_EVENTS.ERROR, { message: "No active session. Wait for teacher to start." });
  }
  if (activeSession.classId !== classId) {
    return sendTo(ws, WS_EVENTS.ERROR, { message: `No active session for class ${classId}.` });
  }
  if (user._id.toString() !== studentId) {
    return sendTo(ws, WS_EVENTS.ERROR, { message: "You can only mark your own attendance." });
  }

  const { sessionDate } = activeSession;

  try {
    const { record, presentCount } = await markAttendance({ classId, studentId, sessionDate });
    console.log(`✅ Attendance: ${user.name}`);

    broadcastAll(wss, WS_EVENTS.ATTENDANCE_UPDATED, {
      classId,
      studentId,
      studentName: user.name,
      status: "present",
      presentCount,
      sessionDate,
      timestamp: record.timestamp,
    });
  } catch (err) {
    if (err.code === 11000) {
      return sendTo(ws, WS_EVENTS.ERROR, { message: "You have already marked attendance for this class." });
    }
    console.error("❌ Error saving attendance:", err.message);
    sendTo(ws, WS_EVENTS.ERROR, { message: "Failed to save attendance. Try again." });
  }
};

export const handleEndSession = async (ws, wss, user, payload) => {
  if (user.role !== ROLES.TEACHER) {
    return sendTo(ws, WS_EVENTS.ERROR, { message: "Only teachers can end a session." });
  }

  const parsed = sessionSchema.safeParse(payload);
  if (!parsed.success) {
    return sendTo(ws, WS_EVENTS.ERROR, { message: firstZodIssue(parsed.error) });
  }

  const { classId } = parsed.data;

  if (!activeSession) {
    return sendTo(ws, WS_EVENTS.ERROR, { message: "No active session to end." });
  }
  if (activeSession.classId !== classId) {
    return sendTo(ws, WS_EVENTS.ERROR, { message: "No active session for this class." });
  }
  if (activeSession.teacherId !== user._id.toString()) {
    return sendTo(ws, WS_EVENTS.ERROR, { message: "You did not start this session." });
  }

  const { sessionDate } = activeSession;
  const finalCount = await countPresentForSession(classId, sessionDate);

  console.log(`🔴 Session ENDED: ${classId}. Present: ${finalCount}`);

  activeSession = null;

  broadcastAll(wss, WS_EVENTS.SESSION_ENDED, {
    classId,
    sessionDate,
    finalPresentCount: finalCount,
    endedAt: new Date(),
  });
};

export { sendTo, broadcastAll };
