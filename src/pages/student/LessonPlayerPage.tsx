import { useParams, useNavigate } from "react-router-dom";
import { DEMO_MODE } from "@/lib/config";
import { mockVideos, mockModules, mockCourses } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const LessonPlayerPage = () => {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState(false);

  const course = DEMO_MODE ? mockCourses.find((c) => c.id === courseId) : null;
  const moduleData = DEMO_MODE ? (mockModules[courseId!] || []).find((m) => m.id === moduleId) : null;
  const videos = DEMO_MODE ? (mockVideos[moduleId!] || []) : [];
  const currentVideo = videos.find((v) => v.id === lessonId);
  const currentIndex = videos.findIndex((v) => v.id === lessonId);
  const prevVideo = currentIndex > 0 ? videos[currentIndex - 1] : null;
  const nextVideo = currentIndex < videos.length - 1 ? videos[currentIndex + 1] : null;

  const handleMarkComplete = () => {
    setCompleted(true);
    toast.success("Aula marcada como concluída!");
  };

  if (!currentVideo) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Aula não encontrada.</p>
        <Button className="mt-4" onClick={() => navigate(`/learn/${courseId}`)}>Voltar ao curso</Button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate(`/learn/${courseId}`)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-fast mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> {course?.title} — {moduleData?.title}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video player area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-foreground/5 rounded-xl aspect-video flex items-center justify-center border border-border">
            <div className="text-center">
              <PlayCircle className="h-16 w-16 text-primary/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Player de vídeo</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{currentVideo.url}</p>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{currentVideo.title}</h1>
              <p className="text-sm text-muted-foreground">Duração: {formatDuration(currentVideo.duration)}</p>
            </div>
            <Button
              variant={completed ? "default" : "outline"}
              onClick={handleMarkComplete}
              disabled={completed}
              className={completed ? "bg-success hover:bg-success" : ""}
            >
              <CheckCircle2 className="h-4 w-4" />
              {completed ? "Concluída" : "Marcar como concluída"}
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {prevVideo ? (
              <Button
                variant="ghost"
                onClick={() => navigate(`/learn/${courseId}/modules/${moduleId}/lesson/${prevVideo.id}`)}
              >
                <ArrowLeft className="h-4 w-4" /> {prevVideo.title}
              </Button>
            ) : <div />}
            {nextVideo ? (
              <Button
                variant="ghost"
                onClick={() => navigate(`/learn/${courseId}/modules/${moduleId}/lesson/${nextVideo.id}`)}
              >
                {nextVideo.title} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : <div />}
          </div>
        </div>

        {/* Sidebar with lesson list */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Aulas do módulo</h3>
          </div>
          <div className="divide-y divide-border">
            {videos.map((v, i) => (
              <button
                key={v.id}
                onClick={() => navigate(`/learn/${courseId}/modules/${moduleId}/lesson/${v.id}`)}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-center gap-3 transition-fast hover:bg-accent/50",
                  v.id === lessonId && "bg-primary/5 border-l-2 border-l-primary"
                )}
              >
                <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm truncate", v.id === lessonId ? "text-primary font-medium" : "text-foreground")}>
                    {v.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDuration(v.duration)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayerPage;
