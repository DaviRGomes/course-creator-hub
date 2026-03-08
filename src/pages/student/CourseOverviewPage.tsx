import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueries } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, PlayCircle, FileQuestion, Circle } from "lucide-react";

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
    queryFn: () => api.get(`/courses/${courseId}`).then((r) => r.data.data ?? r.data),
  });

  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ["student-modules", courseId],
    queryFn: () => api.get(`/courses/${courseId}/modules`).then((r) => r.data.data ?? r.data),
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

  const isLoading = loadingCourse || loadingModules;

  return (
    <div>
      <button
        onClick={() => navigate("/catalog")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-fast mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Catálogo
      </button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{course?.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{course?.description}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary/30 shrink-0" />
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
                          className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-accent/50 transition-fast"
                          onClick={() => {
                            if (item.type === "VIDEO") {
                              navigate(`/learn/${courseId}/modules/${mod.id}/lesson/${item.id}`);
                            } else {
                              navigate(`/learn/${courseId}/modules/${mod.id}/quiz/${item.id}`);
                            }
                          }}
                        >
                          <Circle className="h-4 w-4 text-border shrink-0" />
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
