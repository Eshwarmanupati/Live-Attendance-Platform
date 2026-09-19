import api from "./axios";

export const sessionService = {
  /** Live sessions for the signed-in user's classes — restores state on refresh. */
  getActive: () => api.get("/sessions/active"),
};

export default sessionService;
