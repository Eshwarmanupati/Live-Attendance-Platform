import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { WS_EVENTS } from "../utils/constants.js";
import {
  handleStartSession,
  handleMarkAttendance,
  handleEndSession,
  notifyActiveSession,
  sendTo,
} from "./socketEvents.js";

const authenticateWsClient = async (token) => {
  if (!token) throw new Error("No authentication token provided.");
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("-password");
  if (!user) throw new Error("User not found.");
  return user;
};

export const setupWebSocketServer = (httpServer) => {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", async (ws, req) => {
    const params = new URLSearchParams(req.url.replace(/^[^?]*\??/, ""));
    const token = params.get("token");

    let user;

    try {
      user = await authenticateWsClient(token);
    } catch (error) {
      ws.send(JSON.stringify({ type: WS_EVENTS.ERROR, message: `Authentication failed: ${error.message}` }));
      ws.close();
      return;
    }

    ws.user = user;

    try {
      await notifyActiveSession(ws);
    } catch (error) {
      console.error("Failed to sync active session:", error.message);
    }

    ws.on("message", async (data) => {
      let parsed;

      try {
        parsed = JSON.parse(data.toString());
      } catch {
        return sendTo(ws, WS_EVENTS.ERROR, { message: "Invalid JSON message." });
      }

      const { type, ...payload } = parsed;

      switch (type) {
        case WS_EVENTS.START_SESSION:
          await handleStartSession(ws, wss, user, payload);
          break;
        case WS_EVENTS.MARK_ATTENDANCE:
          await handleMarkAttendance(ws, wss, user, payload);
          break;
        case WS_EVENTS.END_SESSION:
          await handleEndSession(ws, wss, user, payload);
          break;
        default:
          sendTo(ws, WS_EVENTS.ERROR, { message: `Unknown event type: "${type}"` });
      }
    });

    ws.on("close", () => {});

    ws.on("error", (error) => {
      console.error(`WS error for ${user.name}:`, error.message);
    });
  });

  return wss;
};
