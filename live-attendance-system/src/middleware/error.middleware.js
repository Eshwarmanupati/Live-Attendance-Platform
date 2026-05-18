import ApiError from "../utils/ApiError.js";

/**
 * Centralized error handling middleware.
 * Must be the LAST middleware registered in app.js (4 params = Express error handler).
 *
 * Handles:
 * - Custom ApiError instances
 * - Mongoose validation errors
 * - Mongoose duplicate key errors
 * - Mongoose cast errors (invalid ObjectId)
 * - JWT errors (caught in authMiddleware, but as a fallback)
 * - Unknown/unexpected errors
 */
const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // --- Mongoose: invalid ObjectId ---
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // --- Mongoose: duplicate key (e.g. unique email) ---
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // --- Mongoose: schema validation errors ---
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Log unexpected errors (non-operational) for debugging
  if (!err.isOperational) {
    console.error("🔥 Unexpected Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorMiddleware;