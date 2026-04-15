import { useQuery, useQueries } from "@tanstack/react-query";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Lock, PlayCircle, FileQuestion, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

interface CourseSidebarProps {
  courseId: string | number;
  slug: string;
  currentModuleId?: string;
  currentId?: string;
  currentType?: "VIDEO" | "ACTIVITY";
  completed?: boolean;
}

const CourseSidebar = ({ courseId, slug, currentModuleId, currentId, currentType = "VIDEO", completed }: CourseSidebarProps) => {
  const navigate = useNavigate();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const { data: modules = [] } = useQuery<any[]>({
    queryKey: ["student-modules", courseId],
    queryFn: () => api.get(`/courses/${courseId}/modules`).then((r) => r.data.data ?? r.data),
    enabled: !!courseId,
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

  // Auto-expand the current module
  useEffect(() => {
    if (currentModuleId) {
      setExpandedModules((prev) => new Set(prev).add(currentModuleId));
    }
  }, [currentModuleId]);

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(modId)) next.delete(modId);
      else next.add(modId);
      return next;
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden max-h-[calc(100vh-8rem)] overflow-y-auto">
      {modules.map((mod: any, idx: number) => {
        const seqData = sequenceQueries[idx];
        const sequence: any[] = (seqData?.data as any[]) ?? [];
        const loading = seqData?.isLoading ?? true;
        const isExpanded = expandedModules.has(String(mod.id));
        const isCurrent = String(mod.id) === currentModuleId;

        const total = sequence.length;
        const completedCount = sequence.filter((s: any) => s.status === "COMPLETED").length;
        // Account for the currently completed item if it's in this module
        const adjustedCompleted = (isCurrent && completed && currentId && !sequence.find((s: any) => String(s.id) === currentId && s.status === "COMPLETED"))
          ? completedCount + 1
          : completedCount;
        const pct = total > 0 ? Math.round((adjustedCompleted / total) * 100) : 0;

        return (
          <div key={mod.id} className={cn("border-b border-border last:border-b-0")}>
            {/* Module header */}
            <button
              onClick={() => toggleModule(String(mod.id))}
              className={cn(
                "w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-accent/50 transition-colors",
                isCurrent && "bg-accent/30"
              )}
            >
              {/* Progress circle */}
              <div className="relative flex-shrink-0 w-8 h-8">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" className="stroke-border" />
                  <circle
                    cx="18" cy="18" r="15" fill="none" strokeWidth="3"
                    className={pct === 100 ? "stroke-success" : "stroke-primary"}
                    strokeDasharray={`${pct * 0.9425} 94.25`}
                    strokeLinecap="round"
                  />
                </svg>
                {pct === 100 && (
                  <CheckCircle2 className="absolute inset-0 m-auto h-4 w-4 text-success" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isCurrent ? "text-primary" : "text-foreground"
                )}>
                  {idx + 1}. {mod.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {total} aulas
                </p>
              </div>

              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
                isExpanded && "rotate-180"
              )} />
            </button>

            {/* Expanded lessons */}
            {isExpanded && (
              <div className="border-t border-border">
                {loading ? (
                  <div className="px-4 py-2 text-xs text-muted-foreground">Carregando...</div>
                ) : sequence.length === 0 ? (
                  <div className="px-4 py-2 text-xs text-muted-foreground">Nenhum item.</div>
                ) : (
                  sequence.map((item: any) => {
                    const isCurrentItem = item.type === currentType && String(item.id) === currentId && String(mod.id) === currentModuleId;
                    const done = item.status === "COMPLETED" || (isCurrentItem && completed);
                    const locked = item.status === "LOCKED";

                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        disabled={locked}
                        onClick={() => {
                          if (locked) {
                            toast.error("Conclua o item anterior para desbloquear.");
                            return;
                          }
                          if (item.type === "VIDEO") {
                            navigate(`/learn/${slug}/modules/${mod.id}/lesson/${item.id}`);
                          } else {
                            navigate(`/learn/${slug}/modules/${mod.id}/quiz/${item.id}`);
                          }
                        }}
                        className={cn(
                          "w-full text-left pl-10 pr-4 py-2.5 flex items-center gap-2 transition-colors",
                          isCurrentItem && "bg-primary/10 border-l-2 border-l-primary",
                          locked ? "opacity-40 cursor-not-allowed" : "hover:bg-accent/50"
                        )}
                      >
                        <div className="flex-shrink-0 w-4">
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          ) : locked ? (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-border" />
                          )}
                        </div>
                        <span className={cn(
                          "text-sm flex-1 min-w-0 truncate",
                          isCurrentItem ? "text-primary font-medium" : locked ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {item.title}
                        </span>
                        {item.type === "VIDEO" && item.duration > 0 && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">{formatDuration(item.duration)}</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CourseSidebar;
