import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (payload) => {
    const data = await api.post("/auth/login", payload);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => api.post("/auth/register", payload);

  const logout = async () => {
    await api.post("/auth/logout", {});
    setUser(null);
  };

  const refreshUser = async () => {
    const data = await api.get("/auth/me");
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, logout, register, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

