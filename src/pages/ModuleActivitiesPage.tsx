import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft, Plus, Pencil, Trash2, Loader2, FileText, ChevronDown, ChevronRight,
  Paperclip, Download, Upload,
} from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableItem } from "@/components/SortableItem";

interface Material {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  hasFile: boolean;
}
interface Option { optionText: string; isCorrect: boolean; orderIndex: number; }
interface Question {
  id?: string;
  questionText: string;
  questionType: string;
  orderIndex: number;
  points: number;
  options: Option[];
}
interface Activity {
  id: string;
  title: string;
  description: string;
  sequenceOrder: number;
  passingScore: number;
  questions?: Question[];
}

const QUESTION_TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: "Múltipla Escolha",
  TRUE_FALSE: "Verdadeiro/Falso",
  ESSAY: "Dissertativa",
  FILE_UPLOAD: "Upload de Arquivo",
};

// ─── Activity Materials Panel (fetches its own data) ─────────────────────────

function ActivityMaterialsPanel({
  courseId, moduleId, activityId,
}: { courseId: string; moduleId: string; activityId: string }) {
  const qc = useQueryClient();
  const base = `/courses/${courseId}/modules/${moduleId}`;
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["activity-materials", activityId],
    queryFn: () =>
      api.get(`${base}/activities/${activityId}/materials`)
        .then((r) => r.data.data ?? r.data)
        .catch(() => []),
  });

  const uploadMut = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("title", title || file.name);
      fd.append("file", file);
      return api.post(`${base}/activities/${activityId}/materials/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activity-materials", activityId] });
      setTitle("");
      toast.success("Material anexado");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao fazer upload"),
  });

  const deleteMut = useMutation({
    mutationFn: (matId: string) =>
      api.delete(`${base}/activities/${activityId}/materials/${matId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activity-materials", activityId] });
      toast.success("Material removido");
    },
  });

  const formatSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="border-t border-border bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Materiais
        </span>
      </div>

      {isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : materials.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 truncate">{m.title}</span>
              {m.fileSize && (
                <span className="text-xs text-muted-foreground shrink-0">{formatSize(m.fileSize)}</span>
              )}
              <a
                href={`${base}/activities/${activityId}/materials/${m.id}/download`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  api.get(`${base}/activities/${activityId}/materials/${m.id}/download`, { responseType: "blob" })
                    .then((r) => {
                      const url = URL.createObjectURL(r.data);
                      window.open(url, "_blank");
                    });
                }}
                className="shrink-0"
              >
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Download className="h-3 w-3" />
                </Button>
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => deleteMut.mutate(m.id)}
                disabled={deleteMut.isPending}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-2">Nenhum material anexado.</p>
      )}

      {/* Upload row */}
      <div className="flex items-center gap-2">
        <Input
          className="h-7 text-xs flex-1"
          placeholder="Título do arquivo (opcional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadMut.mutate(file);
            e.target.value = "";
          }}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs shrink-0"
          onClick={() => fileRef.current?.click()}
          disabled={uploadMut.isPending}
        >
          {uploadMut.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Upload className="h-3 w-3" />
          )}
          Anexar
        </Button>
      </div>
    </div>
  );
}

