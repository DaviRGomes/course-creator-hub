import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8095",
  withCredentials: true,   // Envia cookie auth_token automaticamente (Fase 7)
});

// Request interceptor REMOVIDO — cookie HttpOnly e enviado automaticamente
// pelo browser quando withCredentials: true. Nao ha mais Authorization header
// para requests de browser. (D-02, Fase 7)

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Evitar toast em paginas de login/auth (nao e sessao expirada — e credencial invalida)
      const isAuthEndpoint = err.config?.url?.includes("/auth/login")
          || err.config?.url?.includes("/auth/register")
          || err.config?.url?.includes("/auth/me");
      if (!isAuthEndpoint) {
        toast.error("Sessao expirada", {
          description: "Faca login novamente para continuar.",
          duration: 3000,
        });
      }
      // Hard redirect — clears in-flight state (UI-SPEC Section 2)
      // Skip redirect if already on login page or during /auth/me init check
      if (!isAuthEndpoint) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
