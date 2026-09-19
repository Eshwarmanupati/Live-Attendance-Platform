import mongoose from "mongoose";
import Session from "../models/Session.js";
import Attendance from "../models/Attendance.js";
import Class from "../models/Class.js";
import ApiError from "../utils/ApiError.js";
import config from "../config/env.js";
import logger from "../utils/logger.js";
import { getOwnedClass } from "./class.service.js";
import {
  ATTENDANCE_STATUS,
  SESSION_STATUS,
  ERROR_CODES,
  ROLES,
} from "../utils/constants.js";

const DUPLICATE_KEY = 11000;

export const startSession = async (classId, teacher) => {
  const cls = await getOwnedClass(classId, teacher._id);

  try {
    const session = await Session.create({ classId: cls._id, teacher: teacher._id });
    return { session, cls };
  } catch (error) {
    // The partial unique index is the source of truth: if it rejects the write,
    // another request won the race and a session is already live.
    if (error.code === DUPLICATE_KEY) {
      throw ApiError.conflict(
        "A session is already live for this class.",
        ERROR_CODES.SESSION_ALREADY_ACTIVE
      );
    }
    throw error;
  }
};

export const getActiveSession = (classId) =>
  Session.findOne({ classId, status: SESSION_STATUS.ACTIVE });

/** Active sessions across every class the user teaches or is enrolled in. */
export const listActiveSessionsForUser = async (user) => {
  const filter = user.role === ROLES.TEACHER ? { teacher: user._id } : { students: user._id };
  const classes = await Class.find(filter).select("_id title students").lean();
  if (classes.length === 0) return [];

  const byId = new Map(classes.map((c) => [String(c._id), c]));
  const sessions = await Session.find({
    classId: { $in: classes.map((c) => c._id) },
    status: SESSION_STATUS.ACTIVE,
  }).lean();

  /**
   * The field names here must match the SESSION_STARTED event exactly: a client
   * restoring after a refresh reads the same shape it would have received live,
   * so `sessionId` (not `id`) and `enrolled` both have to be present.
   */
  return sessions.map((s) => ({
    sessionId: String(s._id),
    classId: String(s.classId),
    classTitle: byId.get(String(s.classId))?.title,
    startedAt: s.startedAt,
    enrolled: byId.get(String(s.classId))?.students?.length ?? 0,
  }));
};

/**
 * Records a student as present, or late once the grace period has passed.
 * `studentId` is taken from the authenticated socket by the caller, never from
 * the client payload — the old handler trusted a client-supplied studentId.
 */
export const markAttendance = async ({ classId, studentId }) => {
  const cls = await Class.findById(classId);
  if (!cls) throw ApiError.notFound("Class not found.");
  if (!cls.hasStudent(studentId)) {
    throw ApiError.forbidden("You are not enrolled in this class.", ERROR_CODES.NOT_ENROLLED);
  }

  const session = await getActiveSession(classId);
  if (!session) {
    throw ApiError.badRequest(
      "There is no live session for this class right now.",
      ERROR_CODES.NO_ACTIVE_SESSION
    );
  }

  const now = new Date();
  const minutesAfterStart = Math.max(0, Math.floor((now - session.startedAt) / 60_000));
  const status =
    minutesAfterStart > config.LATE_AFTER_MINUTES
      ? ATTENDANCE_STATUS.LATE
      : ATTENDANCE_STATUS.PRESENT;

  let record;
  try {
    record = await Attendance.create({
      sessionId: session._id,
      classId,
      studentId,
      status,
      markedAt: now,
      minutesAfterStart,
    });
  } catch (error) {
    if (error.code === DUPLICATE_KEY) {
      throw ApiError.conflict(
        "You have already marked attendance for this session.",
        ERROR_CODES.ALREADY_MARKED
      );
    }
    throw error;
  }

  const counts = await countBySession(session._id);
  return { record, session, counts, studentCount: cls.students.length };
};

export const countBySession = async (sessionId) => {
  const rows = await Attendance.aggregate([
    { $match: { sessionId: new mongoose.Types.ObjectId(String(sessionId)) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const counts = { present: 0, late: 0, absent: 0 };
  rows.forEach((row) => {
    counts[row._id] = row.count;
  });
  counts.attended = counts.present + counts.late;
  return counts;
};

/**
 * Ends the session and backfills an `absent` record for every enrolled student
 * who never marked in. Without this, "absent" could only ever be inferred from
 * a missing row, which made any attendance rate a guess.
 */
export const endSession = async (classId, teacher) => {
  const cls = await getOwnedClass(classId, teacher._id);

  const session = await getActiveSession(classId);
  if (!session) {
    throw ApiError.badRequest("There is no live session to end.", ERROR_CODES.NO_ACTIVE_SESSION);
  }

  const marked = await Attendance.find({ sessionId: session._id }).select("studentId").lean();
  const markedIds = new Set(marked.map((m) => String(m.studentId)));
  const absentees = cls.students.filter((s) => !markedIds.has(String(s)));

  if (absentees.length > 0) {
    try {
      await Attendance.insertMany(
        absentees.map((studentId) => ({
          sessionId: session._id,
          classId: cls._id,
          studentId,
          status: ATTENDANCE_STATUS.ABSENT,
          markedAt: new Date(),
        })),
        { ordered: false }
      );
    } catch (error) {
      // A student marking in at the same instant loses the race against the
      // unique index; their real record wins and the absent insert is dropped.
      if (error.code !== DUPLICATE_KEY) throw error;
      logger.debug("Absent backfill skipped a row that was marked concurrently");
    }
  }

  const counts = await countBySession(session._id);

  session.status = SESSION_STATUS.ENDED;
  session.endedAt = new Date();
  session.summary = {
    present: counts.present,
    late: counts.late,
    absent: counts.absent,
    enrolled: cls.students.length,
  };
  await session.save();

  return { session, cls, counts };
};

/**
 * Called on boot: a session left active by a crash or redeploy would otherwise
 * block that class forever, since the unique index refuses a second one.
 */
export const closeStaleSessions = async (maxAgeHours = 12) => {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  const stale = await Session.find({ status: SESSION_STATUS.ACTIVE, startedAt: { $lt: cutoff } });

  for (const session of stale) {
    // eslint-disable-next-line no-await-in-loop
    const counts = await countBySession(session._id);
    session.status = SESSION_STATUS.ENDED;
    session.endedAt = new Date();
    session.summary = { present: counts.present, late: counts.late, absent: counts.absent, enrolled: 0 };
    // eslint-disable-next-line no-await-in-loop
    await session.save();
  }

  if (stale.length > 0) logger.warn(`Closed ${stale.length} stale session(s) left open by a restart`);
  return stale.length;
};
