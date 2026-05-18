import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// Protected route — requires valid JWT
router.get("/me", authMiddleware, authController.getMe);

export default router;
