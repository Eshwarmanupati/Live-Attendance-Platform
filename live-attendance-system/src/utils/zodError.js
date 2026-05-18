/** Zod v4 exposes validation messages on `issues`, not `errors`. */
export const formatZodError = (zodError) =>
  zodError.issues.map((issue) => issue.message).join(", ");

export const firstZodIssue = (zodError) =>
  zodError.issues[0]?.message ?? "Validation failed.";
