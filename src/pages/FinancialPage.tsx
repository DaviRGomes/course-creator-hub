import { useState, useMemo } from "react";
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

interface TopCourse {
  productName: string;
  count: number;
  revenue: number;
  lastBuyerName: string;
  lastBuyerEmail: string;
  lastBuyerAt: string;
  lastBuyerCity: string;
  lastBuyerState: string;
}

interface Order {
  created_at: string;
  status: string;
  product_price: number;
  customer?: { name: string; email: string };
  product?: { name: string };
  payment_method?: string;
  card_type?: string;
  card_last4?: string;
  installments?: number;
  order_ref?: string;
  customer_city?: string;
  customer_state?: string;
}

interface FinancialReport {
  totalSales: number;
  totalRevenue: number;
  totalRefunded: number;
  netRevenue: number;
  avgTicket: number;
  refundCount: number;
  salesByCourse: Record<string, number>;
  salesByDay: Record<string, number>;
  salesByPaymentMethod: Record<string, number>;
  topCourses: TopCourse[];
  availableProducts: string[];
  orders: Order[];
  period: { start: string; end: string };
  activeFilter: string;
}

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (s: string) => s?.substring(0, 10) ?? "—";

const paymentLabel: Record<string, string> = {
  credit_card: "Cartão",
  pix:         "PIX",
  boleto:      "Boleto",
};

