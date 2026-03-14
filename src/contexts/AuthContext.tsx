import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, clearAuth } from "@/lib/api";

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const raw = await api("/api/accounts/me/");
    if (!raw.is_staff) {
      clearAuth();
      setIsLoggedIn(false);
      setIsAdmin(false);
      setUser(null);
      throw new Error("Admin access required.");
    }
    setUser({
      id: String(raw.id),
      firstName: raw.first_name || "",
      lastName: raw.last_name || "",
      email: raw.email || "",
    });
    setIsLoggedIn(true);
    setIsAdmin(true);
  };

  const login = async (username: string, password: string) => {
    const data = await api("/api/auth/token/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);
    await refreshUser();
    return true;
  };

  const logout = () => {
    clearAuth();
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser()
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
