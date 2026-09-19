import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Session from "../models/Session.js";
import Class from "../models/Class.js";
import ApiError from "../utils/ApiError.js";
import { ATTENDANCE_STATUS, ROLES } from "../utils/constants.js";
import { getClassForUser, getOwnedClass } from "./class.service.js";

/**
 * Full attendance for a class, grouped by session — teacher only.
 *
 * The previous endpoint had no ownership check at all: any authenticated user
 * could read the complete roster of any class by guessing an id.
 */
export const getClassAttendance = async (classId, teacher) => {
  await getOwnedClass(classId, teacher._id);

  const sessions = await Session.find({ classId }).sort({ startedAt: -1 }).lean();
  const records = await Attendance.find({ classId })
    .populate("studentId", "name email")
    .sort({ markedAt: 1 })
    .lean();

  const bySession = new Map(sessions.map((s) => [String(s._id), []]));
  records.forEach((record) => {
    bySession.get(String(record.sessionId))?.push(record);
  });

  return sessions.map((session) => {
    const rows = bySession.get(String(session._id)) ?? [];
    return {
      session: {
        id: String(session._id),
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        summary: session.summary,
      },
      records: rows,
    };
  });
};

/** Live roster for one session. Visible to the class teacher and its students. */
export const getSessionAttendance = async (sessionId, user) => {
  const session = await Session.findById(sessionId);
  if (!session) throw ApiError.notFound("Session not found.");

  await getClassForUser(session.classId, user);

  const records = await Attendance.find({ sessionId })
    .populate("studentId", "name email")
    .sort({ markedAt: 1 })
    .lean();

  return { session, records };
};

/**
 * The signed-in student's own attendance across their enrolled classes, with
 * per-class rates computed from sessions actually held.
 *
 * This replaces a page that fired one request per class and then treated "a
 * record exists" as "present", which counted a single record from one session
 * as attendance for the whole class.
 */
export const getMyAttendanceSummary = async (student) => {
  const classes = await Class.find({ students: student._id })
    .populate("teacher", "name email")
    .lean();

  if (classes.length === 0) {
    return { totals: { sessions: 0, attended: 0, present: 0, late: 0, absent: 0, rate: 0 }, classes: [] };
  }

  const classIds = classes.map((c) => c._id);

  const [sessionCounts, records] = await Promise.all([
    Session.aggregate([
      { $match: { classId: { $in: classIds } } },
      { $group: { _id: "$classId", total: { $sum: 1 } } },
    ]),
    Attendance.find({ studentId: student._id, classId: { $in: classIds } })
      .sort({ markedAt: -1 })
      .lean(),
  ]);

  const sessionsByClass = new Map(sessionCounts.map((row) => [String(row._id), row.total]));

  const perClass = classes.map((cls) => {
    const mine = records.filter((r) => String(r.classId) === String(cls._id));
    const present = mine.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length;
    const late = mine.filter((r) => r.status === ATTENDANCE_STATUS.LATE).length;
    const absent = mine.filter((r) => r.status === ATTENDANCE_STATUS.ABSENT).length;
    const sessions = sessionsByClass.get(String(cls._id)) ?? 0;
    const attended = present + late;

    return {
      class: { id: String(cls._id), title: cls.title, teacher: cls.teacher, joinCode: cls.joinCode },
      sessions,
      present,
      late,
      absent,
      attended,
      rate: sessions > 0 ? Math.round((attended / sessions) * 100) : null,
      lastMarkedAt: mine[0]?.markedAt ?? null,
      records: mine.slice(0, 20),
    };
  });

  const totals = perClass.reduce(
    (acc, row) => ({
      sessions: acc.sessions + row.sessions,
      attended: acc.attended + row.attended,
      present: acc.present + row.present,
      late: acc.late + row.late,
      absent: acc.absent + row.absent,
      rate: 0,
    }),
    { sessions: 0, attended: 0, present: 0, late: 0, absent: 0, rate: 0 }
  );
  totals.rate = totals.sessions > 0 ? Math.round((totals.attended / totals.sessions) * 100) : 0;

  return { totals, classes: perClass };
};

/** Dashboard tiles for a teacher: one aggregate instead of counting client-side. */
export const getTeacherStats = async (teacher) => {
  const classes = await Class.find({ teacher: teacher._id }).select("_id students").lean();
  const classIds = classes.map((c) => c._id);

  const uniqueStudents = new Set(classes.flatMap((c) => c.students.map(String)));

  const [totalSessions, statusRows] = await Promise.all([
    Session.countDocuments({ classId: { $in: classIds } }),
    Attendance.aggregate([
      { $match: { classId: { $in: classIds.map((id) => new mongoose.Types.ObjectId(String(id))) } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const byStatus = { present: 0, late: 0, absent: 0 };
  statusRows.forEach((row) => {
    byStatus[row._id] = row.count;
  });

  const marked = byStatus.present + byStatus.late + byStatus.absent;

  return {
    classes: classes.length,
    students: uniqueStudents.size,
    sessions: totalSessions,
    ...byStatus,
    attendanceRate: marked > 0 ? Math.round(((byStatus.present + byStatus.late) / marked) * 100) : 0,
  };
};

/** CSV export of one class's attendance — the report a teacher actually wants. */
export const exportClassAttendanceCsv = async (classId, teacher) => {
  const cls = await getOwnedClass(classId, teacher._id);
  const records = await Attendance.find({ classId })
    .populate("studentId", "name email")
    .sort({ markedAt: 1 })
    .lean();

  const escape = (value) => {
    const str = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const header = ["Student", "Email", "Status", "Marked At", "Minutes After Start", "Session"];
  const rows = records.map((r) => [
    r.studentId?.name,
    r.studentId?.email,
    r.status,
    r.markedAt ? new Date(r.markedAt).toISOString() : "",
    r.minutesAfterStart ?? "",
    String(r.sessionId),
  ]);

  const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  const filename = `${cls.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-attendance.csv`;
  return { csv, filename };
};

export const assertStudent = (user) => {
  if (user.role !== ROLES.STUDENT) throw ApiError.forbidden("Students only.");
};
