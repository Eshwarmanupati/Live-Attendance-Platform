import axios from "axios";
import storage from "../utils/storage";
import { API_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = storage.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * An expired token is reported to the app rather than handled with
 * `window.location.href`, which threw away React state and any unsaved input.
 * AuthContext listens for this and clears the session in place.
 */
export const AUTH_EXPIRED_EVENT = "auth:expired";

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && storage.get("token")) {
      storage.remove("token");
      storage.remove("user");
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

/** Pulls the server's message out of an axios error, with a usable fallback. */
export const errorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === "ERR_NETWORK") return "Cannot reach the server. Is the API running?";
  if (error?.code === "ECONNABORTED") return "The server took too long to respond.";
  return fallback;
};

export default api;
