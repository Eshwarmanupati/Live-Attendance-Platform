import { createContext, useContext, useState, useCallback } from "react";
import { authService } from "../api/auth";
import storage from "../utils/storage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => storage.get("token"));
  const [user, setUser] = useState(() => storage.get("user"));
  const [loading] = useState(false);

  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials);
    const { token: t, user: u } = res.data.data;
    storage.set("token", t);
    storage.set("user", u);
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (data) => {
    const res = await authService.signup(data);
    const { token: t, user: u } = res.data.data;
    storage.set("token", t);
    storage.set("user", u);
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    storage.remove("token");
    storage.remove("user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
