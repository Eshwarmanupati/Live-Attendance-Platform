import Attendance from "../models/Attendance.js";
import Class from "../models/Class.js";
import ApiError from "../utils/ApiError.js";

/**
 * @desc    Get attendance records for a specific class
 * @route   GET /api/attendance/:classId
 * @access  Private (teacher of that class, or enrolled student)
 */
const getAttendanceByClass = async (req, res, next) => {
  try {
    const { classId } = req.params;

    // Verify class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      throw new ApiError(404, "Class not found.");
    }

    const attendance = await Attendance.find({ classId })
      .populate("studentId", "name email")
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance for a specific student in a class
 * @route   GET /api/attendance/:classId/student/:studentId
 * @access  Private
 */
const getStudentAttendance = async (req, res, next) => {
  try {
    const { classId, studentId } = req.params;

    const record = await Attendance.findOne({ classId, studentId }).populate(
      "studentId",
      "name email"
    );

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
