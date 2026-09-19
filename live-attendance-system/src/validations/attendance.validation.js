import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "A valid classId is required");

/** WebSocket payloads. studentId is deliberately absent — the server uses the
 *  authenticated socket identity instead of trusting the client. */
export const sessionEventSchema = z.object({ classId: objectId });

export const markAttendanceSchema = z.object({ classId: objectId });

export const subscribeSchema = z.object({
  classIds: z.array(objectId).max(100).optional(),
});
