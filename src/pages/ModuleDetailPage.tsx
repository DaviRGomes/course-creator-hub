import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Pencil, Trash2, ChevronLeft, Video, FileText, Loader2, Upload } from "lucide-react";

interface VideoItem { id: string; title: string; url: string; duration: number; sequenceOrder: number; }
interface Option { optionText: string; isCorrect: boolean; orderIndex: number; }
interface Question { id?: string; questionText: string; questionType: string; orderIndex: number; points: number; options: Option[]; }
interface Activity { id: string; title: string; description: string; sequenceOrder: number; passingScore: number; questions?: Question[]; }
interface Material { id: string; title: string; url: string; type: "PDF" | "IMAGE" | "LINK" | "VIDEO_EXTRA"; description?: string; }

type SequenceItem = { type: "video"; data: VideoItem } | { type: "activity"; data: Activity };

const formatDuration = (s: number) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${sec.toString().padStart(2, "0")}`; };

const ModuleDetailPage = () => {
  const { id: courseId, moduleId } = useParams<{ id: string; moduleId: string }>();
  const qc = useQueryClient();

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  const [videoForm, setVideoForm] = useState({ title: "", url: "", duration: 0, sequenceOrder: 0 });
  const [actForm, setActForm] = useState({ title: "", description: "", sequenceOrder: 0, passingScore: 70 });
  const [qForm, setQForm] = useState<{ questionText: string; questionType: string; orderIndex: number; points: number; options: Option[]; correctAnswer: string }>({
    questionText: "", questionType: "MULTIPLE_CHOICE", orderIndex: 0, points: 10, options: [
      { optionText: "", isCorrect: false, orderIndex: 0 },
      { optionText: "", isCorrect: false, orderIndex: 1 },
    ], correctAnswer: "true",
  });
  const [activeActForQuestions, setActiveActForQuestions] = useState<Activity | null>(null);

  // Materials state
  const [activeTab, setActiveTab] = useState<"sequence" | "materials">("sequence");
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialForm, setMaterialForm] = useState({ title: "", url: "", type: "PDF" as Material["type"], description: "" });
  const [uploading, setUploading] = useState<string | null>(null);

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
    queryKey: ["materials", moduleId],
    queryFn: () => api.get(`${base}/materials`).then((r) => r.data.data ?? r.data).catch(() => []),
  });

  const sequence: SequenceItem[] = [
    ...videos.map((v) => ({ type: "video" as const, data: v })),
    ...activities.map((a) => ({ type: "activity" as const, data: a })),
  ].sort((a, b) => a.data.sequenceOrder - b.data.sequenceOrder);

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
    mutationFn: (t: { type: string; id: string }) =>
      t.type === "video"
        ? api.delete(`${base}/videos/${t.id}`).then(() => {})
        : t.type === "material"
        ? api.delete(`${base}/materials/${t.id}`).then(() => {})
        : api.delete(`${base}/activities/${t.id}`).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos", moduleId] });
      qc.invalidateQueries({ queryKey: ["activities", moduleId] });
      qc.invalidateQueries({ queryKey: ["materials", moduleId] });
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
    mutationFn: () =>
      editingMaterial
        ? api.put(`${base}/materials/${editingMaterial.id}`, materialForm).then(() => {})
        : api.post(`${base}/materials`, materialForm).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials", moduleId] });
      setMaterialModalOpen(false);
      setEditingMaterial(null);
      toast.success("Material salvo");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao salvar material"),
  });

  const openCreateVideo = () => { setEditingVideo(null); setVideoForm({ title: "", url: "", duration: 0, sequenceOrder: sequence.length }); setVideoModalOpen(true); };
  const openEditVideo = (v: VideoItem) => { setEditingVideo(v); setVideoForm({ title: v.title, url: v.url, duration: v.duration, sequenceOrder: v.sequenceOrder }); setVideoModalOpen(true); };
  const openCreateActivity = () => { setEditingActivity(null); setActForm({ title: "", description: "", sequenceOrder: sequence.length, passingScore: 70 }); setActivityModalOpen(true); };
  const openEditActivity = (a: Activity) => { setEditingActivity(a); setActForm({ title: a.title, description: a.description, sequenceOrder: a.sequenceOrder, passingScore: a.passingScore }); setActivityModalOpen(true); };

  const openCreateMaterial = () => {
    setEditingMaterial(null);
    setMaterialForm({ title: "", url: "", type: "PDF", description: "" });
    setMaterialModalOpen(true);
  };
  const openEditMaterial = (m: Material) => {
    setEditingMaterial(m);
    setMaterialForm({ title: m.title, url: m.url, type: m.type, description: m.description || "" });
    setMaterialModalOpen(true);
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "PDF": return "📄";
      case "IMAGE": return "🖼️";
      case "LINK": return "🔗";
      case "VIDEO_EXTRA": return "🎬";
      default: return "📎";
    }
  };

  const getMaterialLabel = (type: string) => {
    switch (type) {
      case "PDF": return "PDF";
      case "IMAGE": return "Imagem";
      case "LINK": return "Link";
      case "VIDEO_EXTRA": return "Vídeo Extra";
      default: return type;
    }
  };

  const handleMuxUpload = async (videoId: string) => {
    try {
      const { data } = await api.post(
        `/courses/${courseId}/modules/${moduleId}/videos/${videoId}/mux-upload`
      );
      const { uploadUrl } = data.data ?? data;

      const input = document.createElement("input");
      input.type = "file";
      input.accept = "video/*";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        setUploading(videoId);
        try {
          await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });
          toast.success("Upload enviado! O vídeo ficará disponível em alguns minutos.");
          qc.invalidateQueries({ queryKey: ["videos", moduleId] });
        } catch {
          toast.error("Erro ao enviar o vídeo.");
        } finally {
          setUploading(null);
        }
      };
      input.click();
    } catch {
      toast.error("Erro ao iniciar upload no Mux.");
    }
  };

  const isLoading = vLoading || aLoading;

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
          {activeTab === "sequence" ? (
            <>
              <Button onClick={openCreateVideo}><Plus className="h-4 w-4" /> Aula</Button>
              <Button variant="outline" onClick={openCreateActivity}><Plus className="h-4 w-4" /> Atividade</Button>
            </>
          ) : (
            <Button onClick={openCreateMaterial}><Plus className="h-4 w-4" /> Material</Button>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("sequence")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "sequence"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          📋 Sequência de Aulas
        </button>
        <button
          onClick={() => setActiveTab("materials")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "materials"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          📁 Materiais
          {materials.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
              {materials.length}
            </span>
          )}
        </button>
      </div>

      {/* Aba Sequência */}
      {activeTab === "sequence" && (
        <>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : sequence.length === 0 ? (
            <EmptyState icon={Video} message="Nenhuma aula ou atividade encontrada." actionLabel="Criar Primeira Aula" onAction={openCreateVideo} />
          ) : (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Seq</TableHead>
                    <TableHead className="w-28">Tipo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Info</TableHead>
                    <TableHead className="w-28">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sequence.map((item) => (
                    <TableRow key={`${item.type}-${item.data.id}`}>
                      <TableCell className="text-muted-foreground">{item.data.sequenceOrder}</TableCell>
                      <TableCell>
                        {item.type === "video" ? (
                          <Badge variant="secondary" className="gap-1"><Video className="h-3 w-3" /> Aula</Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" /> Atividade</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.data.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.type === "video" ? formatDuration((item.data as VideoItem).duration) : `Nota: ${(item.data as Activity).passingScore}%`}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => item.type === "video" ? openEditVideo(item.data as VideoItem) : openEditActivity(item.data as Activity)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: item.type, id: item.data.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          {item.type === "video" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMuxUpload(item.data.id)}
                              disabled={uploading === item.data.id}
                              className="text-xs gap-1"
                            >
                              {uploading === item.data.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                              Mux
                            </Button>
                          )}
                          {item.type === "activity" && (
                            <Button variant="ghost" size="sm" onClick={() => setActiveActForQuestions(item.data as Activity)} className="text-xs">Questões</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
                <div className="space-y-3">
                  {activeActForQuestions.questions?.map((q, qi) => (
                    <div key={q.id || qi} className="border border-border rounded-md p-3">
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
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Aba Materiais */}
      {activeTab === "materials" && (
        <div>
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
            <div className="space-y-3">
              {materials.map((m) => (
                <div
                  key={m.id}
                  className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-4"
                >
                  <span className="text-2xl">{getMaterialIcon(m.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-foreground text-sm truncate">{m.title}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {getMaterialLabel(m.type)}
                      </Badge>
                    </div>
                    {m.description && (
                      <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                    )}
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline truncate block"
                    >
                      {m.url}
                    </a>
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={videoModalOpen} onOpenChange={(o) => { setVideoModalOpen(o); if (!o) setEditingVideo(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingVideo ? "Editar Aula" : "Nova Aula"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveVideoMut.mutate(); }} className="space-y-4">
            <div className="space-y-2"><Label>Título</Label><Input value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label>URL do vídeo</Label><Input value={videoForm.url} onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })} placeholder="YouTube, Vimeo ou Google Drive" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Duração (seg)</Label><Input type="number" value={videoForm.duration} onChange={(e) => setVideoForm({ ...videoForm, duration: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Posição (seq)</Label><Input type="number" value={videoForm.sequenceOrder} onChange={(e) => setVideoForm({ ...videoForm, sequenceOrder: Number(e.target.value) })} /></div>
            </div>
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

      <Dialog open={materialModalOpen} onOpenChange={(o) => { setMaterialModalOpen(o); if (!o) setEditingMaterial(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "Editar Material" : "Novo Material"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMaterialMut.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={materialForm.type} onValueChange={(v) => setMaterialForm({ ...materialForm, type: v as Material["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">📄 PDF</SelectItem>
                  <SelectItem value="IMAGE">🖼️ Imagem</SelectItem>
                  <SelectItem value="LINK">🔗 Link</SelectItem>
                  <SelectItem value="VIDEO_EXTRA">🎬 Vídeo Extra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={materialForm.title} onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })} placeholder="Ex: Apostila de Calls" required />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input value={materialForm.url} onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })} placeholder="https://drive.google.com/... ou https://..." required />
              <p className="text-xs text-muted-foreground">Para PDFs: use Google Drive com link público. Para imagens: link direto da imagem.</p>
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea value={materialForm.description} onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })} placeholder="Breve descrição do material..." rows={2} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setMaterialModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveMaterialMut.isPending}>{saveMaterialMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget)} loading={deleteMut.isPending} />
    </div>
  );
};

export default ModuleDetailPage;
