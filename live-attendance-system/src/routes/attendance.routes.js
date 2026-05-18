import { Router } from "express";
import attendanceController from "../controllers/attendance.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

// All attendance routes require authentication
router.use(authMiddleware);

// Get all attendance records for a class
router.get("/:classId", attendanceController.getAttendanceByClass);

// Get a specific student's attendance for a class
router.get("/:classId/student/:studentId", attendanceController.getStudentAttendance);

export default router;
