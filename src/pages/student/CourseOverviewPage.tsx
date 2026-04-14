import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueries } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, PlayCircle, FileQuestion, Circle, CheckCircle2, Lock, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const CourseOverviewPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ["student-course", slug],
    queryFn: () => api.get(`/courses/slug/${slug}`).then((r) => r.data.data ?? r.data),
    enabled: !!slug,
  });

  const courseId = course?.id;

  const { data: enrolled, isLoading: loadingEnrolled } = useQuery({
    queryKey: ["student-enrolled", courseId],
    queryFn: () => api.get(`/student/enrolled/${courseId}`).then((r) => r.data.data ?? r.data),
    enabled: !!courseId,
  });

  useEffect(() => {
    if (!loadingEnrolled && enrolled === false) {
      navigate("/catalog", { replace: true });
    }
  }, [enrolled, loadingEnrolled, navigate]);

  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ["student-modules", courseId],
    queryFn: () => api.get(`/courses/${courseId}/modules`).then((r) => r.data.data ?? r.data),
    enabled: !!courseId && enrolled === true,
  });

  const sequenceQueries = useQueries({
    queries: modules.map((mod: any) => ({
      queryKey: ["module-sequence", courseId, mod.id],
      queryFn: () =>
        api.get(`/courses/${courseId}/modules/${mod.id}/sequence`)
          .then((r) => r.data.data ?? r.data)
          .catch(() => []),
      enabled: modules.length > 0,
    })),
  });

  const materialQueries = useQueries({
    queries: modules.map((mod: any) => ({
      queryKey: ["materials", String(mod.id)],
      queryFn: () =>
        api.get(`/courses/${courseId}/modules/${mod.id}/materials`)
          .then((r) => r.data.data ?? r.data)
          .catch(() => []),
      enabled: modules.length > 0,
    })),
  });

  const isLoading = loadingCourse || loadingEnrolled || loadingModules;

  return (
    <div>
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-fast mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Menu Principal
      </button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="max-w-3xl mx-auto mb-6">
            {course?.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full aspect-video object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-48 bg-muted flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="p-6">
              <h1 className="text-2xl font-bold text-foreground">{course?.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{course?.description}</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-foreground mb-4">Módulos</h2>
          <div className="space-y-3">
            {modules.map((mod: any, idx: number) => {
              const seqData = sequenceQueries[idx];
              const sequence: any[] = (seqData?.data as any[]) ?? [];
              const loading = seqData?.isLoading ?? true;

              return (
                <div key={mod.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Módulo {idx + 1}</span>
                        <Badge variant="outline" className="text-xs">
                          {sequence.length} itens
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mt-0.5">{mod.title}</h3>
                      <p className="text-xs text-muted-foreground">{mod.description}</p>
                    </div>
                  </div>

                  <div className="border-t border-border divide-y divide-border">
                    {loading ? (
                      <div className="px-5 py-3">
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ) : sequence.length === 0 ? (
                      <p className="px-5 py-3 text-xs text-muted-foreground">Nenhum item neste módulo.</p>
                    ) : (
                      sequence.map((item: any) => (
                        <button
                          key={item.id}
                          disabled={item.status === "LOCKED"}
                          className={cn(
                            "w-full flex items-center gap-3 px-5 py-3 text-left transition-fast",
                            item.status === "LOCKED"
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-accent/50"
                          )}
                          onClick={() => {
                            if (item.status === "LOCKED") return;
                            if (item.type === "VIDEO") {
                              navigate(`/learn/${slug}/modules/${mod.id}/lesson/${item.id}`);
                            } else {
                              navigate(`/learn/${slug}/modules/${mod.id}/quiz/${item.id}`);
                            }
                          }}
                        >
                          {item.status === "COMPLETED" ? (
                            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                          ) : item.status === "LOCKED" ? (
                            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-border shrink-0" />
                          )}
                          {item.type === "VIDEO" ? (
                            <PlayCircle className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <FileQuestion className="h-4 w-4 text-amber-500 shrink-0" />
                          )}
                          <span className="text-sm text-foreground flex-1">{item.title}</span>
                          {item.type === "VIDEO" && item.duration != null && (
                            <span className="text-xs text-muted-foreground">{formatDuration(item.duration)}</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  {(() => {
                    const modMaterials: any[] = (materialQueries[idx]?.data as any[]) ?? [];
                    if (modMaterials.length === 0) return null;
                    return (
                      <div className="border-t border-border px-5 py-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          📁 Materiais de Apoio
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {modMaterials.map((m: any) => {
                            const icon =
                              m.type === "PDF" ? "📄" :
                              m.type === "WORD" ? "📝" :
                              m.type === "TXT" ? "📃" :
                              m.type === "SLIDE" ? "📊" :
                              m.type === "IMAGE" ? "🖼️" :
                              m.type === "LINK" ? "🔗" :
                              m.type === "VIDEO_EXTRA" ? "🎬" : "📎";

                            const handleClick = () => {
                              if (m.hasFile) {
                                const base = (api.defaults.baseURL || "/api").replace(/\/$/, "");
                                window.open(
                                  `${base}/courses/${courseId}/modules/${mod.id}/materials/${m.id}/download`,
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              } else if (m.url) {
                                window.open(m.url, "_blank", "noopener,noreferrer");
                              }
                            };

                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={handleClick}
                                className="flex items-center gap-1.5 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1.5 rounded-full transition-colors"
                              >
                                {icon} {m.title}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {(() => {
            const allCompleted = sequenceQueries.length > 0 &&
              sequenceQueries.every(q =>
                Array.isArray(q.data) &&
                (q.data as any[]).length > 0 &&
                (q.data as any[]).every((item: any) => item.status === "COMPLETED")
              );

            return allCompleted ? (
              <div className="mt-8 text-center bg-card border border-border rounded-xl p-6">
                <p className="text-foreground font-medium mb-4">
                  🎉 Parabéns! Você concluiu todos os módulos do curso.
                </p>
                <Button onClick={() => navigate(`/certificate/${courseId}`)} className="gap-2">
                  <Award className="h-4 w-4" />
                  Ver Certificado
                </Button>
              </div>
            ) : null;
          })()}
        </>
      )}
    </div>
  );
};

export default CourseOverviewPage;
