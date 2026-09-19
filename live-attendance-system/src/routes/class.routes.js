import { Router } from "express";
import classController from "../controllers/class.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import validate, { validateObjectIdParam } from "../middleware/validate.middleware.js";
import { createClassSchema, updateClassSchema, joinClassSchema } from "../validations/class.validation.js";
import { ROLES } from "../utils/constants.js";

const router = Router();
const teacherOnly = roleMiddleware(ROLES.TEACHER);
const studentOnly = roleMiddleware(ROLES.STUDENT);

router.use(authMiddleware);

router.get("/", classController.getAllClasses);
router.post("/", teacherOnly, validate(createClassSchema), classController.createClass);

// Join by code before the /:id routes, so "join" is never read as an id.
router.post("/join", studentOnly, validate(joinClassSchema), classController.joinClass);

router.get("/:id", validateObjectIdParam(), classController.getClassById);
router.put("/:id", teacherOnly, validateObjectIdParam(), validate(updateClassSchema), classController.updateClass);
router.delete("/:id", teacherOnly, validateObjectIdParam(), classController.deleteClass);

router.post("/:id/enroll", studentOnly, validateObjectIdParam(), classController.enrollInClass);
router.delete("/:id/enroll", studentOnly, validateObjectIdParam(), classController.leaveClass);

export default router;
