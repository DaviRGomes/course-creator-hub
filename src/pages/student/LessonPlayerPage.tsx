import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, CheckCircle2, PlayCircle, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import MuxPlayer from "@mux/mux-player-react";

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const LessonPlayerPage = () => {
  const { slug, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [completed, setCompleted] = useState(false);
  const autoMarked = useRef(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    autoMarked.current = false;
    setCompleted(false);
  }, [lessonId]);

  const { data: course } = useQuery({
    queryKey: ["course-by-slug", slug],
    queryFn: () => api.get(`/courses/slug/${slug}`).then((r) => r.data.data ?? r.data),
    enabled: !!slug,
  });

  const courseId = course?.id;

  const { data: moduleData } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: () => api.get(`/courses/${courseId}/modules/${moduleId}`).then((r) => r.data.data ?? r.data),
    enabled: !!courseId,
  });

  const { data: videos = [], isLoading: loadingVideos, refetch: refetchVideos } = useQuery<any[]>({
    queryKey: ["videos", moduleId],
    queryFn: () => api.get(`/courses/${courseId}/modules/${moduleId}/videos`).then((r) => r.data.data ?? r.data),
    enabled: !!courseId,
  });

  const { data: sequence = [] } = useQuery<any[]>({
    queryKey: ["module-sequence", courseId, Number(moduleId)],
    queryFn: () => api.get(`/courses/${courseId}/modules/${moduleId}/sequence`).then((r) => r.data.data ?? r.data),
    enabled: !!courseId,
  });

  const completedIds = new Set(
    sequence.filter((s: any) => s.status === "COMPLETED").map((s: any) => String(s.id))
  );

  const currentIndex = videos.findIndex((v) => String(v.id) === lessonId);
  const currentVideo = videos[currentIndex] ?? null;
  const prevVideo = currentIndex > 0 ? videos[currentIndex - 1] : null;
  const nextVideo = currentIndex < videos.length - 1 ? videos[currentIndex + 1] : null;

  const isLocked = (index: number): boolean => {
    if (index === 0) return false;
    const prev = videos[index - 1];
    return !completedIds.has(String(prev?.id));
  };

  const watchMut = useMutation({
    mutationFn: () =>
      api.post(`/courses/${courseId}/modules/${moduleId}/videos/${lessonId}/watch`).then(() => {}),
    onSuccess: () => {
      setCompleted(true);
      toast.success("Aula marcada como concluída! Continue assistindo.");
      queryClient.invalidateQueries({ queryKey: ["module-sequence", courseId, Number(moduleId)] });
      queryClient.invalidateQueries({ queryKey: ["student-enrolled-courses"] });
      queryClient.invalidateQueries({ queryKey: ["module", moduleId] });
      queryClient.invalidateQueries({ queryKey: ["course-overview", slug] });
      queryClient.invalidateQueries({ queryKey: ["student-modules", courseId] });
      refetchVideos();
    },
    onError: () => {
      setCompleted(true);
      toast.success("Aula marcada como concluída!");
    },
  });

  const handleMarkWatched = () => {
    if (completed || autoMarked.current || watchMut.isPending) return;
    autoMarked.current = true;
    watchMut.mutate();
  };

  const handleTimeUpdate = () => {
    const player = playerRef.current;
    if (!player || !player.duration) return;
    const pct = (player.currentTime / player.duration) * 100;
    if (pct >= 70 && !autoMarked.current && !completed) {
      handleMarkWatched();
    }
  };

  if (loadingVideos || !courseId) {
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
        <Button className="mt-4" onClick={() => navigate(`/learn/${slug}`)}>Voltar ao curso</Button>
      </div>
    );
  }

  const isDone = completedIds.has(String(currentVideo.id)) || completed;

  return (
    <div>
      <button
        onClick={() => navigate(`/learn/${slug}`)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-fast mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> {course?.title} — {moduleData?.title}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {currentVideo.muxPlaybackId && currentVideo.muxStatus === "ready" ? (
            <MuxPlayer
              ref={playerRef}
              playbackId={currentVideo.muxPlaybackId}
              streamType="on-demand"
              className="w-full rounded-xl overflow-hidden"
              style={{ aspectRatio: "16/9" }}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                handleMarkWatched();
                const idx = videos.findIndex((v) => String(v.id) === lessonId);
                const next = videos[idx + 1];
                if (next) {
                  setTimeout(() => {
                    navigate(`/learn/${slug}/modules/${moduleId}/lesson/${next.id}`);
                  }, 2000);
                } else {
                  setTimeout(() => toast.success("🎉 Parabéns! Você concluiu todas as aulas deste módulo!"), 500);
                }
              }}
              accentColor="#6366f1"
            />
          ) : currentVideo.muxStatus === "preparing" ? (
            <div className="w-full aspect-video rounded-xl bg-foreground/5 border border-border flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-10 w-10 text-primary/40 mx-auto mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">⏳ Vídeo sendo processado...</p>
              </div>
            </div>
          ) : (
            <div className="bg-foreground/5 rounded-xl aspect-video flex items-center justify-center border border-border">
              <div className="text-center">
                <PlayCircle className="h-16 w-16 text-primary/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Vídeo não disponível</p>
                <p className="text-xs text-muted-foreground mt-1">Aguarde o upload do vídeo</p>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{currentVideo.title}</h1>
              {currentVideo.duration > 0 && (
                <p className="text-sm text-muted-foreground">Duração: {formatDuration(currentVideo.duration)}</p>
              )}
            </div>
            <Button
              variant={isDone ? "default" : "outline"}
              onClick={handleMarkWatched}
              disabled={isDone || watchMut.isPending}
              className={isDone ? "bg-success hover:bg-success" : ""}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isDone ? "Concluída" : "Marcar como concluída"}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            {prevVideo ? (
              <Button variant="ghost" onClick={() => navigate(`/learn/${slug}/modules/${moduleId}/lesson/${prevVideo.id}`)}>
                <ArrowLeft className="h-4 w-4" /> {prevVideo.title}
              </Button>
            ) : <div />}
            {nextVideo ? (
              <Button
                variant="ghost"
                onClick={() => {
                  if (!isDone) {
                    toast.error("Conclua esta aula para desbloquear a próxima.");
                    return;
                  }
                  navigate(`/learn/${slug}/modules/${moduleId}/lesson/${nextVideo.id}`);
                }}
              >
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
            {videos.map((v, i) => {
              const locked = isLocked(i);
              const isCurrent = String(v.id) === lessonId;
              const done = completedIds.has(String(v.id)) || (isCurrent && completed);

              return (
                <button
                  key={v.id}
                  onClick={() => {
                    if (locked) {
                      toast.error("Conclua a aula anterior para desbloquear esta.");
                      return;
                    }
                    navigate(`/learn/${slug}/modules/${moduleId}/lesson/${v.id}`);
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
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm truncate",
                      isCurrent ? "text-primary font-medium" : locked ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {v.title}
                    </p>
                    {v.duration > 0 && (
                      <p className="text-xs text-muted-foreground">{formatDuration(v.duration)}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayerPage;
