import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface FinancialReport {
  totalSales: number;
  totalRevenue: number;
  totalRefunded: number;
  netRevenue: number;
  avgTicket: number;
  refundCount: number;
  salesByCourse: Record<string, number>;
  salesByDay: Record<string, number>;
  orders: Order[];
  period: { start: string; end: string };
}

interface Order {
  created_at: string;
  status: string;
  product_price: number;
  customer?: { name: string; email: string };
  product?: { name: string };
}

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <div className="border border-border rounded-xl p-4 bg-card">
    <p className={`text-2xl font-bold ${color ?? "text-foreground"}`}>{value}</p>
    <p className="text-sm text-muted-foreground mt-1">{label}</p>
  </div>
);

const FinancialPage = () => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [applied, setApplied] = useState({ start: firstOfMonth, end: today.toISOString().slice(0, 10) });

  const { data: report, isLoading, isError, error } = useQuery<FinancialReport>({
    queryKey: ["financial-report", applied.start, applied.end],
    queryFn: () =>
      api
        .get(`/admin/financial/report?startDate=${applied.start}&endDate=${applied.end}`)
        .then((r) => r.data.data),
    retry: false,
  });

  const exportCSV = () => {
    if (!report?.orders?.length) return;
    const headers = ["Data", "Cliente", "Email", "Produto", "Valor", "Status"];
    const rows = report.orders.map((o) => [
      o.created_at?.substring(0, 10) ?? "",
      o.customer?.name ?? "",
      o.customer?.email ?? "",
      o.product?.name ?? "",
      `R$ ${(o.product_price / 100).toFixed(2)}`,
      o.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vendas-${applied.start}-${applied.end}.csv`;
    a.click();
  };

  const salesByDayData = report
    ? Object.entries(report.salesByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, vendas: count }))
    : [];

  const salesByCourseData = report
    ? Object.entries(report.salesByCourse)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([course, count]) => ({
          course: course.length > 20 ? course.slice(0, 20) + "…" : course,
          vendas: count,
        }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Financeiro</h1>
        <button
          onClick={exportCSV}
          disabled={!report?.orders?.length}
          className="flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm disabled:opacity-40"
        >
          📥 Exportar CSV
        </button>
      </div>

      {/* Filtro */}
      <div className="flex gap-3 items-center flex-wrap">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
        />
        <span className="text-muted-foreground text-sm">até</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
        />
        <button
          onClick={() => setApplied({ start: startDate, end: endDate })}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm"
        >
          Filtrar
        </button>
      </div>

      {/* Erro ao carregar relatório */}
      {isError && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-6 text-center">
          <p className="text-amber-700 font-medium">Erro ao carregar relatório</p>
          <p className="text-amber-600 text-sm mt-1">
            {(error as any)?.response?.data?.message || "Verifique se há dados de venda registrados no período selecionado."}
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* Cards de resumo */}
      {report && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Receita líquida"
              value={fmt(report.netRevenue)}
              color="text-green-600"
            />
            <StatCard label="Vendas aprovadas" value={String(report.totalSales)} />
            <StatCard label="Ticket médio" value={fmt(report.avgTicket)} />
            <StatCard
              label={`Reembolsos (${fmt(report.totalRefunded)})`}
              value={String(report.refundCount)}
              color="text-destructive"
            />
          </div>

          {/* Gráfico vendas por dia */}
          {salesByDayData.length > 0 && (
            <div className="border border-border rounded-xl p-6 bg-card">
              <h3 className="font-semibold mb-4 text-foreground">Vendas por dia</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={salesByDayData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v) => [v, "Vendas"]}
                    labelFormatter={(l) => `Dia: ${l}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="vendas"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfico por produto */}
          {salesByCourseData.length > 0 && (
            <div className="border border-border rounded-xl p-6 bg-card">
              <h3 className="font-semibold mb-4 text-foreground">Vendas por produto</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={salesByCourseData}>
                  <XAxis dataKey="course" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, "Vendas"]} />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabela de pedidos */}
          {report.orders.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground">
                  Pedidos aprovados ({report.orders.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr className="text-left text-muted-foreground text-xs">
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report.orders.slice(0, 50).map((o, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground">
                          {o.created_at?.substring(0, 10) ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{o.customer?.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {o.customer?.email ?? ""}
                          </div>
                        </td>
                        <td className="px-4 py-3">{o.product?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {fmt(o.product_price / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {report.orders.length > 50 && (
                  <p className="px-4 py-3 text-xs text-muted-foreground">
                    Mostrando 50 de {report.orders.length} pedidos. Exporte o CSV para ver todos.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialPage;
