import { Router } from "express";
import classController from "../controllers/class.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router = Router();

// All class routes require authentication
router.use(authMiddleware);

// Both roles can view classes (filtering is done inside the controller)
router.get("/", classController.getAllClasses);
router.get("/:id", classController.getClassById);

// Only teachers can create, update, or delete classes
router.post("/", roleMiddleware("teacher"), classController.createClass);
router.put("/:id", roleMiddleware("teacher"), classController.updateClass);
router.delete("/:id", roleMiddleware("teacher"), classController.deleteClass);

export default router;
