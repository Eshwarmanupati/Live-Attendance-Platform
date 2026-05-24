import ApiError from "../utils/ApiError.js";

const roleMiddleware = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required."));
  }
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, `Access denied. Required role(s): ${roles.join(", ")}`));
  }
  next();
};

export default roleMiddleware;