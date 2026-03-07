import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { DEMO_MODE } from "@/lib/config";
import { mockCourses, mockModules } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, ChevronLeft, Layers, Loader2 } from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  videosCount?: number;
  activitiesCount?: number;
}

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", orderIndex: 0 });

  const { data: course } = useQuery({
    queryKey: ["course", id],
    queryFn: () => {
      if (DEMO_MODE) return Promise.resolve(mockCourses.find((c) => c.id === id) || { id, title: "Curso", description: "" });
      return api.get(`/courses/${id}`).then((r) => r.data.data ?? r.data);
    },
  });

  const { data: modules = [], isLoading } = useQuery<Module[]>({
    queryKey: ["modules", id],
    queryFn: () => {
      if (DEMO_MODE) return Promise.resolve(mockModules[id!] || []);
      return api.get(`/courses/${id}/modules`).then((r) => r.data.data ?? r.data);
    },
  });

  const saveMut = useMutation({
    mutationFn: () => {
      if (DEMO_MODE) { toast.info("Modo demo — ação simulada"); return Promise.resolve(); }
      return editing ? api.put(`/courses/${id}/modules/${editing.id}`, form).then(() => {}) : api.post(`/courses/${id}/modules`, form).then(() => {});
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["modules", id] }); setModalOpen(false); setEditing(null); toast.success(editing ? "Módulo atualizado" : "Módulo criado"); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro"),
  });

  const deleteMut = useMutation({
    mutationFn: (moduleId: string) => {
      if (DEMO_MODE) { toast.info("Modo demo — ação simulada"); return Promise.resolve(); }
      return api.delete(`/courses/${id}/modules/${moduleId}`).then(() => {});
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["modules", id] }); setDeleteTarget(null); toast.success("Módulo removido"); },
  });

  const openCreate = () => { setEditing(null); setForm({ title: "", description: "", orderIndex: modules.length }); setModalOpen(true); };
  const openEdit = (m: Module) => { setEditing(m); setForm({ title: m.title, description: m.description, orderIndex: m.orderIndex }); setModalOpen(true); };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
        <Link to="/admin/courses" className="hover:text-foreground transition-fast flex items-center gap-1"><ChevronLeft className="h-4 w-4" /> Cursos</Link>
        <span>/</span>
        <span className="text-foreground">{course?.title || "..."}</span>
      </div>

      <div className="flex items-center justify-between mb-6 mt-4">
        <h1 className="text-xl font-semibold text-foreground">{course?.title || "Carregando..."}</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Módulo</Button>
      </div>

      {isLoading ? (
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
    </div>
  );
};

export default CourseDetailPage;
