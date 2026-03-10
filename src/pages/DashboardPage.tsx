import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users, BookOpen, PlayCircle, Trophy,
  Clock, TrendingUp, UserCheck, Cpu, Activity,
  LayoutDashboard, Terminal, Filter, Search, RefreshCw, AlertTriangle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ─── tipos ────────────────────────────────────────────────────────────────────
interface Stats {
  users:      { total: number; active: number; inactive: number; newThisWeek: number };
  courses:    { total: number; active: number };
  engagement: { videosWatched: number; totalAttempts: number; passedAttempts: number; approvalRate: number };
  server:     { memoryUsedMB: number; memoryMaxMB: number; memoryPercent: number; uptimeMinutes: number; status: string };
}
interface RecentUser {
  id: number; name: string; email: string; createdAt: string; active: boolean;
}
interface RequestLog {
  id: number;
  method: string;
  uri: string;
  userEmail: string;
  userRole: string;
  status: number;
  durationMs: number;
  ip: string;
  createdAt: string;
}
interface TopEndpoint {
  uri: string;
  method: string;
  total: number;
  avgMs: number;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({
  icon: Icon, label, value, sub, colorClass,
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; colorClass: string;
}) => (
  <div className="rounded-xl border bg-card p-5 flex items-start gap-4 shadow-sm">
    <div className={`rounded-lg p-2.5 ${colorClass}`}>
      <Icon className="h-5 w-5 text-primary-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  </div>
);

// ─── MemoryBar ────────────────────────────────────────────────────────────────
const MemoryBar = ({ used, max }: { used: number; max: number }) => {
  const pct = max > 0 ? Math.min(Math.round((used / max) * 100), 100) : 0;
  const barColor = pct > 80 ? "bg-destructive" : pct > 60 ? "bg-amber-500" : "bg-blue-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{used} MB usados de {max} MB</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── formatUptime ─────────────────────────────────────────────────────────────
const formatUptime = (minutes: number) => {
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
};

// ─── DashboardPage ────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { data: stats, isLoading: loadingStats } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/dashboard/stats").then((r) => r.data.data ?? r.data),
    refetchInterval: 30_000,
    retry: false,
  });

  const { data: recentUsers = [], isLoading: loadingUsers } = useQuery<RecentUser[]>({
    queryKey: ["admin-recent-users"],
    queryFn: () => api.get("/admin/dashboard/recent-users").then((r) => r.data.data ?? r.data),
    refetchInterval: 60_000,
    retry: false,
  });

  const [logFilter, setLogFilter]     = useState<"all" | "errors">("all");
  const [emailSearch, setEmailSearch] = useState("");
  const [emailInput, setEmailInput]   = useState("");

  const { data: logs = [], isLoading: loadingLogs, refetch: refetchLogs } = useQuery<RequestLog[]>({
    queryKey: ["admin-logs", logFilter, emailSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (logFilter === "errors") params.set("filter", "errors");
      if (emailSearch) params.set("email", emailSearch);
      const qs = params.toString();
      return api.get(`/admin/dashboard/logs${qs ? `?${qs}` : ""}`)
        .then((r) => r.data.data ?? r.data);
    },
    refetchInterval: 10_000,
    retry: false,
  });

  const { data: topEndpoints = [] } = useQuery<TopEndpoint[]>({
    queryKey: ["admin-top-endpoints"],
    queryFn: () =>
      api.get("/admin/dashboard/logs/top-endpoints")
        .then((r) => r.data.data ?? r.data),
    refetchInterval: 60_000,
    retry: false,
  });

  // dados para gráficos
  const userPie = stats
    ? [
        { name: "Ativos",   value: stats.users.active,   fill: "#22c55e" },
        { name: "Inativos", value: stats.users.inactive, fill: "#ef4444" },
      ]
    : [];

  const activityBar = stats
    ? [
        { name: "Total",      value: stats.engagement.totalAttempts,                                      fill: "#3b82f6" },
        { name: "Aprovados",  value: stats.engagement.passedAttempts,                                     fill: "#22c55e" },
        { name: "Reprovados", value: stats.engagement.totalAttempts - stats.engagement.passedAttempts,    fill: "#ef4444" },
      ]
    : [];

  // ─── helpers de logs ────────────────────────────────────────────────────
  const methodColor = (method: string) => {
    switch (method) {
      case "GET":    return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "POST":   return "bg-green-500/15 text-green-400 border-green-500/30";
      case "PUT":    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "DELETE": return "bg-red-500/15 text-red-400 border-red-500/30";
      default:       return "bg-secondary text-secondary-foreground border-border";
    }
  };

  const statusColor = (status: number) => {
    if (status >= 500) return "bg-red-500/15 text-red-400 border-red-500/30";
    if (status >= 400) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    return "bg-green-500/15 text-green-400 border-green-500/30";
  };

  const formatTime = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  if (loadingStats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-3">
        <Activity className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">Não foi possível carregar as métricas.</p>
        <p className="text-sm text-muted-foreground">Verifique se o back-end está online.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitoramento</h1>
          <p className="text-sm text-muted-foreground">Atualiza automaticamente a cada 30 segundos</p>
        </div>
        <Badge variant={stats.server.status === "UP" ? "default" : "destructive"} className="gap-1.5 w-fit">
          <Activity className="h-3 w-3" />
          Servidor {stats.server.status === "UP" ? "Online" : "Offline"}
        </Badge>
      </div>

      {/* ── Cards principais ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total de Usuários" value={stats.users.total} sub={`${stats.users.newThisWeek} novos esta semana`} colorClass="bg-blue-500" />
        <StatCard icon={UserCheck} label="Usuários Ativos" value={stats.users.active} colorClass="bg-green-500" />
        <StatCard icon={BookOpen} label="Cursos" value={stats.courses.total} sub={`${stats.courses.active} ativos`} colorClass="bg-purple-500" />
        <StatCard icon={PlayCircle} label="Vídeos Assistidos" value={stats.engagement.videosWatched} colorClass="bg-orange-500" />
        <StatCard icon={Trophy} label="Taxa de Aprovação" value={`${stats.engagement.approvalRate}%`} colorClass="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="Tentativas" value={stats.engagement.totalAttempts} sub={`${stats.engagement.passedAttempts} aprovados`} colorClass="bg-sky-500" />
        <StatCard icon={Cpu} label="Memória JVM" value={`${stats.server.memoryPercent}%`} sub={`${stats.server.memoryUsedMB} / ${stats.server.memoryMaxMB} MB`} colorClass={stats.server.memoryPercent > 80 ? "bg-red-500" : "bg-slate-500"} />
        <StatCard icon={Clock} label="Uptime" value={formatUptime(stats.server.uptimeMinutes)} colorClass="bg-indigo-500" />
      </div>

      {/* ── Gráficos ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Pizza: usuários */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Usuários Ativos vs Inativos</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={userPie} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                {userPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip formatter={(v: number, n: string) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
            {userPie.map((e) => (
              <div key={e.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.fill }} />
                {e.name}: {e.value}
              </div>
            ))}
          </div>
        </div>

        {/* Barras: atividades */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Resultado das Atividades</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={activityBar}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => [v, "Tentativas"]} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {activityBar.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Saúde do servidor */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Saúde do Servidor</h2>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Memória (Heap JVM)</p>
            <MemoryBar used={stats.server.memoryUsedMB} max={stats.server.memoryMaxMB} />
          </div>
          <div className="space-y-3">
            {[
              { label: "Status",        value: stats.server.status,                                        highlight: true },
              { label: "Uptime",        value: formatUptime(stats.server.uptimeMinutes),                   highlight: false },
              { label: "Memória livre", value: `${stats.server.memoryMaxMB - stats.server.memoryUsedMB} MB`, highlight: false },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                {highlight ? (
                  <Badge variant={value === "UP" ? "default" : "destructive"}>{value}</Badge>
                ) : (
                  <span className="font-medium text-foreground">{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Últimos usuários ──────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Últimos Usuários Cadastrados</h2>
          <Badge variant="secondary">{recentUsers.length} recentes</Badge>
        </div>

        {loadingUsers ? (
          <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
        ) : recentUsers.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground text-center">Nenhum usuário encontrado.</p>
        ) : (
          <div className="divide-y divide-border">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("pt-BR") : "—"}
                  </span>
                  <Badge variant={u.active ? "default" : "destructive"}>
                    {u.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Seção de Logs ─────────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Cabeçalho da seção */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Logs de Requisições</h2>
            <Badge variant="outline" className="text-xs">ao vivo · 10s</Badge>
          </div>
          <button
            onClick={() => refetchLogs()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => { setLogFilter("all"); setEmailSearch(""); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              logFilter === "all" && !emailSearch
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => { setLogFilter("errors"); setEmailSearch(""); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              logFilter === "errors"
                ? "bg-destructive text-destructive-foreground border-destructive"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            Só Erros
          </button>

          {/* Busca por e-mail */}
          <div className="flex items-center gap-1 border border-border rounded-md overflow-hidden">
            <input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEmailSearch(emailInput);
                  setLogFilter("all");
                }
              }}
              placeholder="Filtrar por e-mail..."
              className="bg-transparent text-xs px-3 py-1.5 text-foreground placeholder:text-muted-foreground outline-none w-48"
            />
            <button
              onClick={() => { setEmailSearch(emailInput); setLogFilter("all"); }}
              className="px-2 py-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            {emailSearch && (
              <button
                onClick={() => { setEmailSearch(""); setEmailInput(""); }}
                className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {emailSearch && (
            <Badge variant="outline" className="text-xs gap-1">
              <Filter className="h-3 w-3" />
              {emailSearch}
            </Badge>
          )}
        </div>

        {/* Tabela de logs */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card border-b border-border z-10">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-20">Horário</th>
                  <th className="text-left px-3 py-3 font-medium text-muted-foreground w-16">Método</th>
                  <th className="text-left px-3 py-3 font-medium text-muted-foreground">Rota</th>
                  <th className="text-left px-3 py-3 font-medium text-muted-foreground hidden md:table-cell">Usuário</th>
                  <th className="text-left px-3 py-3 font-medium text-muted-foreground w-16">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground w-16">Tempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingLogs ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-2.5">
                          <div className="h-4 bg-secondary rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Terminal className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Nenhum log encontrado.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        <span className="text-foreground font-medium">{formatTime(log.createdAt)}</span>
                        <br />
                        <span className="text-[10px]">{formatDate(log.createdAt)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${methodColor(log.method)}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground max-w-xs truncate">
                        {log.uri}
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell">
                        <div>
                          <span className={`text-foreground ${log.userEmail === "anônimo" ? "text-muted-foreground italic" : ""}`}>
                            {log.userEmail}
                          </span>
                          {log.userRole !== "-" && (
                            <span className="ml-1.5 text-[10px] text-muted-foreground">({log.userRole})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${statusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        <span className={log.durationMs > 500 ? "text-amber-400 font-medium" : "text-muted-foreground"}>
                          {log.durationMs}ms
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé da tabela */}
          {logs.length > 0 && (
            <div className="px-4 py-2 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Mostrando {logs.length} log{logs.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-muted-foreground">
                Tempos &gt; 500ms em <span className="text-amber-400">amarelo</span>
              </span>
            </div>
          )}
        </div>

        {/* Top endpoints */}
        {topEndpoints.length > 0 && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm">
                🔥 Top Endpoints — Últimas 24h
              </h3>
            </div>
            <div className="divide-y divide-border">
              {topEndpoints.map((ep, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-muted-foreground text-xs w-4 shrink-0">{i + 1}</span>
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold shrink-0 ${methodColor(ep.method)}`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground flex-1 truncate">{ep.uri}</span>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-foreground font-medium tabular-nums">
                      {ep.total.toLocaleString("pt-BR")} req
                    </span>
                    <span className={`text-xs tabular-nums ${ep.avgMs > 500 ? "text-amber-400" : "text-muted-foreground"}`}>
                      ø {ep.avgMs}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default DashboardPage;
