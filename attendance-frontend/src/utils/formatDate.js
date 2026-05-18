/**
 * Date formatting helpers used across the dashboard.
 */

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

export const formatTime = (date) =>
  new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });

export const formatDateTime = (date) =>
  `${formatDate(date)} at ${formatTime(date)}`;

export const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60)  return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};