import * as attendanceService from "../services/attendance.service.js";

const getAttendanceByClass = async (req, res, next) => {
  try {
    const records = await attendanceService.getAttendanceByClass(req.params.classId);
    res.status(200).json({
      success: true,
      count: records.length,
      data: { attendance: records },
    });
  } catch (error) {
    next(error);
  }
};

const getStudentAttendance = async (req, res, next) => {
  try {
    const { classId, studentId } = req.params;
    const record = await attendanceService.getStudentAttendance(classId, studentId);

    if (!record) {
      return res.status(200).json({
        success: true,
        message: "No attendance record found.",
        data: { attendance: null },
      });
    }

    res.status(200).json({
      success: true,
      data: { attendance: record },
    });
  } catch (error) {
    next(error);
  }
};

export default { getAttendanceByClass, getStudentAttendance };
