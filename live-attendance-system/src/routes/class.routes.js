import { Router } from "express";
import classController from "../controllers/class.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { createClassSchema, updateClassSchema } from "../validations/class.validation.js";

const router = Router();

router.use(authMiddleware);

router.get("/", classController.getAllClasses);
router.get("/:id", classController.getClassById);
router.post("/", roleMiddleware("teacher"), validate(createClassSchema), classController.createClass);
router.put("/:id", roleMiddleware("teacher"), validate(updateClassSchema), classController.updateClass);
router.delete("/:id", roleMiddleware("teacher"), classController.deleteClass);

export default router;
