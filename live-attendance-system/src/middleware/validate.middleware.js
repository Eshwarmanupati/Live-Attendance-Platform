import ApiError from "../utils/ApiError.js";
import { formatZodError } from "../utils/zodError.js";

/**
 * Generic Zod validation middleware factory.
 * Validates req.body against the given schema before the controller runs.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(new ApiError(400, formatZodError(result.error)));
  }
  req.body = result.data;
  next();
};

export default validate;
