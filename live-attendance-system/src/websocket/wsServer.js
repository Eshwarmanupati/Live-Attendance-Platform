import { WebSocketServer } from "ws";
import User from "../models/User.js";
import logger from "../utils/logger.js";
import { verifyToken } from "../utils/generateToken.js";
import { RoomRegistry } from "./rooms.js";
import {
  handleSubscribe,
  handleStartSession,
  handleMarkAttendance,
  handleEndSession,
  send,
} from "./handlers.js";
import { WS_IN, WS_OUT, WS_CLOSE } from "../utils/constants.js";

const HEARTBEAT_INTERVAL_MS = 30_000;
const MAX_MESSAGE_BYTES = 8 * 1024;
/** Per-socket message budget, refilled each interval. Stops a hot loop client. */
const MESSAGE_BUDGET = 40;
const BUDGET_WINDOW_MS = 10_000;

const authenticateClient = async (token) => {
  if (!token) throw new Error("No authentication token provided");
  const decoded = verifyToken(token);
  const user = await User.findById(decoded.id);
  if (!user) throw new Error("Account no longer exists");
  return user;
};

export const setupWebSocketServer = (httpServer) => {
  const wss = new WebSocketServer({
    server: httpServer,
    maxPayload: MAX_MESSAGE_BYTES,
    // A live roster is small and latency-sensitive; compression is not worth it.
    perMessageDeflate: false,
  });

  const rooms = new RoomRegistry();

  const handlers = {
    [WS_IN.SUBSCRIBE]: handleSubscribe,
    [WS_IN.START_SESSION]: handleStartSession,
    [WS_IN.MARK_ATTENDANCE]: handleMarkAttendance,
    [WS_IN.END_SESSION]: handleEndSession,
  };

  wss.on("connection", async (ws, req) => {
    ws.isAlive = true;
    ws.messageCount = 0;

    const { searchParams } = new URL(req.url, "http://localhost");
    const token = searchParams.get("token");

    let user;
    try {
      user = await authenticateClient(token);
    } catch (error) {
      send(ws, WS_OUT.ERROR, { message: `Authentication failed: ${error.message}` });
      // A close code lets the client tell "bad credentials" (don't retry) from
      // "connection dropped" (do retry) instead of reconnecting forever.
      ws.close(WS_CLOSE.UNAUTHORIZED, "Unauthorized");
      return;
    }

    ws.user = user;
    const ctx = { ws, user, rooms, wss };

    send(ws, WS_OUT.CONNECTED, {
      user: { id: String(user._id), name: user.name, role: user.role },
    });

    // Subscribe immediately so a client is live without a second round trip.
    try {
      await handleSubscribe(ctx, {});
    } catch (error) {
      logger.error("Initial subscribe failed", { error: error.message });
    }

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (raw) => {
      ws.messageCount += 1;
      if (ws.messageCount > MESSAGE_BUDGET) {
        send(ws, WS_OUT.ERROR, { message: "Too many messages. Slow down." });
        ws.close(WS_CLOSE.RATE_LIMITED, "Rate limited");
        return;
      }

      let message;
      try {
        message = JSON.parse(raw.toString());
      } catch {
        return send(ws, WS_OUT.ERROR, { message: "Invalid JSON message." });
      }

      const { type, ...payload } = message ?? {};
      const handler = handlers[type];
      if (!handler) return send(ws, WS_OUT.ERROR, { message: `Unknown event type: "${type}"` });

      try {
        await handler(ctx, payload);
      } catch (error) {
        // A handler that throws must not take the process down with it.
        logger.error("Unhandled WebSocket handler error", { type, error: error.message, stack: error.stack });
        send(ws, WS_OUT.ERROR, { message: "Something went wrong. Please try again." });
      }
    });

    ws.on("close", () => {
      rooms.leaveAll(ws);
    });

    ws.on("error", (error) => {
      logger.warn("WebSocket error", { user: user.email, error: error.message });
    });

    logger.debug("WebSocket client connected", { user: user.email, role: user.role });
  });

  /**
   * Proxies and mobile networks drop connections without a close frame, leaving
   * sockets that look open but are dead. Ping every interval and terminate the
   * ones that never pong.
   */
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        rooms.leaveAll(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.messageCount = 0;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL_MS);

  const budgetReset = setInterval(() => {
    wss.clients.forEach((ws) => {
      ws.messageCount = 0;
    });
  }, BUDGET_WINDOW_MS);

  wss.on("close", () => {
    clearInterval(heartbeat);
    clearInterval(budgetReset);
  });

  wss.rooms = rooms;
  return wss;
};

export default setupWebSocketServer;
