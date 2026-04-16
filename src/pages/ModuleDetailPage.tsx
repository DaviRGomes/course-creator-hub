import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableItem } from "@/components/SortableItem";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronLeft, Video, FileText, Loader2, ExternalLink, Upload, X, FolderOpen } from "lucide-react";

interface VideoItem { id: string; title: string; muxAssetId?: string; muxPlaybackId?: string; muxStatus?: string; duration: number; sequenceOrder: number; }
interface Option { optionText: string; isCorrect: boolean; orderIndex: number; }
interface Question { id?: string; questionText: string; questionType: string; orderIndex: number; points: number; options: Option[]; }
interface Activity { id: string; title: string; description: string; sequenceOrder: number; passingScore: number; questions?: Question[]; }
interface Material {
  id: string;
  title: string;
  url?: string;
  type: "PDF" | "WORD" | "TXT" | "SLIDE" | "IMAGE" | "LINK" | "VIDEO_EXTRA";
  description?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  hasFile?: boolean;
}

const FILE_UPLOAD_TYPES: Material["type"][] = ["PDF", "WORD", "TXT", "SLIDE"];
const isFileUpload = (type: string) => FILE_UPLOAD_TYPES.includes(type as Material["type"]);
const ALLOWED_EXTENSIONS = ".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

type SequenceItem = { type: "video"; data: VideoItem } | { type: "activity"; data: Activity };