const StatCard = ({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) => (
  <div className="border border-border rounded-xl p-4 bg-card">
    <p className={`text-2xl font-bold ${color ?? "text-foreground"}`}>{value}</p>
    <p className="text-sm text-muted-foreground mt-1">{label}</p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

const FinancialPage = () => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [startDate,     setStartDate]     = useState(firstOfMonth);
  const [endDate,       setEndDate]       = useState(today.toISOString().slice(0, 10));
  const [selectedCourse, setSelectedCourse] = useState("");
  const [applied, setApplied] = useState({
    start:   firstOfMonth,
    end:     today.toISOString().slice(0, 10),
    product: "",
  });

  const { data: report, isLoading, isError, error } = useQuery<FinancialReport>({
    queryKey: ["financial-report", applied.start, applied.end, applied.product],
    queryFn: () => {
      const params = new URLSearchParams({
        startDate: applied.start,
        endDate:   applied.end,
      });
      if (applied.product) params.set("productName", applied.product);
      return api
        .get(`/admin/financial/report?${params.toString()}`)
        .then((r) => r.data.data);
    },
    retry: false,
  });

  // Busca mapeamentos configurados para popular o select mesmo sem vendas
  const { data: mappings } = useQuery<{ productName: string; courseTitle: string }[]>({
    queryKey: ["product-mapping"],
    queryFn: () =>
      api.get("/admin/integrations/product-mapping").then((r) => r.data.data ?? []),
  });

  // Combina produtos dos mapeamentos + produtos reais de eventos (sem duplicatas)
  const availableProducts = useMemo(() => {
    const fromMappings = (mappings ?? []).map((m) => m.productName).filter(Boolean);
    const fromEvents   = report?.availableProducts ?? [];
    return [...new Set([...fromMappings, ...fromEvents])].sort();
  }, [mappings, report?.availableProducts]);

  const applyFilter = () =>
    setApplied({ start: startDate, end: endDate, product: selectedCourse });

  const clearCourseFilter = () => {
    setSelectedCourse("");
    setApplied((p) => ({ ...p, product: "" }));
  };

  const exportCSV = () => {
    if (!report?.orders?.length) return;
    const headers = ["Data", "Ref", "Cliente", "Email", "Cidade", "UF", "Produto", "Valor", "Pagamento", "Parcelas"];
    const rows = report.orders.map((o) => [
      fmtDate(o.created_at),
      o.order_ref ?? "",
      o.customer?.name ?? "",
      o.customer?.email ?? "",
      o.customer_city ?? "",
      o.customer_state ?? "",
      o.product?.name ?? "",
      `R$ ${(o.product_price / 100).toFixed(2)}`,
      paymentLabel[o.payment_method ?? ""] ?? o.payment_method ?? "",
      String(o.installments ?? 1),
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
          course: course.length > 22 ? course.slice(0, 22) + "…" : course,
          vendas: count,
        }))
    : [];

  const paymentData = report
    ? Object.entries(report.salesByPaymentMethod || {}).map(([method, count]) => ({
        method: paymentLabel[method] ?? method,
        vendas: count,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-foreground">Financeiro</h1>
        <button
          onClick={exportCSV}
          disabled={!report?.orders?.length}
          className="flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm disabled:opacity-40"
        >
          📥 Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="border border-border rounded-xl p-4 bg-card space-y-3">
        <p className="text-sm font-medium text-foreground">Filtros</p>
        <div className="flex gap-3 items-center flex-wrap">
          {/* Período */}
          <div className="flex gap-2 items-center">
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
          </div>

          {/* Filtro por curso */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background min-w-[180px]"
          >
            <option value="">Todos os cursos</option>
            {availableProducts.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <button
            onClick={applyFilter}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm"
          >
            Filtrar
          </button>

          {applied.product && (
            <button
              onClick={clearCourseFilter}
              className="border border-border px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/50"
            >
              ✕ {applied.product}
            </button>
          )}
        </div>

        {applied.product && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700">
            Exibindo resultados filtrados por: <strong>{applied.product}</strong>
          </div>
        )}
      </div>

      {/* Erro */}
      {isError && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-6 text-center">
          <p className="text-amber-700 font-medium">Erro ao carregar relatório</p>
          <p className="text-amber-600 text-sm mt-1">
            {(error as any)?.response?.data?.message ||
              "Verifique se há dados de venda registrados no período selecionado."}
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

      {report && (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Receita líquida"
              value={fmt(report.netRevenue)}
              color="text-green-600"
            />
            <StatCard label="Vendas aprovadas" value={String(report.totalSales)} />
            <StatCard
              label="Ticket médio"
              value={fmt(report.avgTicket)}
            />
            <StatCard
              label={`Reembolsos (${fmt(report.totalRefunded)})`}
              value={String(report.refundCount)}
              color="text-destructive"
            />
          </div>

          {/* Ranking de cursos mais vendidos */}
          {report.topCourses?.length > 0 && (
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">🏆 Cursos mais vendidos</h3>
                <span className="text-xs text-muted-foreground">{report.topCourses.length} produto{report.topCourses.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50 text-left text-xs font-semibold text-gray-600">
                      <th className="px-4 py-3 w-6">#</th>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3 text-right">Vendas</th>
                      <th className="px-4 py-3 text-right">Receita</th>
                      <th className="px-4 py-3">Último comprador</th>
                      <th className="px-4 py-3">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {report.topCourses.map((c, i) => (
                      <tr
                        key={c.productName}
                        className={`hover:bg-gray-50 ${applied.product === c.productName ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setSelectedCourse(c.productName);
                              setApplied((p) => ({ ...p, product: c.productName }));
                            }}
                            className="font-medium text-primary hover:underline text-left"
                          >
                            {c.productName}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{c.count}</td>
                        <td className="px-4 py-3 text-right text-green-700 font-medium">
                          {fmt(c.revenue)}
                        </td>
                        <td className="px-4 py-3">
                          {c.lastBuyerName ? (
                            <div>
                              <div className="font-medium text-gray-800">{c.lastBuyerName}</div>
                              <div className="text-xs text-muted-foreground">{c.lastBuyerEmail}</div>
                              {(c.lastBuyerCity || c.lastBuyerState) && (
                                <div className="text-xs text-muted-foreground">
                                  {[c.lastBuyerCity, c.lastBuyerState].filter(Boolean).join(" - ")}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {fmtDate(c.lastBuyerAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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

          {/* Gráficos por produto e pagamento lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {salesByCourseData.length > 0 && (
              <div className="border border-border rounded-xl p-6 bg-card">
                <h3 className="font-semibold mb-4 text-foreground">Vendas por produto</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={salesByCourseData}>
                    <XAxis dataKey="course" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, "Vendas"]} />
                    <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {paymentData.length > 0 && (
              <div className="border border-border rounded-xl p-6 bg-card">
                <h3 className="font-semibold mb-4 text-foreground">Meio de pagamento</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={paymentData}>
                    <XAxis dataKey="method" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, "Vendas"]} />
                    <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Tabela de pedidos enriquecida */}
          {report.orders.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Pedidos aprovados ({report.orders.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr className="text-left text-xs font-semibold text-gray-600">
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Localidade</th>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3">Pagamento</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {report.orders.slice(0, 50).map((o, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          <div>{fmtDate(o.created_at)}</div>
                          {o.order_ref && (
                            <div className="text-xs font-mono text-muted-foreground">{o.order_ref}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{o.customer?.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{o.customer?.email || ""}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {[o.customer_city, o.customer_state].filter(Boolean).join(" - ") || "—"}
                        </td>
                        <td className="px-4 py-3">{o.product?.name || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="text-xs">
                            {paymentLabel[o.payment_method ?? ""] ?? o.payment_method ?? "—"}
                          </div>
                          {o.card_type && (
                            <div className="text-xs text-muted-foreground">
                              {o.card_type}
                              {o.card_last4 ? ` ****${o.card_last4}` : ""}
                              {(o.installments ?? 1) > 1 ? ` · ${o.installments}x` : ""}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {fmt(o.product_price / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {report.orders.length > 50 && (
                  <p className="px-4 py-3 text-xs text-muted-foreground border-t border-border">
                    Mostrando 50 de {report.orders.length} pedidos. Exporte o CSV para ver todos.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Sem dados */}
          {report.totalSales === 0 && !isLoading && (
            <div className="border border-dashed border-border rounded-xl p-10 text-center text-muted-foreground">
              <p className="text-4xl mb-3">📊</p>
              <p className="font-medium">Nenhuma venda no período</p>
              <p className="text-sm mt-1">
                {applied.product
                  ? `Nenhuma venda registrada para "${applied.product}" neste período.`
                  : "As vendas aparecerão aqui conforme forem registradas pelo webhook da Kiwify."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialPage;
