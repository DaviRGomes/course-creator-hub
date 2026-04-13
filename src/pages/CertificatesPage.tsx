import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { Award, Download, Search, X, Copy, CreditCard, CheckCircle2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Certificate {
  id: number;
  studentName: string;
  studentEmail: string;
  courseName: string;
  progressPercent: number;
  issuedAt: string;
  certificateCode: string;
}

interface CertificationPayment {
  id: number;
  studentName: string;
  studentEmail: string;
  courseName: string;
  kiwifyOrderId: string;
  paidAt: string;
  certIssued: boolean;
}

interface Course {
  id: number;
  title: string;
}

const CertificatesPage = () => {
  const [activeTab, setActiveTab] = useState<"issued" | "payments">("issued");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const { data: certificates = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ["admin-certificates"],
    queryFn: () =>
      api.get("/admin/dashboard/certificates").then((r) => r.data.data ?? r.data),
    refetchInterval: 30_000,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<CertificationPayment[]>({
    queryKey: ["admin-certification-payments"],
    queryFn: () =>
      api.get("/admin/dashboard/certification-payments").then((r) => r.data.data ?? r.data),
    refetchInterval: 30_000,
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: () => api.get("/courses").then((r) => r.data.data ?? r.data),
  });

  const filteredCerts = certificates.filter((cert) => {
    const matchSearch =
      !search ||
      cert.studentName.toLowerCase().includes(search.toLowerCase()) ||
      cert.studentEmail.toLowerCase().includes(search.toLowerCase());
    const matchCourse = !courseFilter || cert.courseName === courseFilter;
    const matchDate = !dateFilter || cert.issuedAt.startsWith(dateFilter);
    return matchSearch && matchCourse && matchDate;
  });

  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      !search ||
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.studentEmail.toLowerCase().includes(search.toLowerCase());
    const matchCourse = !courseFilter || p.courseName === courseFilter;
    return matchSearch && matchCourse;
  });

  const thisMonth = certificates.filter((c) =>
    c.issuedAt.startsWith(new Date().toISOString().slice(0, 7))
  ).length;

  const avgProgress = certificates.length
    ? Math.round(
        certificates.reduce((acc, c) => acc + c.progressPercent, 0) /
          certificates.length
      )
    : 0;

  const pendingPayments = payments.filter((p) => !p.certIssued).length;

  const hasFilters = search || courseFilter || dateFilter;

  const exportCSV = () => {
    const headers = ["Aluno", "Email", "Curso", "Progresso", "Data", "Código"];
    const rows = filteredCerts.map((c) => [
      c.studentName,
      c.studentEmail,
      c.courseName,
      c.progressPercent + "%",
      c.issuedAt,
      c.certificateCode,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificados-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPaymentsCSV = () => {
    const headers = ["Aluno", "Email", "Curso", "Pedido Kiwify", "Data Pagamento", "Cert. Emitido"];
    const rows = filteredPayments.map((p) => [
      p.studentName,
      p.studentEmail,
      p.courseName,
      p.kiwifyOrderId || "",
      p.paidAt ? new Date(p.paidAt).toLocaleDateString("pt-BR") : "",
      p.certIssued ? "Sim" : "Não",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pagamentos-cert-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Certificados</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {certificates.length} certificado{certificates.length !== 1 ? "s" : ""}{" "}
            emitido{certificates.length !== 1 ? "s" : ""} no total
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={activeTab === "issued" ? exportCSV : exportPaymentsCSV}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-3xl font-bold text-foreground">{certificates.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Certificados emitidos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-3xl font-bold text-foreground">{thisMonth}</p>
          <p className="text-sm text-muted-foreground mt-1">Este mês</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-3xl font-bold text-foreground">
            {avgProgress ? avgProgress + "%" : "—"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Progresso médio</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-3xl font-bold text-foreground">{payments.length}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Pagamentos{pendingPayments > 0 && <span className="ml-1 text-amber-500">({pendingPayments} pendentes)</span>}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("issued")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "issued"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Award className="h-4 w-4" />
          Emitidos
          {certificates.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
              {certificates.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "payments"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Pagamentos Kiwify
          {pendingPayments > 0 && (
            <span className="bg-amber-500/10 text-amber-600 text-xs px-1.5 py-0.5 rounded-full">
              {pendingPayments} pendentes
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={courseFilter} onValueChange={(v) => setCourseFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os cursos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos os cursos</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.title}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeTab === "issued" && (
          <Input
            type="month"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-[180px]"
          />
        )}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setCourseFilter("");
              setDateFilter("");
            }}
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      {/* Table — Certificados Emitidos */}
      {activeTab === "issued" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCerts.length === 0 ? (
            <div className="text-center py-16">
              <Award className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                Nenhum certificado encontrado
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Os certificados aparecem quando os alunos completam 100% do curso após 7
                dias da matrícula
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Data emissão</TableHead>
                  <TableHead>Código</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCerts.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm shrink-0">
                          {cert.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {cert.studentName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {cert.studentEmail}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {cert.courseName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${cert.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {cert.progressPercent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(cert.issuedAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {cert.certificateCode}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(cert.certificateCode);
                            toast.success("Código copiado!");
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          title="Copiar código"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredCerts.length > 0 && (
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
              Mostrando {filteredCerts.length} de {certificates.length} certificado
              {certificates.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* Table — Pagamentos de Certificação */}
      {activeTab === "payments" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {paymentsLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                Nenhum pagamento de certificação encontrado
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Os pagamentos aparecem aqui quando o webhook da Kiwify é recebido
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Pedido Kiwify</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm shrink-0">
                          {p.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {p.studentName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.studentEmail}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {p.courseName}
                    </TableCell>
                    <TableCell>
                      {p.kiwifyOrderId ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {p.kiwifyOrderId}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {p.certIssued ? (
                        <Badge variant="secondary" className="gap-1 text-green-700 bg-green-100 border-green-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Emitido
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredPayments.length > 0 && (
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
              Mostrando {filteredPayments.length} de {payments.length} pagamento
              {payments.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