const formatDuration = (s: number) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${sec.toString().padStart(2, "0")}`; };

const getMaterialIcon = (type: string) => {
  switch (type) {
    case "PDF":   return "📄";
    case "WORD":  return "📝";
    case "TXT":   return "📃";
    case "SLIDE": return "📊";
    case "IMAGE": return "🖼️";
    case "LINK":  return "🔗";
    case "VIDEO_EXTRA": return "🎬";
    default: return "📎";
  }
};

const getMaterialLabel = (type: string) => {
  switch (type) {
    case "PDF":   return "PDF";
    case "WORD":  return "Word";
    case "TXT":   return "TXT";
    case "SLIDE": return "Slides";
    case "IMAGE": return "Imagem";
    case "LINK":  return "Link";
    case "VIDEO_EXTRA": return "Vídeo Extra";
    default: return type;
  }
};

const ModuleDetailPage = () => {
  const { id: courseId, moduleId } = useParams<{ id: string; moduleId: string }>();
  const qc = useQueryClient();

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  const [videoForm, setVideoForm] = useState({ title: "", duration: 0, sequenceOrder: 0, muxAssetId: "" });
  const [actForm, setActForm] = useState({ title: "", description: "", sequenceOrder: 0, passingScore: 70 });
  const [qForm, setQForm] = useState<{ questionText: string; questionType: string; orderIndex: number; points: number; options: Option[]; correctAnswer: string }>({
    questionText: "", questionType: "MULTIPLE_CHOICE", orderIndex: 0, points: 10, options: [
      { optionText: "", isCorrect: false, orderIndex: 0 },
      { optionText: "", isCorrect: false, orderIndex: 1 },
    ], correctAnswer: "true",
  });
  const [activeActForQuestions, setActiveActForQuestions] = useState<Activity | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [localSequence, setLocalSequence] = useState<SequenceItem[]>([]);
  const [localMaterials, setLocalMaterials] = useState<Material[]>([]);
  const [localActivityMaterials, setLocalActivityMaterials] = useState<Material[]>([]);

  // Materials state — per video or per activity
  const [activeMaterialVideoId, setActiveMaterialVideoId] = useState<string | null>(null);
  const [activeMaterialActivityId, setActiveMaterialActivityId] = useState<string | null>(null);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialForm, setMaterialForm] = useState({ title: "", url: "", type: "PDF" as Material["type"], description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const base = `/courses/${courseId}/modules/${moduleId}`;

  const { data: moduleData } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: () => api.get(base).then((r) => r.data.data ?? r.data),
  });

  const { data: videos = [], isLoading: vLoading } = useQuery<VideoItem[]>({
    queryKey: ["videos", moduleId],
    queryFn: () => api.get(`${base}/videos`).then((r) => r.data.data ?? r.data),
  });

  const { data: activities = [], isLoading: aLoading } = useQuery<Activity[]>({
    queryKey: ["activities", moduleId],
    queryFn: () => api.get(`${base}/activities`).then((r) => r.data.data ?? r.data).catch(() => []),
  });

  const { data: materials = [], isLoading: mLoading } = useQuery<Material[]>({
    queryKey: ["materials", "video", activeMaterialVideoId],
    queryFn: () =>
      api.get(`${base}/videos/${activeMaterialVideoId}/materials`)
        .then((r) => r.data.data ?? r.data)
        .catch(() => []),
    enabled: !!activeMaterialVideoId,
  });

  const { data: activityMaterials = [], isLoading: amLoading } = useQuery<Material[]>({
    queryKey: ["materials", "activity", activeMaterialActivityId],
    queryFn: () =>
      api.get(`${base}/activities/${activeMaterialActivityId}/materials`)
        .then((r) => r.data.data ?? r.data)
        .catch(() => []),
    enabled: !!activeMaterialActivityId,
  });

  useEffect(() => {
    setLocalSequence([...videos.map((v) => ({ type: "video" as const, data: v })), ...activities.map((a) => ({ type: "activity" as const, data: a }))].sort((a, b) => a.data.sequenceOrder - b.data.sequenceOrder));
  }, [videos, activities]);
  useEffect(() => { setLocalMaterials(materials); }, [materials]);
  useEffect(() => { setLocalActivityMaterials(activityMaterials); }, [activityMaterials]);

  const sequence: SequenceItem[] = [
    ...videos.map((v) => ({ type: "video" as const, data: v })),
    ...activities.map((a) => ({ type: "activity" as const, data: a })),
  ].sort((a, b) => a.data.sequenceOrder - b.data.sequenceOrder);

  const activeMaterialVideo = activeMaterialVideoId
    ? videos.find((v) => v.id === activeMaterialVideoId) ?? null
    : null;

  const activeMaterialActivity = activeMaterialActivityId
    ? activities.find((a) => a.id === activeMaterialActivityId) ?? null
    : null;

  const saveVideoMut = useMutation({
    mutationFn: () =>
      editingVideo
        ? api.put(`${base}/videos/${editingVideo.id}`, videoForm).then(() => {})
        : api.post(`${base}/videos`, videoForm).then(() => {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["videos", moduleId] }); setVideoModalOpen(false); setEditingVideo(null); toast.success("Aula salva"); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro"),
  });

  const saveActMut = useMutation({
    mutationFn: () =>
      editingActivity
        ? api.put(`${base}/activities/${editingActivity.id}`, actForm).then(() => {})
        : api.post(`${base}/activities`, actForm).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities", moduleId] });
      setActivityModalOpen(false);
      setEditingActivity(null);
      toast.success("Atividade salva");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro"),
  });

  const deleteMut = useMutation({
    mutationFn: (t: { type: string; id: string }) => {
      if (t.type === "video") return api.delete(`${base}/videos/${t.id}`).then(() => {});
      if (t.type === "material") return api.delete(`${base}/videos/${activeMaterialVideoId}/materials/${t.id}`).then(() => {});
      if (t.type === "activity-material") return api.delete(`${base}/activities/${activeMaterialActivityId}/materials/${t.id}`).then(() => {});
      return api.delete(`${base}/activities/${t.id}`).then(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos", moduleId] });
      qc.invalidateQueries({ queryKey: ["activities", moduleId] });
      qc.invalidateQueries({ queryKey: ["materials", "video", activeMaterialVideoId] });
      qc.invalidateQueries({ queryKey: ["materials", "activity", activeMaterialActivityId] });
      setDeleteTarget(null);
      toast.success("Item removido");
    },
  });

  const saveQuestionMut = useMutation({
    mutationFn: () => {
      const payload: any = { questionText: qForm.questionText, questionType: qForm.questionType, orderIndex: qForm.orderIndex, points: qForm.points };
      if (qForm.questionType === "MULTIPLE_CHOICE") payload.options = qForm.options;
      else if (qForm.questionType === "TRUE_FALSE") {
        payload.options = [
          { optionText: "Verdadeiro", isCorrect: qForm.correctAnswer === "true", orderIndex: 0 },
          { optionText: "Falso", isCorrect: qForm.correctAnswer === "false", orderIndex: 1 },
        ];
      }
      return api.post(`${base}/activities/${activeActForQuestions!.id}/questions`, payload).then(() => {});
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["activities", moduleId] }); setQuestionModalOpen(false); toast.success("Questão adicionada"); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro"),
  });

  const saveMaterialMut = useMutation({
    mutationFn: () => {
      const matBase = `${base}/videos/${activeMaterialVideoId}/materials`;
      if (editingMaterial?.hasFile) {
        return api.put(`${matBase}/${editingMaterial.id}`, { title: materialForm.title, type: materialForm.type }).then(() => {});
      }
      return editingMaterial
        ? api.put(`${matBase}/${editingMaterial.id}`, materialForm).then(() => {})
        : api.post(matBase, materialForm).then(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials", "video", activeMaterialVideoId] });
      setMaterialModalOpen(false);
      setEditingMaterial(null);
      toast.success("Material salvo");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao salvar material"),
  });

  const uploadMaterialMut = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error("Selecione um arquivo.");
      const fd = new FormData();
      fd.append("title", materialForm.title);
      fd.append("type", materialForm.type);
      fd.append("file", selectedFile);
      return api.post(`${base}/videos/${activeMaterialVideoId}/materials/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials", "video", activeMaterialVideoId] });
      setMaterialModalOpen(false);
      setEditingMaterial(null);
      setSelectedFile(null);
      toast.success("Arquivo enviado com sucesso");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao enviar arquivo"),
  });

  const reorderSequenceMut = useMutation({
    mutationFn: (items: { type: string; id: string }[]) =>
      api.patch(`${base}/sequence/reorder`, { items: items.map((i) => ({ type: i.type === "video" ? "VIDEO" : "ACTIVITY", id: Number(i.id) })) }),
    onError: () => { setLocalSequence(sequence); toast.error("Erro ao reordenar"); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["videos", moduleId] }); qc.invalidateQueries({ queryKey: ["activities", moduleId] }); },
  });

  const reorderMaterialsMut = useMutation({
    mutationFn: (ids: string[]) =>
      api.patch(`${base}/videos/${activeMaterialVideoId}/materials/reorder`, { ids: ids.map(Number) }),
    onError: () => { setLocalMaterials(materials); toast.error("Erro ao reordenar"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materials", "video", activeMaterialVideoId] }),
  });

  const reorderActivityMaterialsMut = useMutation({
    mutationFn: (ids: string[]) =>
      api.patch(`${base}/activities/${activeMaterialActivityId}/materials/reorder`, { ids: ids.map(Number) }),
    onError: () => { setLocalActivityMaterials(activityMaterials); toast.error("Erro ao reordenar"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materials", "activity", activeMaterialActivityId] }),
  });

  const uploadActivityMaterialMut = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error("Selecione um arquivo.");
      const fd = new FormData();
      fd.append("title", materialForm.title);
      fd.append("type", materialForm.type);
      fd.append("file", selectedFile);
      return api.post(`${base}/activities/${activeMaterialActivityId}/materials/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials", "activity", activeMaterialActivityId] });
      setMaterialModalOpen(false);
      setEditingMaterial(null);
      setSelectedFile(null);
      toast.success("Arquivo enviado com sucesso");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao enviar arquivo"),
  });

  const reorderQuestionsMut = useMutation({
    mutationFn: ({ actId, ids }: { actId: string; ids: string[] }) =>
      api.patch(`${base}/activities/${actId}/questions/reorder`, { ids: ids.map(Number) }),
    onError: () => toast.error("Erro ao reordenar questões"),
  });

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo excede o limite de 50 MB.");
      return;
    }
    setSelectedFile(file);
  };

  const openCreateVideo = () => { setEditingVideo(null); setVideoForm({ title: "", duration: 0, sequenceOrder: sequence.length, muxAssetId: "" }); setVideoModalOpen(true); };
  const openEditVideo = (v: VideoItem) => { setEditingVideo(v); setVideoForm({ title: v.title, duration: v.duration, sequenceOrder: v.sequenceOrder, muxAssetId: v.muxAssetId || "" }); setVideoModalOpen(true); };
  const openCreateActivity = () => { setEditingActivity(null); setActForm({ title: "", description: "", sequenceOrder: sequence.length, passingScore: 70 }); setActivityModalOpen(true); };
  const openEditActivity = (a: Activity) => { setEditingActivity(a); setActForm({ title: a.title, description: a.description, sequenceOrder: a.sequenceOrder, passingScore: a.passingScore }); setActivityModalOpen(true); };

  const openMaterialsPanel = (videoId: string) => {
    setActiveMaterialVideoId(videoId);
    setActiveMaterialActivityId(null);
    setActiveActForQuestions(null);
  };

  const openActivityMaterialsPanel = (activityId: string) => {
    setActiveMaterialActivityId(activityId);
    setActiveMaterialVideoId(null);
    setActiveActForQuestions(null);
  };

  const openCreateMaterial = () => {
    setEditingMaterial(null);
    setSelectedFile(null);
    setMaterialForm({ title: "", url: "", type: "PDF", description: "" });
    setMaterialModalOpen(true);
  };
  const openEditMaterial = (m: Material) => {
    setEditingMaterial(m);
    setSelectedFile(null);
    setMaterialForm({ title: m.title, url: m.url || "", type: m.type, description: m.description || "" });
    setMaterialModalOpen(true);
  };

  const isLoading = vLoading || aLoading;
  const anyMaterialPanelOpen = !!activeMaterialVideoId || !!activeMaterialActivityId;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
        <Link to={`/admin/courses/${courseId}`} className="hover:text-foreground transition-fast flex items-center gap-1"><ChevronLeft className="h-4 w-4" /> Módulos</Link>
        <span>/</span>
        <span className="text-foreground">{moduleData?.title || "..."}</span>
      </div>

      <div className="flex items-center justify-between mb-6 mt-4">
        <h1 className="text-xl font-semibold text-foreground">{moduleData?.title || "Carregando..."}</h1>
        <div className="flex gap-2">
          {!anyMaterialPanelOpen && (
            <>
              <Button onClick={openCreateVideo}><Plus className="h-4 w-4" /> Aula</Button>
              <Button variant="outline" onClick={openCreateActivity}><Plus className="h-4 w-4" /> Atividade</Button>
            </>
          )}
          {anyMaterialPanelOpen && (
            <Button onClick={openCreateMaterial}><Plus className="h-4 w-4" /> Material</Button>
          )}
        </div>
      </div>

      {/* Sequência de Aulas */}
      {!anyMaterialPanelOpen && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">📋 Sequência de Aulas</h2>
            <Link
              to={`/admin/courses/${courseId}/modules/${moduleId}/activities`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Gerenciar Atividades
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : localSequence.length === 0 ? (
            <EmptyState icon={Video} message="Nenhuma aula ou atividade encontrada." actionLabel="Criar Primeira Aula" onAction={openCreateVideo} />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
              if (!over || active.id === over.id) return;
              const oldIdx = localSequence.findIndex((i) => `${i.type}-${i.data.id}` === active.id);
              const newIdx = localSequence.findIndex((i) => `${i.type}-${i.data.id}` === over.id);
              const reordered = arrayMove(localSequence, oldIdx, newIdx);
              setLocalSequence(reordered);
              reorderSequenceMut.mutate(reordered.map((i) => ({ type: i.type, id: i.data.id })));
            }}>
              <SortableContext items={localSequence.map((i) => `${i.type}-${i.data.id}`)} strategy={verticalListSortingStrategy}>
                <div className="bg-card rounded-lg border border-border overflow-hidden divide-y divide-border">
                  {localSequence.map((item, idx) => (
                    <SortableItem key={`${item.type}-${item.data.id}`} id={`${item.type}-${item.data.id}`}>
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                        {item.type === "video" ? (
                          <Badge variant="secondary" className="gap-1 shrink-0"><Video className="h-3 w-3" /> Aula</Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 shrink-0"><FileText className="h-3 w-3" /> Atividade</Badge>
                        )}
                        <span className="flex-1 font-medium text-sm truncate">{item.data.title}</span>
                        <span className="text-xs text-muted-foreground hidden sm:block shrink-0">
                          {item.type === "video" ? (
                            <span className="flex items-center gap-1">
                              {formatDuration((item.data as VideoItem).duration)}
                              {(item.data as VideoItem).muxStatus === "ready" && <Badge variant="secondary" className="text-xs">Mux ✓</Badge>}
                            </span>
                          ) : `Nota: ${(item.data as Activity).passingScore}%`}
                        </span>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => item.type === "video" ? openEditVideo(item.data as VideoItem) : openEditActivity(item.data as Activity)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: item.type, id: item.data.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          {item.type === "video" && (
                            <Button variant="ghost" size="icon" title="Materiais" onClick={() => openMaterialsPanel(item.data.id)}>
                              <FolderOpen className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          {item.type === "activity" && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setActiveActForQuestions(item.data as Activity)} className="text-xs">Questões</Button>
                              <Button variant="ghost" size="icon" title="Materiais da Atividade" onClick={() => openActivityMaterialsPanel(item.data.id)}>
                                <FolderOpen className="h-4 w-4 text-primary" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {activeActForQuestions && (
            <div className="mt-6 bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Questões — {activeActForQuestions.title}</h2>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { setQForm({ questionText: "", questionType: "MULTIPLE_CHOICE", orderIndex: 0, points: 10, options: [{ optionText: "", isCorrect: false, orderIndex: 0 }, { optionText: "", isCorrect: false, orderIndex: 1 }], correctAnswer: "true" }); setQuestionModalOpen(true); }}>
                    <Plus className="h-4 w-4" /> Questão
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setActiveActForQuestions(null)}>Fechar</Button>
                </div>
              </div>

              {(activeActForQuestions.questions?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma questão adicionada ainda.</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
                  if (!over || active.id === over.id || !activeActForQuestions.questions) return;
                  const qs = [...activeActForQuestions.questions];
                  const oldIdx = qs.findIndex((q) => String(q.id) === active.id);
                  const newIdx = qs.findIndex((q) => String(q.id) === over.id);
                  const reordered = arrayMove(qs, oldIdx, newIdx);
                  setActiveActForQuestions({ ...activeActForQuestions, questions: reordered });
                  reorderQuestionsMut.mutate({ actId: activeActForQuestions.id, ids: reordered.map((q) => String(q.id!)) });
                }}>
                <SortableContext items={(activeActForQuestions.questions ?? []).map((q) => String(q.id))} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {activeActForQuestions.questions?.map((q, qi) => (
                    <SortableItem key={q.id || qi} id={String(q.id)} className="border border-border rounded-md">
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs text-muted-foreground">Questão {qi + 1} — {q.questionType === "MULTIPLE_CHOICE" ? "Múltipla Escolha" : q.questionType === "TRUE_FALSE" ? "V ou F" : q.questionType} ({q.points}pts)</span>
                          <p className="text-sm font-medium text-foreground mt-1">"{q.questionText}"</p>
                        </div>
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {q.options.map((o, oi) => (
                            <span key={oi} className={`text-xs px-2 py-1 rounded ${o.isCorrect ? "bg-success/10 text-success font-medium border border-success/30" : "bg-secondary text-secondary-foreground"}`}>
                              {o.optionText}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    </SortableItem>
                  ))}
                </div>
                </SortableContext>
                </DndContext>
              )}
            </div>
          )}
        </>
      )}

      {/* Painel de Materiais por Aula */}
      {activeMaterialVideoId && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => setActiveMaterialVideoId(null)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">
              📁 Materiais — {activeMaterialVideo?.title ?? "Aula"}
            </span>
          </div>

          {mLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-lg">
              <p className="text-4xl mb-3">📁</p>
              <p className="font-medium">Nenhum material cadastrado</p>
              <p className="text-sm mt-1">PDFs, imagens e links de apoio aparecem aqui</p>
              <Button className="mt-4" onClick={openCreateMaterial}>
                <Plus className="h-4 w-4" /> Adicionar Material
              </Button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
              if (!over || active.id === over.id) return;
              const oldIdx = localMaterials.findIndex((m) => m.id === active.id);
              const newIdx = localMaterials.findIndex((m) => m.id === over.id);
              const reordered = arrayMove(localMaterials, oldIdx, newIdx);
              setLocalMaterials(reordered);
              reorderMaterialsMut.mutate(reordered.map((m) => m.id));
            }}>
              <SortableContext items={localMaterials.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
              {localMaterials.map((m) => (
                <SortableItem key={m.id} id={m.id} className="bg-card border border-border rounded-lg">
                <div
                  className="flex items-center gap-3 pr-3 py-2"
                >
                  <span className="text-2xl">{getMaterialIcon(m.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-foreground text-sm truncate">{m.title}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {getMaterialLabel(m.type)}
                      </Badge>
                    </div>
                    {m.hasFile ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {m.fileName} {m.fileSize && `· ${formatBytes(m.fileSize)}`}
                      </p>
                    ) : (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate block"
                      >
                        {m.url}
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEditMaterial(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget({ type: "material", id: m.id })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                </SortableItem>
              ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* Painel de Materiais por Atividade */}
      {activeMaterialActivityId && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => setActiveMaterialActivityId(null)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">
              📁 Materiais — {activeMaterialActivity?.title ?? "Atividade"}
            </span>
          </div>

          {amLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : localActivityMaterials.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-lg">
              <p className="text-4xl mb-3">📁</p>
              <p className="font-medium">Nenhum material cadastrado</p>
              <p className="text-sm mt-1">PDFs e documentos de apoio aparecem aqui</p>
              <Button className="mt-4" onClick={openCreateMaterial}>
                <Plus className="h-4 w-4" /> Adicionar Material
              </Button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
              if (!over || active.id === over.id) return;
              const oldIdx = localActivityMaterials.findIndex((m) => m.id === active.id);
              const newIdx = localActivityMaterials.findIndex((m) => m.id === over.id);
              const reordered = arrayMove(localActivityMaterials, oldIdx, newIdx);
              setLocalActivityMaterials(reordered);
              reorderActivityMaterialsMut.mutate(reordered.map((m) => m.id));
            }}>
              <SortableContext items={localActivityMaterials.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {localActivityMaterials.map((m) => (
                    <SortableItem key={m.id} id={m.id} className="bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-3 pr-3 py-2">
                        <span className="text-2xl">{getMaterialIcon(m.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-foreground text-sm truncate">{m.title}</p>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {getMaterialLabel(m.type)}
                            </Badge>
                          </div>
                          {m.hasFile ? (
                            <p className="text-xs text-muted-foreground truncate">
                              {m.fileName} {m.fileSize && `· ${formatBytes(m.fileSize)}`}
                            </p>
                          ) : (
                            <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">
                              {m.url}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => openEditMaterial(m)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget({ type: "activity-material", id: m.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={videoModalOpen} onOpenChange={(o) => { setVideoModalOpen(o); if (!o) setEditingVideo(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingVideo ? "Editar Aula" : "Nova Aula"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveVideoMut.mutate(); }} className="space-y-4">
            <div className="space-y-2"><Label>Título</Label><Input value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} required /></div>

            <div className="space-y-2">
              <Label>Mux Asset ID</Label>
              <Input
                value={videoForm.muxAssetId}
                onChange={(e) => setVideoForm({ ...videoForm, muxAssetId: e.target.value })}
                placeholder="Ex: dHg700wI8O3JlT3SyJxWS5aqTi2f3z00NII00uf8glPJrM"
              />
              <p className="text-xs text-muted-foreground">O vídeo será buscado automaticamente no Mux.</p>
            </div>

            <div className="space-y-2"><Label>Posição (seq)</Label><Input type="number" value={videoForm.sequenceOrder} onChange={(e) => setVideoForm({ ...videoForm, sequenceOrder: Number(e.target.value) })} /></div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setVideoModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveVideoMut.isPending}>{saveVideoMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={activityModalOpen} onOpenChange={(o) => { setActivityModalOpen(o); if (!o) setEditingActivity(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingActivity ? "Editar Atividade" : "Nova Atividade"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveActMut.mutate(); }} className="space-y-4">
            <div className="space-y-2"><Label>Título</Label><Input value={actForm.title} onChange={(e) => setActForm({ ...actForm, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={actForm.description} onChange={(e) => setActForm({ ...actForm, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Posição (seq)</Label><Input type="number" value={actForm.sequenceOrder} onChange={(e) => setActForm({ ...actForm, sequenceOrder: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Nota mínima %</Label><Input type="number" value={actForm.passingScore} onChange={(e) => setActForm({ ...actForm, passingScore: Number(e.target.value) })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setActivityModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveActMut.isPending}>{saveActMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={questionModalOpen} onOpenChange={setQuestionModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Questão</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveQuestionMut.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={qForm.questionType} onValueChange={(v) => setQForm({ ...qForm, questionType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">Múltipla Escolha</SelectItem>
                  <SelectItem value="TRUE_FALSE">Verdadeiro ou Falso</SelectItem>
                  <SelectItem value="ESSAY">Dissertativa</SelectItem>
                  <SelectItem value="FILE_UPLOAD">Upload de Arquivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Pergunta</Label><Textarea value={qForm.questionText} onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })} required rows={2} /></div>
            <div className="space-y-2"><Label>Pontos</Label><Input type="number" value={qForm.points} onChange={(e) => setQForm({ ...qForm, points: Number(e.target.value) })} /></div>

            {qForm.questionType === "MULTIPLE_CHOICE" && (
              <div className="space-y-3">
                <Label>Alternativas</Label>
                {qForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium w-5">{String.fromCharCode(65 + i)}</span>
                    <Input className="flex-1" value={opt.optionText} onChange={(e) => { const opts = [...qForm.options]; opts[i] = { ...opts[i], optionText: e.target.value }; setQForm({ ...qForm, options: opts }); }} placeholder="Texto da alternativa" />
                    <div className="flex items-center gap-1">
                      <Checkbox checked={opt.isCorrect} onCheckedChange={(v) => { const opts = [...qForm.options]; opts[i] = { ...opts[i], isCorrect: !!v }; setQForm({ ...qForm, options: opts }); }} />
                      <span className="text-xs text-muted-foreground">Correta</span>
                    </div>
                    {qForm.options.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => setQForm({ ...qForm, options: qForm.options.filter((_, j) => j !== i) })}><Trash2 className="h-3 w-3" /></Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setQForm({ ...qForm, options: [...qForm.options, { optionText: "", isCorrect: false, orderIndex: qForm.options.length }] })}>
                  <Plus className="h-3 w-3" /> Adicionar alternativa
                </Button>
              </div>
            )}

            {qForm.questionType === "TRUE_FALSE" && (
              <div className="space-y-2">
                <Label>Resposta correta</Label>
                <Select value={qForm.correctAnswer} onValueChange={(v) => setQForm({ ...qForm, correctAnswer: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Verdadeiro</SelectItem>
                    <SelectItem value="false">Falso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setQuestionModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveQuestionMut.isPending}>{saveQuestionMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar Questão</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={materialModalOpen} onOpenChange={(o) => { setMaterialModalOpen(o); if (!o) { setEditingMaterial(null); setSelectedFile(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "Editar Material" : "Novo Material"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isFileUpload(materialForm.type) && !editingMaterial?.hasFile) {
                if (activeMaterialActivityId) {
                  uploadActivityMaterialMut.mutate();
                } else {
                  uploadMaterialMut.mutate();
                }
              } else {
                saveMaterialMut.mutate();
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={materialForm.type}
                onValueChange={(v) => {
                  setSelectedFile(null);
                  setMaterialForm({ ...materialForm, type: v as Material["type"] });
                }}
                disabled={!!editingMaterial}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">📄 PDF</SelectItem>
                  <SelectItem value="WORD">📝 Word (DOCX)</SelectItem>
                  <SelectItem value="TXT">📃 TXT</SelectItem>
                  <SelectItem value="SLIDE">📊 Slides (PPT/PPTX)</SelectItem>
                  <SelectItem value="IMAGE">🖼️ Imagem (link)</SelectItem>
                  <SelectItem value="LINK">🔗 Link</SelectItem>
                  <SelectItem value="VIDEO_EXTRA">🎬 Vídeo Extra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={materialForm.title}
                onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                placeholder="Ex: Apostila de Calls"
                required
              />
            </div>

            {isFileUpload(materialForm.type) && !editingMaterial?.hasFile && (
              <div className="space-y-2">
                <Label>Arquivo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_EXTENSIONS}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
                {selectedFile ? (
                  <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 bg-secondary/40">
                    <span className="text-2xl">{getMaterialIcon(materialForm.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const f = e.dataTransfer.files[0];
                      if (f) handleFileSelect(f);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg px-6 py-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                      dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/30"
                    }`}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Arraste o arquivo aqui</p>
                    <p className="text-xs text-muted-foreground">ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX, XLSX, TXT — máx. 50 MB</p>
                  </div>
                )}
              </div>
            )}

            {editingMaterial?.hasFile && (
              <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 bg-secondary/20">
                <span className="text-2xl">{getMaterialIcon(materialForm.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{editingMaterial.fileName}</p>
                  {editingMaterial.fileSize && (
                    <p className="text-xs text-muted-foreground">{formatBytes(editingMaterial.fileSize)}</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">Arquivo atual</Badge>
              </div>
            )}

            {!isFileUpload(materialForm.type) && (
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={materialForm.url}
                  onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setMaterialModalOpen(false)}>Cancelar</Button>
              <Button
                type="submit"
                disabled={
                  saveMaterialMut.isPending ||
                  uploadMaterialMut.isPending ||
                  uploadActivityMaterialMut.isPending ||
                  (isFileUpload(materialForm.type) && !editingMaterial?.hasFile && !selectedFile)
                }
              >
                {(saveMaterialMut.isPending || uploadMaterialMut.isPending || uploadActivityMaterialMut.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {isFileUpload(materialForm.type) && !editingMaterial?.hasFile ? "Enviar Arquivo" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget)} loading={deleteMut.isPending} />
    </div>
  );
};

export default ModuleDetailPage;
