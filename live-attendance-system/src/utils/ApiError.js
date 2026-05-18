class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguish from unexpected errors

    // Maintains proper stack trace (V8 only)
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
