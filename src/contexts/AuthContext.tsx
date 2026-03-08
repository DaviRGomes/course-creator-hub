import React, { createContext, useContext, useState, type ReactNode } from "react";
import api from "@/lib/api";

interface AuthState {
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem("admin_token");
    return { token, email: localStorage.getItem("admin_email"), isAuthenticated: !!token };
  });

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, role } = res.data.data;
    if (role !== "ADMIN") throw new Error("Acesso restrito a administradores");
    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_email", email);
    setState({ token, email, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    setState({ token: null, email: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
