import dotenv from "dotenv";
import { createServer } from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { setupWebSocketServer } from "./websocket/wsServer.js";

dotenv.config();

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = createServer(app);
    setupWebSocketServer(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`  REST:      http://localhost:${PORT}/api`);
      console.log(`  WebSocket: ws://localhost:${PORT}?token=<jwt>`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
