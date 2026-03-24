import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import StudentLayout from "@/components/StudentLayout";
import Login from "@/pages/Login";
import UsersPage from "@/pages/UsersPage";
import CoursesPage from "@/pages/CoursesPage";
import CourseDetailPage from "@/pages/CourseDetailPage";
import ModuleDetailPage from "@/pages/ModuleDetailPage";
import StudentDashboard from "@/pages/student/StudentDashboard";
import ProfilePage from "@/pages/student/ProfilePage";
import CourseOverviewPage from "@/pages/student/CourseOverviewPage";
import LessonPlayerPage from "@/pages/student/LessonPlayerPage";
import QuizPage from "@/pages/student/QuizPage";
import CertificatePage from "@/pages/student/CertificatePage";
import CertificateSettingsPage from "@/pages/CertificateSettingsPage";
import CertificatesPage from "@/pages/CertificatesPage";
import DashboardPage from "@/pages/DashboardPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import FinancialPage from "@/pages/FinancialPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Student routes */}
            <Route path="/" element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="certificate/:courseId" element={<CertificatePage />} />
              <Route path="learn/:slug" element={<CourseOverviewPage />} />
              <Route path="learn/:slug/modules/:moduleId/lesson/:lessonId" element={<LessonPlayerPage />} />
              <Route path="learn/:slug/modules/:moduleId/quiz/:quizId" element={<QuizPage />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="courses/:id" element={<CourseDetailPage />} />
              <Route path="courses/:id/modules/:moduleId" element={<ModuleDetailPage />} />
              <Route path="certificate-settings" element={<CertificateSettingsPage />} />
              <Route path="certificates" element={<CertificatesPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="financial" element={<FinancialPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
