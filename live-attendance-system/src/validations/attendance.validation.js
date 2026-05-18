import { z } from "zod";

const markAttendanceSchema = z.object({
  classId: z.string().min(1, "classId is required"),
  studentId: z.string().min(1, "studentId is required"),
});

const sessionSchema = z.object({
  classId: z.string().min(1, "classId is required"),
});

export { markAttendanceSchema, sessionSchema };
