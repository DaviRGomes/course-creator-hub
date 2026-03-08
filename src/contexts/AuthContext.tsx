import React, { createContext, useContext, useState, type ReactNode } from "react";
import api from "@/lib/api";

interface AuthState {
  token: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<string>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem("auth_token");
    return {
      token,
      email: localStorage.getItem("auth_email"),
      name: localStorage.getItem("admin_name"),
      role: localStorage.getItem("auth_role"),
      isAuthenticated: !!token,
    };
  });

  const login = async (email: string, password: string): Promise<string> => {
    const res = await api.post("/auth/login", { email, password });
    const { token, name, role } = res.data.data;
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_email", email);
    localStorage.setItem("admin_name", name || "");
    localStorage.setItem("auth_role", role);
    setState({ token, email, name: name || null, role, isAuthenticated: true });
    return role;
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_email");
    localStorage.removeItem("admin_name");
    localStorage.removeItem("auth_role");
    setState({ token: null, email: null, name: null, role: null, isAuthenticated: false });
  };

  const isAdmin = state.role === "ADMIN";

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
