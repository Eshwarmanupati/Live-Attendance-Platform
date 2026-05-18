import ApiError from "../utils/ApiError.js";

/**
 * Middleware factory: restricts route access to specified roles.
 * Must be used AFTER authMiddleware (requires req.user to be set).
 *
 * Usage:
 *   router.post("/classes", authMiddleware, roleMiddleware("teacher"), createClass);
 *
 * @param {...string} roles - Allowed roles (e.g., "teacher", "student")
 */
const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required."));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. Required role(s): ${roles.join(", ")}`
        )
      );
    }

    next();
  };
};

export default roleMiddleware;