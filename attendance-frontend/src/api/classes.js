import api from "./axios";

export const classService = {
  /** scope: "mine" (default) or "available" — students browsing classes to join. */
  getAll: (scope) => api.get("/classes", { params: scope ? { scope } : undefined }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post("/classes", data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  remove: (id) => api.delete(`/classes/${id}`),
  joinByCode: (joinCode) => api.post("/classes/join", { joinCode }),
  enroll: (id) => api.post(`/classes/${id}/enroll`),
  leave: (id) => api.delete(`/classes/${id}/enroll`),
};

export default classService;
