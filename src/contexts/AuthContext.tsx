import React, { createContext, useContext, useState, type ReactNode } from "react";
import api from "@/lib/api";
import { DEMO_MODE } from "@/lib/config";

interface AuthState {
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(() => {
    if (DEMO_MODE) {
      return { token: "demo", email: "admin@demo.com", isAuthenticated: true };
    }
    const token = localStorage.getItem("admin_token");
    return { token, email: localStorage.getItem("admin_email"), isAuthenticated: !!token };
  });

  const login = async (email: string, password: string) => {
    if (DEMO_MODE) {
      setState({ token: "demo", email, isAuthenticated: true });
      return;
    }
    const res = await api.post("/auth/login", { email, password });
    const { token, role } = res.data.data;
    if (role !== "ADMIN") throw new Error("Acesso restrito a administradores");
    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_email", email);
    setState({ token, email, isAuthenticated: true });
  };

  const logout = () => {
    if (DEMO_MODE) {
      setState({ token: null, email: null, isAuthenticated: false });
      return;
    }
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    setState({ token: null, email: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isDemo: DEMO_MODE }}>
      {children}
    </AuthContext.Provider>
  );
};
