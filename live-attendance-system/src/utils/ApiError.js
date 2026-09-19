/**
 * Errors thrown with ApiError are "operational": expected, safe to show to the
 * client, and never logged as a crash. Anything else reaching the error
 * middleware is a genuine bug and gets logged with its stack.
 */
class ApiError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code) { return new ApiError(400, message, code); }
  static unauthorized(message = "Authentication required.", code) { return new ApiError(401, message, code); }
  static forbidden(message = "You do not have access to this resource.", code) { return new ApiError(403, message, code); }
  static notFound(message = "Resource not found.", code) { return new ApiError(404, message, code); }
  static conflict(message, code) { return new ApiError(409, message, code); }
}

export default ApiError;
