import { z } from "zod";

export const createClassSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().trim().max(500, "Description must be 500 characters or fewer").optional(),
});

export const updateClassSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(120).optional(),
    description: z.string().trim().max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Provide at least one field to update" });

export const joinClassSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z2-9]{6}$/, "A join code is 6 letters or digits"),
});

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
