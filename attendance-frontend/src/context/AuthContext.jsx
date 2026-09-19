import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { authService } from "../api/auth";
import { AUTH_EXPIRED_EVENT } from "../api/axios";
import storage from "../utils/storage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => storage.get("token"));
  const [user, setUser] = useState(() => storage.get("user"));
  // True until the stored token has been checked against the server.
  const [loading, setLoading] = useState(() => Boolean(storage.get("token")));

  const applySession = useCallback((nextToken, nextUser) => {
    storage.set("token", nextToken);
    storage.set("user", nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    storage.remove("token");
    storage.remove("user");
    setToken(null);
    setUser(null);
  }, []);

  /**
   * A token in localStorage was previously trusted outright, so an expired
   * session rendered the dashboard and then bounced the user out mid-request.
   * Verify it once on load instead.
   */
  useEffect(() => {
    // `loading` already starts false when no token was stored, so there is
    // nothing to verify and nothing to reset here.
    const storedToken = storage.get("token");
    if (!storedToken) return undefined;

    let cancelled = false;
    authService
      .getMe()
      .then((res) => {
        if (cancelled) return;
        const fresh = res.data.data.user;
        storage.set("user", fresh);
        setUser(fresh);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  /** The axios interceptor reports a rejected token here. */
  useEffect(() => {
    const onExpired = () => clearSession();
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [clearSession]);

  const login = useCallback(
    async (credentials) => {
      const res = await authService.login(credentials);
      const { token: nextToken, user: nextUser } = res.data.data;
      applySession(nextToken, nextUser);
      return nextUser;
    },
    [applySession]
  );

  const signup = useCallback(
    async (data) => {
      const res = await authService.signup(data);
      const { token: nextToken, user: nextUser } = res.data.data;
      applySession(nextToken, nextUser);
      return nextUser;
    },
    [applySession]
  );

  const value = useMemo(
    () => ({ user, token, loading, login, signup, logout: clearSession }),
    [user, token, loading, login, signup, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
