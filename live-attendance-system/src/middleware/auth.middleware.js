import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/generateToken.js";

const authMiddleware = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("No token provided. Please sign in.");
    }

    const decoded = verifyToken(authHeader.slice(7).trim());

    const user = await User.findById(decoded.id);
    if (!user) throw ApiError.unauthorized("This account no longer exists.");

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") return next(ApiError.unauthorized("Invalid token."));
    if (error.name === "TokenExpiredError") {
      return next(ApiError.unauthorized("Your session expired. Please sign in again."));
    }
    next(error);
  }
};

export default authMiddleware;
