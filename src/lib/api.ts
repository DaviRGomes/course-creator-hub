import axios from "axios";
import { DEMO_MODE } from "@/lib/config";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8090",
});

api.interceptors.request.use((config) => {
  if (DEMO_MODE) {
    const controller = new AbortController();
    controller.abort();
    config.signal = controller.signal;
    return config;
  }
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (DEMO_MODE) return Promise.reject(err);
    if (err.response?.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_email");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Helper to wrap API calls with demo mode check
export const apiCall = async <T = void>(demoFn: () => void, apiFn: () => Promise<any>): Promise<T> => {
  if (DEMO_MODE) {
    demoFn();
    return undefined as T;
  }
  const res = await apiFn();
  return res as T;
};

export default api;
