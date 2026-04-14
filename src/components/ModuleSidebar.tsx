import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Lock, PlayCircle, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

interface ModuleSidebarProps {
  courseId: string | number;
  moduleId: string;
  slug: string;
  currentId?: string;
  currentType?: "VIDEO" | "ACTIVITY";
  completed?: boolean;
}

const ModuleSidebar = ({ courseId, moduleId, slug, currentId, currentType = "VIDEO", completed }: ModuleSidebarProps) => {
  const navigate = useNavigate();

  const { data: sequence = [] } = useQuery<any[]>({
    queryKey: ["module-sequence", courseId, Number(moduleId)],
    queryFn: () => api.get(`/courses/${courseId}/modules/${moduleId}/sequence`).then((r) => r.data.data ?? r.data),
    enabled: !!courseId,
  });

  const { data: materials = [] } = useQuery<any[]>({
    queryKey: ["materials", String(moduleId)],
    queryFn: () => api.get(`/courses/${courseId}/modules/${moduleId}/materials`).then((r) => r.data.data ?? r.data).catch(() => []),
    enabled: !!courseId,
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Conteúdo do módulo</h3>
      </div>
      <div className="divide-y divide-border">
        {sequence.map((item: any) => {
          const isCurrent = item.type === currentType && String(item.id) === currentId;
          const done = item.status === "COMPLETED" || (isCurrent && completed);
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
                  navigate(`/learn/${slug}/modules/${moduleId}/lesson/${item.id}`);
                } else {
                  navigate(`/learn/${slug}/modules/${moduleId}/quiz/${item.id}`);
                }
              }}
              className={cn(
                "w-full text-left px-4 py-3 flex items-center gap-3 transition-fast",
                isCurrent && "bg-primary/5 border-l-2 border-l-primary",
                locked ? "opacity-40 cursor-not-allowed" : "hover:bg-accent/50"
              )}
            >
              <div className="flex-shrink-0 w-5 text-center">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : locked ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Circle className="h-4 w-4 text-border" />
                )}
              </div>
              <div className="flex-shrink-0">
                {item.type === "VIDEO" ? (
                  <PlayCircle className="h-4 w-4 text-primary" />
                ) : (
                  <FileQuestion className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm truncate",
                  isCurrent ? "text-primary font-medium" : locked ? "text-muted-foreground" : "text-foreground"
                )}>
                  {item.title}
                </p>
              </div>
              {item.type === "VIDEO" && item.duration > 0 && (
                <span className="text-xs text-muted-foreground flex-shrink-0">{formatDuration(item.duration)}</span>
              )}
            </button>
          );
        })}
      </div>

      {materials.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            📁 Materiais de Apoio
          </p>
          <div className="flex flex-wrap gap-2">
            {materials.map((m: any) => {
              const icon =
                m.type === "PDF" ? "📄" :
                m.type === "WORD" ? "📝" :
                m.type === "TXT" ? "📃" :
                m.type === "SLIDE" ? "📊" :
                m.type === "IMAGE" ? "🖼️" :
                m.type === "LINK" ? "🔗" :
                m.type === "VIDEO_EXTRA" ? "🎬" : "📎";

              const handleClick = () => {
                if (m.url) {
                  window.open(m.url, "_blank", "noopener,noreferrer");
                } else {
                  const base = (api.defaults.baseURL || "/api").replace(/\/$/, "");
                  window.open(
                    `${base}/courses/${courseId}/modules/${moduleId}/materials/${m.id}/download`,
                    "_blank",
                    "noopener,noreferrer"
                  );
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
      )}
    </div>
  );
};

export default ModuleSidebar;
