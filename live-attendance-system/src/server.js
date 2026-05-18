import dotenv from "dotenv";
import { createServer } from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { setupWebSocketServer } from "./websocket/wsServer.js";

dotenv.config();

// Default 5001: macOS often reserves 5000 for AirPlay Receiver.
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Create HTTP server from the Express app
    const httpServer = createServer(app);

    // 3. Attach WebSocket server (no port conflict — same server)
    setupWebSocketServer(httpServer);

    // 4. Start listening
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`   REST API: http://localhost:${PORT}/api`);
      console.log(`   WebSocket: ws://localhost:${PORT}?token=<jwt>\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
