/** API user objects expose `id`; tolerate legacy `_id` if present. */
export const getUserId = (user) => user?.id ?? user?._id ?? null;
