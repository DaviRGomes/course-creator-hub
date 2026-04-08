import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import api from "@/lib/api";

interface AuthState {
  email: string | null;
  name: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends Omit<AuthState, 'isLoading'> {
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    email: null,
    name: null,
    role: null,
    isAuthenticated: false,
    isLoading: true, // Start loading — wait for /auth/me (D-03)
  });

  // Init: check session via cookie (D-03)
  useEffect(() => {
    api.get("/auth/me")
      .then((res) => {
        const { name, email, role } = res.data.data;
        setState({
          email,
          name: name || null,
          role,
          isAuthenticated: true,
          isLoading: false,
        });
      })
      .catch(() => {
        setState({
          email: null,
          name: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
        });
      });
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    const res = await api.post("/auth/login", { email, password });
    // D-02: response body has {name, email, role} — no token field
    const { name, role } = res.data.data;
    setState({
      email,
      name: name || null,
      role,
      isAuthenticated: true,
      isLoading: false,
    });
    return role;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Network error during logout — proceed with client-side cleanup anyway
    }
    setState({
      email: null,
      name: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const isAdmin = state.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        email: state.email,
        name: state.name,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        login,
        logout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
