import { createContext, useContext, useState, useEffect } from "react";
import * as authService from "../services/authService.js";
import { setAccessToken } from "../lib/axios.js";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, try to silently restore the session
  useEffect(() => {
    (async () => {
      try {
        const { accessToken } = await authService.refresh();
        setAccessToken(accessToken);
        const { user } = await authService.getMe();
        setUser(user);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (phone, password) => {
    const { user, accessToken } = await authService.login(phone, password);
    setAccessToken(accessToken);
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}