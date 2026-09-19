import ApiError from "../utils/ApiError.js";

const roleMiddleware = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`This action is available to ${roles.join(" or ")} accounts only.`));
  }
  next();
};

export default roleMiddleware;
