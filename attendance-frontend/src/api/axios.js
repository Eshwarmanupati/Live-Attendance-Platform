import axios from "axios";
import storage from "../utils/storage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = storage.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      storage.remove("token");
      storage.remove("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
