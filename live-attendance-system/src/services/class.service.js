import Class from "../models/Class.js";
import Session from "../models/Session.js";
import Attendance from "../models/Attendance.js";
import ApiError from "../utils/ApiError.js";
import { ROLES, SESSION_STATUS, ERROR_CODES } from "../utils/constants.js";

const POPULATE = [
  { path: "teacher", select: "name email" },
  { path: "students", select: "name email" },
];

export const createClass = async ({ title, description }, teacherId) => {
  const created = await Class.create({ title, description, teacher: teacherId, students: [] });
  return created.populate(POPULATE);
};

/**
 * Teachers see the classes they own. Students see the classes they are
 * enrolled in — the previous version returned every class in the database to
 * every student, so "My Classes" listed other teachers' classes too.
 */
export const listClasses = async (user, { scope = "mine" } = {}) => {
  if (user.role === ROLES.TEACHER) {
    return Class.find({ teacher: user._id }).populate(POPULATE).sort({ createdAt: -1 });
  }

  const filter = scope === "available" ? { students: { $ne: user._id } } : { students: user._id };
  return Class.find(filter).populate(POPULATE).sort({ createdAt: -1 });
};

/** A class is readable by its teacher and by enrolled students, nobody else. */
export const getClassForUser = async (classId, user) => {
  const cls = await Class.findById(classId).populate(POPULATE);
  if (!cls) throw ApiError.notFound("Class not found.");

  const canRead = cls.isTaughtBy(user._id) || cls.hasStudent(user._id);
  if (!canRead) throw ApiError.forbidden("You do not have access to this class.");

  return cls;
};

/** Loads a class and asserts the caller owns it. Used by every teacher action. */
export const getOwnedClass = async (classId, teacherId) => {
  const cls = await Class.findById(classId);
  if (!cls) throw ApiError.notFound("Class not found.");
  if (!cls.isTaughtBy(teacherId)) {
    throw ApiError.forbidden("You do not own this class.", ERROR_CODES.NOT_CLASS_OWNER);
  }
  return cls;
};

export const updateClass = async (classId, data, teacherId) => {
  const cls = await getOwnedClass(classId, teacherId);
  // Only these fields are writable; joinCode, teacher and students are not.
  if (data.title !== undefined) cls.title = data.title;
  if (data.description !== undefined) cls.description = data.description;
  await cls.save();
  return cls.populate(POPULATE);
};

export const deleteClass = async (classId, teacherId) => {
  const cls = await getOwnedClass(classId, teacherId);
  // Attendance and sessions are meaningless without their class — remove them
  // together so deleting a class does not leave orphaned records behind.
  await Promise.all([
    Attendance.deleteMany({ classId: cls._id }),
    Session.deleteMany({ classId: cls._id }),
  ]);
  await cls.deleteOne();
};

export const enrollByJoinCode = async (joinCode, studentId) => {
  const cls = await Class.findOne({ joinCode: joinCode.trim().toUpperCase() });
  if (!cls) throw ApiError.notFound("No class found with that join code.");
  return enroll(cls, studentId);
};

export const enrollById = async (classId, studentId) => {
  const cls = await Class.findById(classId);
  if (!cls) throw ApiError.notFound("Class not found.");
  return enroll(cls, studentId);
};

const enroll = async (cls, studentId) => {
  if (cls.hasStudent(studentId)) {
    throw ApiError.conflict("You are already enrolled in this class.");
  }
  // $addToSet is atomic, so two simultaneous joins cannot duplicate the entry.
  await Class.updateOne({ _id: cls._id }, { $addToSet: { students: studentId } });
  return Class.findById(cls._id).populate(POPULATE);
};

export const unenroll = async (classId, studentId) => {
  const cls = await Class.findById(classId);
  if (!cls) throw ApiError.notFound("Class not found.");
  if (!cls.hasStudent(studentId)) throw ApiError.badRequest("You are not enrolled in this class.");

  const hasActiveSession = await Session.exists({ classId, status: SESSION_STATUS.ACTIVE });
  if (hasActiveSession) {
    throw ApiError.badRequest("You cannot leave a class while its session is live.");
  }

  await Class.updateOne({ _id: classId }, { $pull: { students: studentId } });
};

/** Class ids the user may receive live updates for. Drives WebSocket rooms. */
export const getSubscribableClassIds = async (user) => {
  const filter = user.role === ROLES.TEACHER ? { teacher: user._id } : { students: user._id };
  const classes = await Class.find(filter).select("_id").lean();
  return classes.map((c) => String(c._id));
};

export const canAccessClass = async (classId, user) => {
  const query =
    user.role === ROLES.TEACHER
      ? { _id: classId, teacher: user._id }
      : { _id: classId, students: user._id };
  return Boolean(await Class.exists(query));
};
