import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import config from "./config/env.js";
import { isDbConnected } from "./config/db.js";
import routes from "./routes/index.js";
import errorMiddleware, { notFoundMiddleware } from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import logger from "./utils/logger.js";

const app = express();

// Render, Railway and Vercel all sit behind a proxy; without this the client IP
// seen by the rate limiter is the proxy's, so every user shares one bucket.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());
app.use(compression());

/**
 * Local dev ports are always allowed. Production origins come from CLIENT_URL,
 * which is read through `config` — the previous code read process.env at module
 * scope before dotenv had run, so the deployed frontend was never allowlisted
 * and every browser request failed CORS.
 */
const devOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

const allowedOrigins = [...new Set([...config.clientOrigins, ...(config.isProduction ? [] : devOrigins)])];

const isAllowedOrigin = (origin) => {
  const normalised = origin.replace(/\/$/, "");
  if (allowedOrigins.includes(normalised)) return true;
  // Vercel gives every branch and commit its own preview hostname; allow the
  // project's previews rather than pinning a URL that changes on each deploy.
  return config.clientOrigins.some((allowed) => {
    const project = allowed.match(/^https:\/\/([^.]+)\.vercel\.app$/)?.[1];
    return project ? new RegExp(`^https://${project}-[a-z0-9-]+\\.vercel\\.app$`).test(normalised) : false;
  });
};

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header: curl, health checks, server-to-server. Not a browser,
      // so the same-origin policy is not what is protecting anything here.
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      logger.warn("Blocked CORS origin", { origin });
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

if (!config.isTest) {
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      logger.debug(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
    });
    next();
  });
}

/** Liveness probe for the host's health check and the frontend's status badge. */
app.get("/health", (_req, res) => {
  const dbUp = isDbConnected();
  res.status(dbUp ? 200 : 503).json({
    success: dbUp,
    message: dbUp ? "Live Attendance System API is running." : "Database unavailable.",
    database: dbUp ? "connected" : "disconnected",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiLimiter, routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
