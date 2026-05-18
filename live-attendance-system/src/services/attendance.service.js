import Attendance from "../models/Attendance.js";
import Class from "../models/Class.js";
import ApiError from "../utils/ApiError.js";

export const getAttendanceByClass = async (classId) => {
  const cls = await Class.findById(classId);
  if (!cls) throw new ApiError(404, "Class not found.");
  return Attendance.find({ classId })
    .populate("studentId", "name email")
    .sort({ timestamp: -1 });
};

export const getStudentAttendance = async (classId, studentId) =>
  Attendance.findOne({ classId, studentId }).populate("studentId", "name email");

export const markAttendance = async ({ classId, studentId, sessionDate }) => {
  const record = await Attendance.create({
    classId,
    studentId,
    status: "present",
    sessionDate,
    timestamp: new Date(),
  });
  const presentCount = await Attendance.countDocuments({
    classId,
    sessionDate,
    status: "present",
  });
  return { record, presentCount };
};

export const countPresentForSession = async (classId, sessionDate) =>
  Attendance.countDocuments({ classId, sessionDate, status: "present" });
