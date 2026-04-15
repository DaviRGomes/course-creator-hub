// Demo mode: intercept API calls with mock data when VITE_API_URL is not set
import type { AxiosInstance } from "axios";
import {
  mockCourses,
  mockModules,
  mockVideos,
  mockSequences,
  mockMaterials,
  mockActivities,
} from "./mockData";

export const DEMO_MODE = !import.meta.env.VITE_API_URL;

/**
 * Installs a request interceptor that resolves requests with mock data
 * instead of hitting a real backend.
 */
export function installDemoInterceptor(api: AxiosInstance) {
  if (!DEMO_MODE) return;

  api.interceptors.request.use((config) => {
    const url = config.url || "";
    const method = (config.method || "get").toLowerCase();

    const mock = resolve(url, method, config.data);
    if (mock !== undefined) {
      // Return a fake fulfilled response by throwing a cancel with data
      return Promise.reject({
        __MOCK__: true,
        data: mock,
      });
    }
    // Fallback: let it fail naturally
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.__MOCK__) {
        // Convert our mock marker into a resolved response
        return Promise.resolve({ data: err.data, status: 200, statusText: "OK", headers: {}, config: {} });
      }
      return Promise.reject(err);
    }
  );
}

function resolve(url: string, method: string, body?: any): any {
  // AUTH
  if (url.includes("/auth/me")) {
    return { data: { email: "demo@conexoessociais.com.br", name: "Aluno Demo", role: "STUDENT" } };
  }
  if (url.includes("/auth/login")) {
    return { data: { email: "demo@conexoessociais.com.br", name: "Aluno Demo", role: "STUDENT" } };
  }
  if (url.includes("/auth/logout")) {
    return { success: true };
  }

  // STUDENT COURSES (enrolled)
  if (url === "/student/courses" || url.endsWith("/student/courses")) {
    return { data: mockCourses };
  }

  // STUDENT ENROLLED CHECK
  const enrolledMatch = url.match(/\/student\/enrolled\/(.+)/);
  if (enrolledMatch) {
    return { data: true };
  }

  // COURSE BY SLUG
  const slugMatch = url.match(/\/courses\/slug\/(.+)/);
  if (slugMatch) {
    const slug = slugMatch[1];
    const course = mockCourses.find((c) => c.slug === slug);
    return { data: course || null };
  }

  // MODULE SEQUENCE
  const seqMatch = url.match(/\/courses\/(.+?)\/modules\/(.+?)\/sequence/);
  if (seqMatch) {
    const modId = seqMatch[2];
    return { data: mockSequences[modId] || [] };
  }

  // MODULE MATERIALS
  const matMatch = url.match(/\/courses\/(.+?)\/modules\/(.+?)\/materials/);
  if (matMatch) {
    const modId = matMatch[2];
    return { data: mockMaterials[modId] || [] };
  }

  // MODULE VIDEOS
  const vidMatch = url.match(/\/courses\/(.+?)\/modules\/(.+?)\/videos/);
  if (vidMatch) {
    const modId = vidMatch[2];
    return { data: mockVideos[modId] || [] };
  }

  // MODULES FOR COURSE
  const modsMatch = url.match(/\/courses\/(.+?)\/modules$/);
  if (modsMatch) {
    const courseId = modsMatch[1];
    return { data: mockModules[courseId] || [] };
  }

  // SINGLE MODULE
  const singleModMatch = url.match(/\/courses\/(.+?)\/modules\/(.+?)$/);
  if (singleModMatch) {
    const courseId = singleModMatch[1];
    const modId = singleModMatch[2];
    const mod = (mockModules[courseId] || []).find((m) => m.id === modId);
    return { data: mod || null };
  }

  // ACTIVITY BY ID
  const actMatch = url.match(/\/activities\/(.+)/);
  if (actMatch) {
    const actId = actMatch[1];
    for (const acts of Object.values(mockActivities)) {
      const found = acts.find((a) => a.id === actId);
      if (found) return { data: found };
    }
    return { data: null };
  }

  // QUIZ SUBMISSION (POST)
  if (method === "post" && url.includes("/submit")) {
    return { data: { passed: true, score: 80, passingScore: 70 } };
  }

  // MARK WATCHED (POST)
  if (method === "post" && url.includes("/watched")) {
    return { data: { success: true } };
  }

  // COURSE BY ID (fallback)
  const courseIdMatch = url.match(/\/courses\/(\d+)$/);
  if (courseIdMatch) {
    const course = mockCourses.find((c) => c.id === courseIdMatch[1]);
    return { data: course || null };
  }

  return undefined;
}
