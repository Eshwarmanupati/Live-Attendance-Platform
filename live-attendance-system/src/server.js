/**
 * config/env.js imports "dotenv/config" and validates the result, and it is the
 * first import here so every module below it sees a populated process.env.
 */
import config from "./config/env.js";
import { createServer } from "http";
import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { setupWebSocketServer } from "./websocket/wsServer.js";
import { closeStaleSessions } from "./services/session.service.js";
import logger from "./utils/logger.js";

const startServer = async () => {
  await connectDB();

  // A session left open by a crash would otherwise block its class forever,
  // because the unique index refuses to create a second active one.
  await closeStaleSessions();

  const httpServer = createServer(app);
  const wss = setupWebSocketServer(httpServer);

  await new Promise((resolve) => httpServer.listen(config.PORT, resolve));

  logger.info(`Server listening on port ${config.PORT} (${config.NODE_ENV})`);
  if (!config.isProduction) {
    logger.info(`  REST      http://localhost:${config.PORT}/api`);
    logger.info(`  Health    http://localhost:${config.PORT}/health`);
    logger.info(`  WebSocket ws://localhost:${config.PORT}?token=<jwt>`);
  }

  /**
   * Hosts send SIGTERM and then kill the process; draining first means no
   * request is cut off mid-write and no socket is left half-closed.
   */
  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — shutting down`);

    const forceExit = setTimeout(() => {
      logger.error("Graceful shutdown timed out — forcing exit");
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    wss.clients.forEach((client) => client.close(1001, "Server shutting down"));
    wss.close();
    httpServer.close();
    await disconnectDB().catch(() => {});
    clearTimeout(forceExit);
    process.exit(0);
  };

  ["SIGTERM", "SIGINT"].forEach((signal) => process.on(signal, () => shutdown(signal)));

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", { reason: reason?.message ?? String(reason) });
  });
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception — exiting", { error: error.message, stack: error.stack });
    shutdown("uncaughtException");
  });

  return { httpServer, wss };
};

startServer().catch((error) => {
  logger.error("Failed to start server", { error: error.message, stack: error.stack });
  process.exit(1);
});
