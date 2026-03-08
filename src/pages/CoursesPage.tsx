import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Plus, BookOpen, Pencil, Trash2, Loader2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  active: boolean;
  modulesCount?: number;
}

const CoursesPage = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", thumbnail: "", active: true });

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: () => {
      if (DEMO_MODE) return Promise.resolve(mockCourses);
      return api.get("/courses").then((r) => {
        const payload = r.data.data ?? r.data;
        return Array.isArray(payload) ? payload : (payload.content ?? []);
      });
    },
  });

  const saveMut = useMutation({
    mutationFn: () =>
      editing
        ? api.put(`/courses/${editing.id}`, form).then(() => {})
        : api.post("/courses", form).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      setModalOpen(false);
      setEditing(null);
      toast.success(editing ? "Curso atualizado" : "Curso criado");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      setDeleteTarget(null);
      toast.success("Curso removido");
    },
  });

  const openCreate = () => { setEditing(null); setForm({ title: "", description: "", thumbnail: "", active: true }); setModalOpen(true); };
  const openEdit = (c: Course) => { setEditing(c); setForm({ title: c.title, description: c.description, thumbnail: c.thumbnail, active: c.active }); setModalOpen(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Cursos</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo Curso</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState icon={BookOpen} message="Nenhum curso encontrado." actionLabel="Criar Primeiro Curso" onAction={openCreate} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-lg overflow-hidden transition-fast hover:shadow-md">
              {c.thumbnail && (
                <div className="h-32 bg-secondary overflow-hidden">
                  <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-sm">{c.title}</h3>
                  <Badge variant={c.active ? "default" : "outline"} className={c.active ? "bg-success text-success-foreground" : ""}>
                    {c.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{c.description}</p>
                {c.modulesCount !== undefined && <p className="text-xs text-muted-foreground mb-3">{c.modulesCount} módulos</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/admin/courses/${c.id}`)}>Gerenciar</Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(o) => { setModalOpen(o); if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Curso" : "Novo Curso"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }} className="space-y-4">
            <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="space-y-2"><Label>Thumbnail URL</Label><Input value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} placeholder="https://..." /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Ativo</Label>
            </div>
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
    </div>
  );
};

export default CoursesPage;
