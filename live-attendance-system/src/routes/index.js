import { Router } from "express";
import authRoutes from "./auth.routes.js";
import classRoutes from "./class.routes.js";
import attendanceRoutes from "./attendance.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/classes", classRoutes);
router.use("/attendance", attendanceRoutes);

export default router;
