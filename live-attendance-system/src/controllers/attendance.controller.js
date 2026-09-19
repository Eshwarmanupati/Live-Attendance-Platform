import asyncHandler from "../utils/asyncHandler.js";
import * as attendanceService from "../services/attendance.service.js";

export const getClassAttendance = asyncHandler(async (req, res) => {
  const sessions = await attendanceService.getClassAttendance(req.params.classId, req.user);
  res.status(200).json({ success: true, count: sessions.length, data: { sessions } });
});

export const getSessionAttendance = asyncHandler(async (req, res) => {
  const { session, records } = await attendanceService.getSessionAttendance(
    req.params.sessionId,
    req.user
  );
  res.status(200).json({ success: true, count: records.length, data: { session, records } });
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const summary = await attendanceService.getMyAttendanceSummary(req.user);
  res.status(200).json({ success: true, data: summary });
});

export const getTeacherStats = asyncHandler(async (req, res) => {
  const stats = await attendanceService.getTeacherStats(req.user);
  res.status(200).json({ success: true, data: { stats } });
});

export const exportClassAttendance = asyncHandler(async (req, res) => {
  const { csv, filename } = await attendanceService.exportClassAttendanceCsv(
    req.params.classId,
    req.user
  );
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(csv);
});

export default {
  getClassAttendance,
  getSessionAttendance,
  getMyAttendance,
  getTeacherStats,
  exportClassAttendance,
};
