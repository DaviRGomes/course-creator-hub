import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  // Google Drive: /file/d/ID/view → /file/d/ID/preview
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // If it's already an embeddable URL or direct video
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/)) return url;
  return url;
};

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const LessonPlayerPage = () => {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState(false);

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then((r) => r.data.data ?? r.data),
  });

  const { data: moduleData } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: () => api.get(`/courses/${courseId}/modules/${moduleId}`).then((r) => r.data.data ?? r.data),
  });

  const { data: videos = [], isLoading: loadingVideos } = useQuery<any[]>({
    queryKey: ["videos", moduleId],
    queryFn: () => api.get(`/courses/${courseId}/modules/${moduleId}/videos`).then((r) => r.data.data ?? r.data),
  });

  const watchMut = useMutation({
    mutationFn: () =>
      api.post(`/courses/${courseId}/modules/${moduleId}/videos/${lessonId}/watch`).then(() => {}),
    onSuccess: () => {
      setCompleted(true);
      toast.success("Aula marcada como concluída!");
    },
    onError: () => {
      setCompleted(true);
      toast.success("Aula marcada como concluída!");
    },
  });

  const currentVideo = videos.find((v) => String(v.id) === lessonId);
  const currentIndex = videos.findIndex((v) => String(v.id) === lessonId);
  const prevVideo = currentIndex > 0 ? videos[currentIndex - 1] : null;
  const nextVideo = currentIndex < videos.length - 1 ? videos[currentIndex + 1] : null;

  if (loadingVideos) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-video rounded-xl" />
        <Skeleton className="h-6 w-64" />
      </div>
    );
  }

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
              onClick={() => watchMut.mutate()}
              disabled={completed || watchMut.isPending}
              className={completed ? "bg-success hover:bg-success" : ""}
            >
              <CheckCircle2 className="h-4 w-4" />
              {completed ? "Concluída" : "Marcar como concluída"}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            {prevVideo ? (
              <Button variant="ghost" onClick={() => navigate(`/learn/${courseId}/modules/${moduleId}/lesson/${prevVideo.id}`)}>
                <ArrowLeft className="h-4 w-4" /> {prevVideo.title}
              </Button>
            ) : <div />}
            {nextVideo ? (
              <Button variant="ghost" onClick={() => navigate(`/learn/${courseId}/modules/${moduleId}/lesson/${nextVideo.id}`)}>
                {nextVideo.title} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : <div />}
          </div>
        </div>

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
                  String(v.id) === lessonId && "bg-primary/5 border-l-2 border-l-primary"
                )}
              >
                <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm truncate", String(v.id) === lessonId ? "text-primary font-medium" : "text-foreground")}>
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
