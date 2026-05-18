import express, { json, urlencoded } from "express";
import cors from "cors";

// Route imports
import routes from "./routes/index.js";

// Middleware imports
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

// ===========================
// Global Middleware
// ===========================

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (no Origin header) and configured dev origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(json());
app.use(urlencoded({ extended: true }));

// ===========================
// Health Check Route
// ===========================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Live Attendance System API is running.",
    timestamp: new Date().toISOString(),
  });
});

// ===========================
// API Routes
// ===========================

app.use("/api", routes);

// ===========================
// 404 Handler
// ===========================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ===========================
// Global Error Middleware
// ===========================

app.use(errorMiddleware);

export default app;