import api from "./axios";

export const attendanceService = {
  getByClass: (classId) => api.get(`/attendance/${classId}`),
  getStudentAttendance: (classId, studentId) =>
    api.get(`/attendance/${classId}/student/${studentId}`),
};
