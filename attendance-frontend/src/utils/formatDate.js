const locale = undefined; // use the visitor's locale

export const formatDate = (date) =>
  new Date(date).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });

export const formatTime = (date) =>
  new Date(date).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

export const formatDateTime = (date) => `${formatDate(date)}, ${formatTime(date)}`;

export const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

/** Counts up from a start time — used by the live session timer. */
export const elapsedSince = (startedAt) => {
  const totalSeconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt)) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
};
