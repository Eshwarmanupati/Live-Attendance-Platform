import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["teacher", "student"], {
    errorMap: () => ({ message: "Role must be 'teacher' or 'student'" }),
  }),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export { signupSchema, loginSchema };
