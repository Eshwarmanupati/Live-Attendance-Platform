/**
 * Wraps an async route handler so a rejected promise reaches the error
 * middleware instead of hanging the request. Replaces the try/catch that was
 * repeated in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