const ModuleActivitiesPage = () => {
  const { id: courseId, moduleId } = useParams<{ id: string; moduleId: string }>();
  const qc = useQueryClient();

  const base = `/courses/${courseId}/modules/${moduleId}`;

  // Modal state
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "activity" | "question"; actId: string; qId?: string } | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [activeActForQuestion, setActiveActForQuestion] = useState<Activity | null>(null);

  // Forms
  const [actForm, setActForm] = useState({
    title: "",
    description: "",
    sequenceOrder: 0,
    passingScore: 70,
  });
  const [qForm, setQForm] = useState<{
    questionText: string;
    questionType: string;
    orderIndex: number;
    points: number;
    options: Option[];
    correctAnswer: string;
  }>({
    questionText: "",
    questionType: "MULTIPLE_CHOICE",
    orderIndex: 0,
    points: 10,
    options: [
      { optionText: "", isCorrect: false, orderIndex: 0 },
      { optionText: "", isCorrect: false, orderIndex: 1 },
    ],
    correctAnswer: "true",
  });

  const [localQuestionsMap, setLocalQuestionsMap] = useState<Record<string, Question[]>>({});
  const sensors = useSensors(useSensor(PointerSensor));

  const reorderQuestionsMut = useMutation({
    mutationFn: ({ actId, ids }: { actId: string; ids: string[] }) =>
      api.patch(`${base}/activities/${actId}/questions/reorder`, { ids: ids.map(Number) }),
    onError: () => toast.error("Erro ao reordenar questões"),
  });

  const getQuestions = (act: Activity) => localQuestionsMap[act.id] ?? act.questions ?? [];

  const handleQuestionDragEnd = (act: Activity, event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const qs = getQuestions(act);
    const oldIdx = qs.findIndex((q) => String(q.id) === active.id);
    const newIdx = qs.findIndex((q) => String(q.id) === over.id);
    const reordered = arrayMove(qs, oldIdx, newIdx);
    setLocalQuestionsMap((prev) => ({ ...prev, [act.id]: reordered }));
    reorderQuestionsMut.mutate({ actId: act.id, ids: reordered.map((q) => String(q.id!)) });
  };

  const { data: moduleData } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: () => api.get(base).then((r) => r.data.data ?? r.data),
  });

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["activities", moduleId],
    queryFn: () =>
      api.get(`${base}/activities`).then((r) => r.data.data ?? r.data).catch(() => []),
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
      toast.success(editingActivity ? "Atividade atualizada" : "Atividade criada");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao salvar"),
  });

  const deleteActMut = useMutation({
    mutationFn: (actId: string) =>
      api.delete(`${base}/activities/${actId}`).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities", moduleId] });
      setDeleteTarget(null);
      toast.success("Atividade removida");
    },
  });

  const saveQuestionMut = useMutation({
    mutationFn: () => {
      const payload: any = {
        questionText: qForm.questionText,
        questionType: qForm.questionType,
        orderIndex: qForm.orderIndex,
        points: qForm.points,
      };
      if (qForm.questionType === "MULTIPLE_CHOICE") {
        payload.options = qForm.options;
      } else if (qForm.questionType === "TRUE_FALSE") {
        payload.options = [
          { optionText: "Verdadeiro", isCorrect: qForm.correctAnswer === "true", orderIndex: 0 },
          { optionText: "Falso", isCorrect: qForm.correctAnswer === "false", orderIndex: 1 },
        ];
      }
      return api
        .post(`${base}/activities/${activeActForQuestion!.id}/questions`, payload)
        .then(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities", moduleId] });
      setLocalQuestionsMap((prev) => {
        const next = { ...prev };
        delete next[activeActForQuestion!.id];
        return next;
      });
      setQuestionModalOpen(false);
      toast.success("Questão adicionada");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao salvar questão"),
  });

  const openCreateActivity = () => {
    setEditingActivity(null);
    setActForm({
      title: "",
      description: "",
      sequenceOrder: activities.length,
      passingScore: 70,
    });
    setActivityModalOpen(true);
  };

  const openEditActivity = (a: Activity) => {
    setEditingActivity(a);
    setActForm({
      title: a.title,
      description: a.description,
      sequenceOrder: a.sequenceOrder,
      passingScore: a.passingScore,
    });
    setActivityModalOpen(true);
  };

  const openAddQuestion = (act: Activity) => {
    setActiveActForQuestion(act);
    setQForm({
      questionText: "",
      questionType: "MULTIPLE_CHOICE",
      orderIndex: act.questions?.length ?? 0,
      points: 10,
      options: [
        { optionText: "", isCorrect: false, orderIndex: 0 },
        { optionText: "", isCorrect: false, orderIndex: 1 },
      ],
      correctAnswer: "true",
    });
    setQuestionModalOpen(true);
  };

  const toggleExpand = (actId: string) => {
    setExpandedActivity((prev) => (prev === actId ? null : actId));
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
        <Link
          to={`/admin/courses/${courseId}`}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Módulos
        </Link>
        <span>/</span>
        <Link
          to={`/admin/courses/${courseId}/modules/${moduleId}`}
          className="hover:text-foreground transition-colors"
        >
          {moduleData?.title || "Módulo"}
        </Link>
        <span>/</span>
        <span className="text-foreground">Atividades</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Atividades — {moduleData?.title || "..."}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activities.length} atividade{activities.length !== 1 ? "s" : ""} neste módulo
          </p>
        </div>
        <Button onClick={openCreateActivity}>
          <Plus className="h-4 w-4" /> Nova Atividade
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhuma atividade criada</p>
          <p className="text-sm mt-1">Crie atividades com questões para avaliar seus alunos</p>
          <Button className="mt-4" onClick={openCreateActivity}>
            <Plus className="h-4 w-4" /> Criar Primeira Atividade
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...activities]
            .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
            .map((act) => {
              const isExpanded = expandedActivity === act.id;
              return (
                <div
                  key={act.id}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  {/* Activity row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => toggleExpand(act.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums font-medium w-6 text-right">
                        {act.sequenceOrder}
                      </span>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{act.title}</p>
                      {act.description && (
                        <p className="text-xs text-muted-foreground truncate">{act.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        Nota mín: {act.passingScore}%
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {act.questions?.length ?? 0} questõe{(act.questions?.length ?? 0) !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddQuestion(act)}
                        className="text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" /> Questão
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditActivity(act)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDeleteTarget({ type: "activity", actId: act.id })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Questions panel */}
                  {isExpanded && (
                    <>
                      <div className="border-t border-border bg-muted/30 px-4 py-3">
                        {(act.questions?.length ?? 0) === 0 ? (
                          <p className="text-sm text-muted-foreground py-2 text-center">
                            Nenhuma questão ainda.{" "}
                            <button
                              onClick={() => openAddQuestion(act)}
                              className="text-primary hover:underline"
                            >
                              Adicionar questão
                            </button>
                          </p>
                        ) : (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleQuestionDragEnd(act, e)}
                          >
                            <SortableContext
                              items={getQuestions(act).map((q) => String(q.id))}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-2">
                                {getQuestions(act).map((q, qi) => (
                                  <SortableItem
                                    key={String(q.id)}
                                    id={String(q.id)}
                                    className="bg-card border border-border rounded-md"
                                  >
                                    <div className="p-3 pr-3">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-xs text-muted-foreground font-medium">
                                          Q{qi + 1}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {QUESTION_TYPE_LABEL[q.questionType] ?? q.questionType}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {q.points} pt{q.points !== 1 ? "s" : ""}
                                        </span>
                                      </div>
                                      <p className="text-sm text-foreground">{q.questionText}</p>
                                      {q.options && q.options.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                          {q.options.map((o, oi) => (
                                            <span
                                              key={oi}
                                              className={`text-xs px-2 py-0.5 rounded border ${
                                                o.isCorrect
                                                  ? "bg-green-50 text-green-700 border-green-200 font-medium"
                                                  : "bg-secondary text-secondary-foreground border-transparent"
                                              }`}
                                            >
                                              {o.optionText}
                                              {o.isCorrect && " ✓"}
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
                        <div className="mt-3 flex justify-end">
                          <Button size="sm" variant="outline" onClick={() => openAddQuestion(act)}>
                            <Plus className="h-3.5 w-3.5" /> Adicionar Questão
                          </Button>
                        </div>
                      </div>

                      {/* Materials panel */}
                      <ActivityMaterialsPanel
                        courseId={courseId!}
                        moduleId={moduleId!}
                        activityId={act.id}
                      />
                    </>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Modal — Atividade */}
      <Dialog
        open={activityModalOpen}
        onOpenChange={(o) => {
          setActivityModalOpen(o);
          if (!o) setEditingActivity(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? "Editar Atividade" : "Nova Atividade"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveActMut.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={actForm.title}
                onChange={(e) => setActForm({ ...actForm, title: e.target.value })}
                placeholder="Ex: Questionário — Módulo 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={actForm.description}
                onChange={(e) => setActForm({ ...actForm, description: e.target.value })}
                placeholder="Instrução para o aluno..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Posição na sequência</Label>
                <Input
                  type="number"
                  value={actForm.sequenceOrder}
                  onChange={(e) =>
                    setActForm({ ...actForm, sequenceOrder: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Nota mínima (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={actForm.passingScore}
                  onChange={(e) =>
                    setActForm({ ...actForm, passingScore: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setActivityModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveActMut.isPending}>
                {saveActMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal — Questão */}
      <Dialog open={questionModalOpen} onOpenChange={setQuestionModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Nova Questão — {activeActForQuestion?.title}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveQuestionMut.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={qForm.questionType}
                onValueChange={(v) => setQForm({ ...qForm, questionType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">Múltipla Escolha</SelectItem>
                  <SelectItem value="TRUE_FALSE">Verdadeiro ou Falso</SelectItem>
                  <SelectItem value="ESSAY">Dissertativa</SelectItem>
                  <SelectItem value="FILE_UPLOAD">Upload de Arquivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Textarea
                value={qForm.questionText}
                onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })}
                required
                rows={2}
                placeholder="Digite a pergunta..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pontos</Label>
                <Input
                  type="number"
                  min={1}
                  value={qForm.points}
                  onChange={(e) => setQForm({ ...qForm, points: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  min={0}
                  value={qForm.orderIndex}
                  onChange={(e) => setQForm({ ...qForm, orderIndex: Number(e.target.value) })}
                />
              </div>
            </div>

            {qForm.questionType === "MULTIPLE_CHOICE" && (
              <div className="space-y-3">
                <Label>Alternativas</Label>
                {qForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium w-5">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <Input
                      className="flex-1"
                      value={opt.optionText}
                      onChange={(e) => {
                        const opts = [...qForm.options];
                        opts[i] = { ...opts[i], optionText: e.target.value };
                        setQForm({ ...qForm, options: opts });
                      }}
                      placeholder="Texto da alternativa"
                    />
                    <div className="flex items-center gap-1">
                      <Checkbox
                        checked={opt.isCorrect}
                        onCheckedChange={(v) => {
                          const opts = [...qForm.options];
                          opts[i] = { ...opts[i], isCorrect: !!v };
                          setQForm({ ...qForm, options: opts });
                        }}
                      />
                      <span className="text-xs text-muted-foreground">Correta</span>
                    </div>
                    {qForm.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setQForm({
                            ...qForm,
                            options: qForm.options.filter((_, j) => j !== i),
                          })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setQForm({
                      ...qForm,
                      options: [
                        ...qForm.options,
                        { optionText: "", isCorrect: false, orderIndex: qForm.options.length },
                      ],
                    })
                  }
                >
                  <Plus className="h-3 w-3" /> Adicionar alternativa
                </Button>
              </div>
            )}

            {qForm.questionType === "TRUE_FALSE" && (
              <div className="space-y-2">
                <Label>Resposta correta</Label>
                <Select
                  value={qForm.correctAnswer}
                  onValueChange={(v) => setQForm({ ...qForm, correctAnswer: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Verdadeiro</SelectItem>
                    <SelectItem value="false">Falso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setQuestionModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveQuestionMut.isPending}>
                {saveQuestionMut.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Salvar Questão
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget?.type === "activity") {
            deleteActMut.mutate(deleteTarget.actId);
          }
        }}
        loading={deleteActMut.isPending}
      />
    </div>
  );
};

export default ModuleActivitiesPage;
