import ApiError from "../utils/ApiError.js";
import { formatZodError } from "../utils/zodError.js";

/** Validates and replaces req[source] with the parsed (coerced, trimmed) value. */
const validate = (schema, source = "body") => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(ApiError.badRequest(formatZodError(result.error)));

  if (source === "body") req.body = result.data;
  else req.validated = { ...(req.validated ?? {}), ...result.data };

  next();
};

/** Rejects a malformed :id before it reaches Mongoose and becomes a CastError. */
export const validateObjectIdParam = (param = "id") => (req, _res, next) => {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params[param] ?? "")) {
    return next(ApiError.badRequest(`Invalid ${param}.`));
  }
  next();
};

export default validate;
