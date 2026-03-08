import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, ChevronLeft, Layers, Loader2, Save, BookOpen } from "lucide-react";
import { CourseEnrollments } from "@/components/CourseEnrollments";

interface Module {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  videosCount?: number;
  activitiesCount?: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  active: boolean;
  modulesCount?: number;
}

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [editingCourse, setEditingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", thumbnail: "", active: true });
  const [deleteCourseOpen, setDeleteCourseOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", orderIndex: 0 });

  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ["course", id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data.data ?? r.data),
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ["modules", id],
    queryFn: () => api.get(`/courses/${id}/modules`).then((r) => r.data.data ?? r.data),
  });

  const updateCourseMut = useMutation({
    mutationFn: () => api.put(`/courses/${id}`, courseForm).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course", id] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      setEditingCourse(false);
      toast.success("Curso atualizado");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao atualizar curso"),
  });

  const deleteCourseMut = useMutation({
    mutationFn: () => api.delete(`/courses/${id}`).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      navigate("/admin/courses", { replace: true });
      toast.success("Curso removido");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao remover curso"),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      editing
        ? api.put(`/courses/${id}/modules/${editing.id}`, form).then(() => {})
        : api.post(`/courses/${id}/modules`, form).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules", id] });
      setModalOpen(false);
      setEditing(null);
      toast.success(editing ? "Módulo atualizado" : "Módulo criado");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro"),
  });

  const deleteMut = useMutation({
    mutationFn: (moduleId: string) => api.delete(`/courses/${id}/modules/${moduleId}`).then(() => {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["modules", id] }); setDeleteTarget(null); toast.success("Módulo removido"); },
  });

  const startEditCourse = () => {
    if (course) {
      setCourseForm({ title: course.title ?? "", description: course.description ?? "", thumbnail: course.thumbnail ?? "", active: course.active ?? true });
      setEditingCourse(true);
    }
  };

  const openCreate = () => { setEditing(null); setForm({ title: "", description: "", orderIndex: modules.length }); setModalOpen(true); };
  const openEdit = (m: Module) => { setEditing(m); setForm({ title: m.title, description: m.description, orderIndex: m.orderIndex }); setModalOpen(true); };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
        <Link to="/admin/courses" className="hover:text-foreground transition-fast flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Cursos
        </Link>
        <span>/</span>
        <span className="text-foreground">{course?.title || "..."}</span>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mt-4 mb-6">
        {courseLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : editingCourse ? (
          <form onSubmit={(e) => { e.preventDefault(); updateCourseMut.mutate(); }} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Editar Curso
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Input value={courseForm.thumbnail} onChange={(e) => setCourseForm({ ...courseForm, thumbnail: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={courseForm.active} onCheckedChange={(v) => setCourseForm({ ...courseForm, active: v })} />
              <Label>Curso ativo</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={updateCourseMut.isPending}>
                {updateCourseMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" /> Salvar Alterações
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditingCourse(false)}>Cancelar</Button>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">{course?.title}</h2>
                  <Badge variant={(course?.active ?? true) ? "default" : "outline"} className={(course?.active ?? true) ? "bg-success text-success-foreground" : ""}>
                    {(course?.active ?? true) ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{course?.description || "Sem descrição."}</p>
                {course?.thumbnail && (
                  <div className="mt-3 w-48 h-28 rounded-md overflow-hidden border border-border bg-secondary">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                  <span>{modules.length} módulo{modules.length !== 1 ? "s" : ""}</span>
                  <span>{modules.reduce((sum, m) => sum + (m.videosCount || 0), 0)} aulas</span>
                  <span>{modules.reduce((sum, m) => sum + (m.activitiesCount || 0), 0)} atividades</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm" onClick={startEditCourse}>
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteCourseOpen(true)}>
                  <Trash2 className="h-4 w-4" /> Excluir
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator className="mb-6" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Módulos</h3>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo Módulo</Button>
      </div>

      {modulesLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : modules.length === 0 ? (
        <EmptyState icon={Layers} message="Nenhum módulo encontrado." actionLabel="Criar Primeiro Módulo" onAction={openCreate} />
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Aulas</TableHead>
                <TableHead>Atividades</TableHead>
                <TableHead className="w-36">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.sort((a, b) => a.orderIndex - b.orderIndex).map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-muted-foreground">{m.orderIndex + 1}</TableCell>
                  <TableCell className="font-medium">{m.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{m.description}</TableCell>
                  <TableCell>{m.videosCount ?? "-"}</TableCell>
                  <TableCell>{m.activitiesCount ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/courses/${id}/modules/${m.id}`)}>
                        <Eye className="h-4 w-4" /> Ver
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(o) => { setModalOpen(o); if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Módulo" : "Novo Módulo"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }} className="space-y-4">
            <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Ordem</Label><Input type="number" value={form.orderIndex} onChange={(e) => setForm({ ...form, orderIndex: Number(e.target.value) })} /></div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveMut.isPending}>
                {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget)} loading={deleteMut.isPending} />
      <ConfirmDialog open={deleteCourseOpen} onOpenChange={() => setDeleteCourseOpen(false)} onConfirm={() => deleteCourseMut.mutate()} loading={deleteCourseMut.isPending} />
    </div>
  );
};

export default CourseDetailPage;
