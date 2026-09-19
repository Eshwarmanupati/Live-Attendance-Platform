import { Router } from "express";
import sessionController from "../controllers/session.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);
router.get("/active", sessionController.getActiveSessions);

export default router;
