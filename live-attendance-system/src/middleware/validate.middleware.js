import ApiError from "../utils/ApiError.js";
import { formatZodError } from "../utils/zodError.js";

const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(new ApiError(400, formatZodError(result.error)));
  }
  req.body = result.data;
  next();
};

export default validate;
