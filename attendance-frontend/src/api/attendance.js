import api, { errorMessage } from "./axios";
import { API_URL } from "../utils/constants";
import storage from "../utils/storage";

export const attendanceService = {
  /** Teacher: every session of a class with its records. */
  getClassAttendance: (classId) => api.get(`/attendance/class/${classId}`),
  /** Live roster for one session — teacher or enrolled student. */
  getSessionAttendance: (sessionId) => api.get(`/attendance/session/${sessionId}`),
  /** Student: own attendance and rates across enrolled classes, in one request. */
  getMySummary: () => api.get("/attendance/me"),
  /** Teacher dashboard tiles. */
  getStats: () => api.get("/attendance/stats"),
};

/**
 * Downloads the CSV export. Fetch is used directly so the auth header is sent —
 * a plain link cannot carry one — and the blob is handed to the browser.
 */
export const downloadClassCsv = async (classId, filenameHint = "attendance.csv") => {
  const response = await fetch(`${API_URL}/attendance/class/${classId}/export`, {
    headers: { Authorization: `Bearer ${storage.get("token") ?? ""}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Export failed.");
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const filename = disposition.match(/filename="?([^"]+)"?/)?.[1] ?? filenameHint;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export { errorMessage };
export default attendanceService;
