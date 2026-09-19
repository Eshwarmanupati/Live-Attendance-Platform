import asyncHandler from "../utils/asyncHandler.js";
import * as sessionService from "../services/session.service.js";

/**
 * Lets a client restore live state after a page refresh without waiting for a
 * WebSocket round trip.
 */
export const getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await sessionService.listActiveSessionsForUser(req.user);
  res.status(200).json({ success: true, count: sessions.length, data: { sessions } });
});

export default { getActiveSessions };
