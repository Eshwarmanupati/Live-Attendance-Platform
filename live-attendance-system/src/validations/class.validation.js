import { z } from "zod";

const createClassSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").trim(),
  description: z.string().trim().optional(),
  // students are optional at creation time
  students: z.array(z.string()).optional(),
});

const updateClassSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").trim().optional(),
  description: z.string().trim().optional(),
  students: z.array(z.string()).optional(),
});

export { createClassSchema, updateClassSchema };
