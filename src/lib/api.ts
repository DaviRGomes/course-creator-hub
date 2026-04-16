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
    const status = err.response?.status;
    const isAuthEndpoint = err.config?.url?.includes("/auth/login")
        || err.config?.url?.includes("/auth/register")
        || err.config?.url?.includes("/auth/me");

    if (status === 401 && !isAuthEndpoint) {
      // Sessão expirada — redireciona globalmente (mutations não tratam isso individualmente)
      toast.error("Sessão expirada", {
        description: "Faça login novamente para continuar.",
        duration: 3000,
      });
      window.location.href = "/login";
    } else if (status === 403 && !isAuthEndpoint) {
      // Acesso negado — mutations não tratam 403 individualmente
      toast.error("Acesso negado", {
        description: "Você não tem permissão para realizar esta ação.",
        duration: 4000,
      });
    }
    // 400/404/422/429/500: cada mutation tem seu próprio onError com mensagem contextual.
    // Tratar aqui causaria toast duplicado.

    return Promise.reject(err);
  }
);

// Install demo interceptor when no backend URL is configured
import { installDemoInterceptor } from "./demoInterceptor";
installDemoInterceptor(api);

export default api;
