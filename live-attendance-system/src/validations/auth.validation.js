import { z } from "zod";
import { ROLES } from "../utils/constants.js";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.email("Enter a valid email address").toLowerCase(),
  // 8 characters is the floor the User model enforces too.
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  // Zod 4 replaced the v3 `errorMap` option with `error`; the old option was
  // silently ignored, so an invalid role produced a generic message.
  role: z.enum(Object.values(ROLES), { error: "Role must be either 'teacher' or 'student'" }),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});
