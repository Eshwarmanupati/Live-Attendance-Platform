/** The API returns `id`; Mongo documents carry `_id`. Accept either. */
export const getUserId = (user) => user?.id ?? user?._id ?? null;

export const sameId = (a, b) => Boolean(a) && Boolean(b) && String(a) === String(b);
