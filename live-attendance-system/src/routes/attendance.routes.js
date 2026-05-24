import { Router } from "express";
import attendanceController from "../controllers/attendance.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/:classId", attendanceController.getAttendanceByClass);
router.get("/:classId/student/:studentId", attendanceController.getStudentAttendance);

export default router;
