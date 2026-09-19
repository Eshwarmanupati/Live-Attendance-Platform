import { Router } from "express";
import attendanceController from "../controllers/attendance.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import { validateObjectIdParam } from "../middleware/validate.middleware.js";
import { ROLES } from "../utils/constants.js";

const router = Router();
const teacherOnly = roleMiddleware(ROLES.TEACHER);
const studentOnly = roleMiddleware(ROLES.STUDENT);

router.use(authMiddleware);

// Static segments are declared before parameterised ones.
router.get("/me", studentOnly, attendanceController.getMyAttendance);
router.get("/stats", teacherOnly, attendanceController.getTeacherStats);

router.get("/session/:sessionId", validateObjectIdParam("sessionId"), attendanceController.getSessionAttendance);
router.get("/class/:classId", teacherOnly, validateObjectIdParam("classId"), attendanceController.getClassAttendance);
router.get("/class/:classId/export", teacherOnly, validateObjectIdParam("classId"), attendanceController.exportClassAttendance);

export default router;
