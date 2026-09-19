import config from "../config/env.js";
import logger from "../utils/logger.js";

export const notFoundMiddleware = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorMiddleware = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  const code = err.code;

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}.`;
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue ?? { field: null })[0] ?? "field";
    message = `${field.charAt(0).toUpperCase()}${field.slice(1)} already exists.`;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body is not valid JSON.";
  }

  if (!err.isOperational && statusCode >= 500) {
    logger.error("Unhandled error", { method: req.method, path: req.originalUrl, error: err.message, stack: err.stack });
    // Never leak internals to the client in production.
    if (config.isProduction) message = "Something went wrong on our end.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(typeof code === "string" ? { code } : {}),
  });
};

export default errorMiddleware;
