import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DEMO_MODE } from "@/lib/config";
import { mockCourses, mockModules, mockVideos, mockActivities, mockEnrollments } from "@/lib/mockData";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Award, BookOpen, CheckCircle2, Circle, PlayCircle, FileQuestion } from "lucide-react";

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const CourseOverviewPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ["student-course", courseId],
    queryFn: () => {
      if (DEMO_MODE) return Promise.resolve(mockCourses.find((c) => c.id === courseId));
      return api.get(`/courses/${courseId}`).then((r) => r.data.data ?? r.data);
    },
  });

  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ["student-modules", courseId],
    queryFn: () => {
      if (DEMO_MODE) return Promise.resolve(mockModules[courseId!] || []);
      return api.get(`/courses/${courseId}/modules`).then((r) => r.data.data ?? r.data);
    },
  });

  const enrollment = DEMO_MODE
    ? mockEnrollments.find((e) => e.courseId === courseId)
    : null;

  const isLoading = loadingCourse || loadingModules;

  return (
    <div>
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-fast mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao painel
      </button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Course header */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{course?.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{course?.description}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary/30 shrink-0" />
            </div>
            {enrollment && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progresso geral</span>
                  <span className="font-medium text-foreground">{enrollment.progress}%</span>
                </div>
                <Progress value={enrollment.progress} className="h-2" />
                {enrollment.progress === 100 && (
                  <Button
                    className="mt-3 gap-2"
                    onClick={() => navigate(`/certificate/${courseId}`)}
                  >
                    <Award className="h-4 w-4" />
                    Ver Certificado
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Modules */}
          <h2 className="text-lg font-semibold text-foreground mb-4">Módulos</h2>
          <div className="space-y-3">
            {modules.map((mod: any, idx: number) => {
              const videos = DEMO_MODE ? (mockVideos[mod.id] || []) : [];
              const activities = DEMO_MODE ? (mockActivities[mod.id] || []) : [];

              // Build sequence
              const sequence = [
                ...videos.map((v: any) => ({ type: "video" as const, ...v, completed: enrollment?.completedLessons.includes(v.id) })),
                ...activities.map((a: any) => ({ type: "activity" as const, id: a.id, title: a.title, orderIndex: a.sequenceOrder, completed: enrollment?.completedActivities.includes(a.id) })),
              ].sort((a, b) => a.orderIndex - b.orderIndex);

              const completedCount = sequence.filter((s) => s.completed).length;

              return (
                <div key={mod.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Módulo {idx + 1}</span>
                        <Badge variant="outline" className="text-xs">
                          {completedCount}/{sequence.length}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mt-0.5">{mod.title}</h3>
                      <p className="text-xs text-muted-foreground">{mod.description}</p>
                    </div>
                  </div>

                  <div className="border-t border-border divide-y divide-border">
                    {sequence.map((item) => (
                      <button
                        key={item.id}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-accent/50 transition-fast"
                        onClick={() => {
                          if (item.type === "video") {
                            navigate(`/learn/${courseId}/modules/${mod.id}/lesson/${item.id}`);
                          } else {
                            navigate(`/learn/${courseId}/modules/${mod.id}/quiz/${item.id}`);
                          }
                        }}
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-border shrink-0" />
                        )}
                        {item.type === "video" ? (
                          <PlayCircle className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <FileQuestion className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <span className="text-sm text-foreground flex-1">{item.title}</span>
                        {item.type === "video" && "duration" in item && (
                          <span className="text-xs text-muted-foreground">{formatDuration(item.duration)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CourseOverviewPage;
