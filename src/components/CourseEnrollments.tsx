import { useState, useEffect, useRef } from "react";
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
import { Plus, Trash2, Users, Loader2, Search } from "lucide-react";

interface Enrollment {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  enrolledAt?: string;
  progress?: number;
}

interface UserResult {
  id: string;
  name?: string;
  email?: string;
}

interface Props {
  courseId: string;
}

export const CourseEnrollments = ({ courseId }: Props) => {
  const qc = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ["enrollments", courseId],
    queryFn: () =>
      api.get(`/courses/${courseId}/enrollments`).then((r) => {
        const payload = r.data.data ?? r.data;
        return Array.isArray(payload) ? payload : (payload.content ?? []);
      }),
  });

  const { data: searchResults = [], isFetching: isSearching } = useQuery<UserResult[]>({
    queryKey: ["user-search", searchTerm],
    queryFn: () =>
      api.get(`/admin/users`, { params: { search: searchTerm } }).then((r) => {
        const payload = r.data.data ?? r.data;
        return Array.isArray(payload) ? payload : (payload.content ?? []);
      }),
    enabled: searchTerm.length >= 2,
    staleTime: 10000,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const enrollMut = useMutation({
    mutationFn: (userId: string) =>
      api.post(`/courses/${courseId}/enrollments`, { userId }).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollments", courseId] });
      setAddModalOpen(false);
      setSearchTerm("");
      setSelectedUser(null);
      toast.success("Aluno matriculado no curso");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erro ao matricular aluno"),
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

  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user);
    setSearchTerm(user.email || user.name || "");
    setShowResults(false);
  };

  const handleCloseModal = (open: boolean) => {
    setAddModalOpen(open);
    if (!open) {
      setSearchTerm("");
      setSelectedUser(null);
      setShowResults(false);
    }
  };

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

      {/* Search & enroll student modal */}
      <Dialog open={addModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Matricular Aluno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar por email</Label>
              <div className="relative" ref={resultsRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite o email do aluno..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectedUser(null);
                      setShowResults(true);
                    }}
                    onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
                    className="pl-9"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {showResults && searchTerm.length >= 2 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.length === 0 && !isSearching ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        Nenhum aluno encontrado
                      </div>
                    ) : (
                      searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex flex-col gap-0.5"
                          onClick={() => handleSelectUser(user)}
                        >
                          <span className="text-sm font-medium text-foreground">{user.name || "Sem nome"}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedUser && (
                <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-md text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{selectedUser.name || "Sem nome"}</span>
                  <span className="text-muted-foreground">— {selectedUser.email}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => handleCloseModal(false)}>Cancelar</Button>
              <Button
                disabled={!selectedUser || enrollMut.isPending}
                onClick={() => selectedUser && enrollMut.mutate(selectedUser.id)}
              >
                {enrollMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Matricular
              </Button>
            </DialogFooter>
          </div>
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
