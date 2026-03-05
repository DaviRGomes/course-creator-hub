import { useNavigate } from "react-router-dom";
import { DEMO_MODE } from "@/lib/config";
import { mockCourses, mockEnrollments } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Award, BookOpen, PlayCircle, Trophy, TrendingUp } from "lucide-react";

const StudentDashboard = () => {
  const { email } = useAuth();
  const navigate = useNavigate();

  const enrollments = DEMO_MODE ? mockEnrollments : [];
  const enrolledCourses = enrollments.map((e) => {
    const course = mockCourses.find((c) => c.id === e.courseId);
    return { ...e, course };
  });

  const totalCompleted = enrollments.filter((e) => e.progress === 100).length;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length)
    : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {email?.split("@")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Continue de onde parou</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{enrollments.length}</p>
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

      {/* Enrolled courses */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Meus Cursos</h2>
      {enrolledCourses.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Você ainda não está matriculado em nenhum curso.</p>
          <Button onClick={() => navigate("/catalog")}>Ver Catálogo</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrolledCourses.map((ec) => (
            <div
              key={ec.courseId}
              className="bg-card border border-border rounded-xl p-5 transition-fast hover:shadow-md cursor-pointer"
              onClick={() => navigate(`/learn/${ec.courseId}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{ec.course?.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ec.completedLessons.length} aulas concluídas
                  </p>
                </div>
                {ec.progress === 100 ? (
                  <Award className="h-5 w-5 text-success shrink-0" />
                ) : (
                  <PlayCircle className="h-5 w-5 text-primary shrink-0" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium text-foreground">{ec.progress}%</span>
                </div>
                <Progress value={ec.progress} className="h-2" />
              </div>
              {ec.progress === 100 && (
                <Button
                  size="sm"
                  className="w-full mt-3 gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/certificate/${ec.courseId}`);
                  }}
                >
                  <Award className="h-4 w-4" />
                  Ver Certificado
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
