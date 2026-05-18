import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

/**
 * Middleware: verifies Bearer JWT from Authorization header.
 * Attaches the authenticated user object to req.user.
 *
 * Expected header: Authorization: Bearer <token>
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "No token provided. Please log in.");
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Fetch user from DB (ensures user still exists)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      throw new ApiError(401, "User no longer exists.");
    }

    // 4. Attach user to request for downstream handlers
    req.user = user;
    next();
  } catch (error) {
    // Handle JWT-specific errors with descriptive messages
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token."));
    }
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token has expired. Please log in again."));
    }
    next(error);
  }
};

export default authMiddleware;
