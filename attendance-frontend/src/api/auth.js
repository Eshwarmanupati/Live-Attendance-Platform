import api from "./axios";

export const authService = {
  signup: (data) => api.post("/auth/signup", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};
