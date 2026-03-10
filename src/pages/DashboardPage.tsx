import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users, BookOpen, PlayCircle, Trophy,
  Clock, TrendingUp, UserCheck, Cpu, Activity,
  LayoutDashboard,
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

    </div>
  );
};

export default DashboardPage;
