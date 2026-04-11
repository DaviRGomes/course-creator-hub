import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Plus, Trash2, Users, Loader2, KeyRound, Copy, CheckCheck } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string;
}

interface Course {
  id: number;
  title: string;
}

interface CreatedStudent {
  email: string;
  generatedPassword: string;
}

const UsersPage = () => {
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", courseId: "" });
  const [createdStudent, setCreatedStudent] = useState<CreatedStudent | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => api.get("/admin/users").then((r) => r.data.data ?? r.data),
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: () => api.get("/courses").then((r) => r.data.data ?? r.data),
  });

  const createMut = useMutation({
    mutationFn: () =>
      api.post("/admin/users", {
        name: form.name,
        email: form.email,
        password: form.password || null,
        courseId: form.courseId ? Number(form.courseId) : null,
      }).then((r) => r.data.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setCreatedStudent({ email: data.email, generatedPassword: data.generatedPassword });
      setCopied(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao criar aluno"),
  });

  const resetPasswordMut = useMutation({
    mutationFn: (id: string) => api.put(`/admin/users/${id}/reset-password`).then((r) => r.data.data),
    onSuccess: (data) => {
      toast.success(`Nova senha: ${data.newPassword}`, {
        description: `Email: ${data.email}`,
        duration: 15000,
        action: {
          label: "Copiar",
          onClick: () =>
            navigator.clipboard.writeText(`Email: ${data.email}\nSenha: ${data.newPassword}`),
        },
      });
    },
    onError: () => toast.error("Erro ao resetar senha"),
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => api.put(`/admin/users/${id}/toggle-active`).then(() => {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Status alterado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`).then(() => {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setDeleteTarget(null); toast.success("Usuário removido"); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao remover"),
  });

  const openModal = () => {
    setForm({ name: "", email: "", password: "", courseId: "" });
    setCreatedStudent(null);
    setCopied(false);
    setModalOpen(true);
  };

  const handleCopy = () => {
    if (!createdStudent) return;
    navigator.clipboard.writeText(
      `Email: ${createdStudent.email}\nSenha: ${createdStudent.generatedPassword}`
    );
    setCopied(true);
    toast.success("Credenciais copiadas!");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Usuários</h1>
        <Button onClick={openModal}>
          <Plus className="h-4 w-4" /> Adicionar Aluno
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} message="Nenhum usuário encontrado." actionLabel="Adicionar Aluno" onAction={openModal} />
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Expiração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isExpired = u.subscriptionExpiresAt
                  ? new Date(u.subscriptionExpiresAt) < new Date()
                  : false;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                    <TableCell>
                      {u.subscriptionExpiresAt ? (
                        <span className={`text-sm font-medium ${isExpired ? "text-destructive" : "text-foreground"}`}>
                          {new Date(u.subscriptionExpiresAt).toLocaleDateString("pt-BR")}
                          {isExpired && (
                            <Badge variant="outline" className="ml-2 text-destructive border-destructive text-xs">
                              Expirado
                            </Badge>
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => toggleMut.mutate(u.id)} className="transition-fast">
                        <Badge
                          variant={u.active ? "default" : "outline"}
                          className={u.active ? "bg-success hover:bg-success/80 text-success-foreground" : ""}
                        >
                          {u.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Resetar senha"
                          onClick={() => resetPasswordMut.mutate(u.id)}
                          disabled={resetPasswordMut.isPending}
                        >
                          <KeyRound className="h-4 w-4 text-amber-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(u.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal Novo Aluno */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) setModalOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Aluno</DialogTitle>
          </DialogHeader>

          {!createdStudent ? (
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="João da Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="joao@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Senha{" "}
                  <span className="text-muted-foreground text-xs font-normal">
                    (deixe vazio para gerar automaticamente)
                  </span>
                </Label>
                <Input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Matricular no curso{" "}
                  <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                </Label>
                <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMut.isPending}>
                  {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  Criar Aluno
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-green-800">Aluno criado com sucesso!</p>
                <p className="text-sm text-green-700">
                  Email: <span className="font-mono font-medium">{createdStudent.email}</span>
                </p>
                <p className="text-sm text-green-700">
                  Senha:{" "}
                  <span className="font-mono font-medium">{createdStudent.generatedPassword}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Copie as credenciais e envie ao aluno por WhatsApp ou e-mail.
              </p>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={handleCopy} variant={copied ? "secondary" : "default"}>
                  {copied ? (
                    <CheckCheck className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? "Copiado!" : "Copiar credenciais"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget)}
        loading={deleteMut.isPending}
      />
    </div>
  );
};

export default UsersPage;
