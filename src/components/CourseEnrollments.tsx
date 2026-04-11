import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Plus, Trash2, Users, Loader2 } from "lucide-react";

interface Enrollment {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  enrolledAt?: string;
  progress?: number;
}

interface Props {
  courseId: string;
}

export const CourseEnrollments = ({ courseId }: Props) => {
  const qc = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });

  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ["enrollments", courseId],
    queryFn: () =>
      api.get(`/courses/${courseId}/enrollments`).then((r) => {
        const payload = r.data.data ?? r.data;
        return Array.isArray(payload) ? payload : (payload.content ?? []);
      }),
  });

  const createAndEnrollMut = useMutation({
    mutationFn: async () => {
      const r = await api.post(`/admin/users`, {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
      });
      const userId = r.data?.data?.id ?? r.data?.id;
      if (userId) {
        await api.post(`/courses/${courseId}/enrollments`, { userId });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollments", courseId] });
      setAddModalOpen(false);
      setCreateForm({ name: "", email: "", password: "" });
      toast.success("Aluno criado e matriculado no curso");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao criar aluno"),
  });

  const removeMut = useMutation({
    mutationFn: (enrollmentId: string) =>
      api.delete(`/courses/${courseId}/enrollments/${enrollmentId}`).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollments", courseId] });
      setRemoveTarget(null);
      toast.success("Aluno removido do curso");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao remover aluno"),
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Alunos Matriculados
          <span className="text-sm font-normal text-muted-foreground">({enrollments.length})</span>
        </h3>
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4" /> Adicionar Aluno
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={Users}
          message="Nenhum aluno matriculado neste curso."
          actionLabel="Adicionar Aluno"
          onAction={() => setAddModalOpen(true)}
        />
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Data de Matrícula</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.userName || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{e.userEmail || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${e.progress ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{e.progress ?? 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRemoveTarget(e.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add student modal */}
      <Dialog open={addModalOpen} onOpenChange={(o) => { setAddModalOpen(o); if (!o) setCreateForm({ name: "", email: "", password: "" }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar e Matricular Aluno</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createAndEnrollMut.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAddModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createAndEnrollMut.isPending}>
                {createAndEnrollMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Criar Aluno
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && removeMut.mutate(removeTarget)}
        title="Remover aluno do curso?"
        description="O aluno perderá o acesso ao curso e seu progresso será removido."
        loading={removeMut.isPending}
      />
    </>
  );
};
