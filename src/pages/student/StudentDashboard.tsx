import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, PlayCircle, Trophy, TrendingUp } from "lucide-react";
import CertificateStatusCard from "@/components/CertificateStatusCard";

interface EnrolledCourse {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  slug: string;
  progress: number;
}

const StudentDashboard = () => {
  const { email } = useAuth();
  const navigate = useNavigate();

  const { data: courses = [], isLoading } = useQuery<EnrolledCourse[]>({
    queryKey: ["student-enrolled-courses"],
    queryFn: () => api.get("/student/courses").then((r) => r.data.data ?? r.data),
  });

  const totalCompleted = courses.filter((c) => c.progress === 100).length;
  const avgProgress = courses.length
    ? Math.round(courses.reduce((s, c) => s + c.progress, 0) / courses.length)
    : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {email?.split("@")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Continue de onde parou</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{courses.length}</p>
            <p className="text-xs text-muted-foreground">Cursos matriculados</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalCompleted}</p>
            <p className="text-xs text-muted-foreground">Cursos concluídos</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{avgProgress}%</p>
            <p className="text-xs text-muted-foreground">Progresso médio</p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-4">Meus Cursos</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Você ainda não está matriculado em nenhum curso.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.id} className="space-y-3">
              <div
                className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-fast hover:shadow-md"
                onClick={() => navigate(`/learn/${c.slug || c.id}`)}
              >
                {c.thumbnail ? (
                  <img
                    src={c.thumbnail}
                    alt={c.title}
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <div className="w-full aspect-video bg-muted flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{c.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>
                    </div>
                    <PlayCircle className="h-5 w-5 text-primary shrink-0 ml-3" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium text-foreground">{c.progress}%</span>
                    </div>
                    <Progress value={c.progress} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Certificate status card */}
              <CertificateStatusCard courseId={c.id} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
