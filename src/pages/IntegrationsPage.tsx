import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

// ─── tipos ───────────────────────────────────────────────────────────────────

interface IntegrationStatus {
  n8nWebhookUrl: string | null;
  n8nConnected: boolean;
  sheetsSpreadsheetId: string | null;
  sheetsConnected: boolean;
  smtpHost: string | null;
  smtpPort: number;
  smtpUser: string | null;
  smtpFromName: string | null;
  smtpFromEmail: string | null;
  smtpConnected: boolean;
}

interface Course {
  id: number;
  title: string;
}

interface Mapping {
  id: number;
  productName: string;
  courseId: number;
  courseTitle: string;
}

// ─── componente base do card ─────────────────────────────────────────────────

const IntegrationCard = ({
  icon,
  title,
  description,
  connected,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  connected: boolean;
  children: React.ReactNode;
}) => (
  <div className="border border-border rounded-xl p-6 space-y-4 bg-card">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-xl">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <span
        className={`text-xs px-3 py-1 rounded-full font-medium border ${
          connected
            ? "bg-green-100 text-green-700 border-green-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`}
      >
        {connected ? "● Conectado" : "○ Não configurado"}
      </span>
    </div>
    {children}
  </div>
);

const SaveButton = ({
  onClick,
  loading = false,
}: {
  onClick: () => void;
  loading?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm disabled:opacity-50"
  >
    {loading ? "Salvando..." : "Salvar"}
  </button>
);

// ─── n8n ─────────────────────────────────────────────────────────────────────

const N8nCard = ({ status }: { status: IntegrationStatus | undefined }) => {
  const queryClient = useQueryClient();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "error" | null>(null);
  const [testMessage, setTestMessage] = useState("");

  useEffect(() => {
    if (status) {
      setWebhookUrl(status.n8nWebhookUrl || "");
    }
  }, [status]);

  const save = async () => {
    setLoading(true);
    try {
      await api.put("/admin/integrations/n8n", { webhookUrl, webhookSecret: secret });
      await queryClient.invalidateQueries({ queryKey: ["integrations"] });
      setTestResult(null);
      toast.success("n8n salvo!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post("/admin/integrations/n8n/test");
      setTestResult("ok");
      setTestMessage(res.data?.data || "Webhook respondeu com sucesso!");
    } catch (e: any) {
      setTestResult("error");
      const msg = e.response?.data?.message || "Sem resposta do servidor. Verifique se a URL está correta e o n8n está rodando.";
      setTestMessage(msg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <IntegrationCard
      icon="⚡"
      title="n8n"
      description="Automação de matrículas após compra na Kiwify"
      connected={!!status?.n8nConnected}
    >
      <div className="space-y-3">
        <div>
          <label className="text-sm text-muted-foreground">URL do Webhook</label>
          <input
            value={webhookUrl}
            onChange={(e) => { setWebhookUrl(e.target.value); setTestResult(null); }}
            placeholder="https://n8n.seudominio.com/webhook/kiwify"
            className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm bg-background"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Secret (opcional)</label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Deixe vazio para manter"
            className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm bg-background"
          />
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
          <p className="font-medium mb-1">Como configurar na Kiwify:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Kiwify → Apps → Webhooks → Criar Webhook</li>
            <li>Cole a URL acima</li>
            <li>Selecione: Compra Aprovada, Reembolso</li>
            <li>Salve e clique em "Testar Webhook"</li>
          </ol>
        </div>
        <div className="flex gap-2">
          <SaveButton onClick={save} loading={loading} />
          <button
            onClick={test}
            disabled={testing || !webhookUrl}
            className="border border-border px-4 py-2 rounded-lg text-sm disabled:opacity-50 flex items-center gap-1"
          >
            {testing ? "⏳ Testando..." : "🔌 Testar conexão"}
          </button>
        </div>
        {testResult && (
          <div className={`rounded-lg px-3 py-2 text-sm ${testResult === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-destructive"}`}>
            {testResult === "ok" ? "✅ " : "❌ "}
            {testMessage}
          </div>
        )}
      </div>
    </IntegrationCard>
  );
};

// ─── Produtos → Cursos ───────────────────────────────────────────────────────

const ProductMappingCard = ({
  courses,
  mappings,
  mappingsError,
}: {
  courses: Course[] | undefined;
  mappings: Mapping[] | undefined;
  mappingsError: Error | null;
}) => {
  const queryClient = useQueryClient();
  // Estado local: courseId → productName digitado pelo usuário
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  // Pré-carrega inputs com os valores já salvos no banco
  useEffect(() => {
    if (!mappings || !courses) return;
    const map: Record<number, string> = {};
    courses.forEach((c) => {
      const existing = mappings.find((m) => m.courseId === c.id);
      map[c.id] = existing ? existing.productName : "";
    });
    setInputs(map);
  }, [mappings, courses]);

  const save = async (courseId: number) => {
    setSavingId(courseId);
    try {
      await api.put(`/admin/integrations/product-mapping/course/${courseId}`, {
        productName: inputs[courseId] ?? "",
      });
      await queryClient.invalidateQueries({ queryKey: ["product-mapping"] });
      const name = inputs[courseId]?.trim();
      toast.success(name ? `Produto "${name}" vinculado!` : "Vínculo removido.");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao salvar");
    } finally {
      setSavingId(null);
    }
  };

  const configuredCount = mappings?.length ?? 0;

  return (
    <IntegrationCard
      icon="🔗"
      title="Produtos → Cursos"
      description="Define qual curso cada produto da Kiwify libera"
      connected={configuredCount > 0}
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Para cada curso, informe o nome exato do produto cadastrado na Kiwify.
          Deixe em branco para desativar a matrícula automática daquele curso.
        </p>

        {mappingsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            ⚠️ Erro ao carregar dados: {mappingsError.message}
          </div>
        )}

        {!courses ? (
          <div className="text-sm text-muted-foreground text-center py-4">Carregando cursos...</div>
        ) : courses.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
            Nenhum curso cadastrado ainda. Crie um curso primeiro.
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left text-xs font-semibold text-gray-600">
                  <th className="px-3 py-2 w-1/3">Curso</th>
                  <th className="px-3 py-2">Nome do produto na Kiwify</th>
                  <th className="px-3 py-2 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {courses.map((c) => {
                  const isSaving = savingId === c.id;
                  const currentVal = inputs[c.id] ?? "";
                  const savedVal = mappings?.find((m) => m.courseId === c.id)?.productName ?? "";
                  const isDirty = currentVal !== savedVal;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800 text-xs">{c.title}</td>
                      <td className="px-3 py-2">
                        <input
                          value={currentVal}
                          onChange={(e) => setInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && isDirty && save(c.id)}
                          placeholder="Ex: Conexões Sociais PRO"
                          className="w-full border border-border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => save(c.id)}
                          disabled={isSaving || !isDirty}
                          className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground disabled:opacity-40 whitespace-nowrap"
                        >
                          {isSaving ? "..." : "Salvar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-3 py-2 bg-gray-50 border-t border-border text-xs text-gray-500">
              {configuredCount} de {courses.length} curso{courses.length !== 1 ? "s" : ""} vinculado{configuredCount !== 1 ? "s" : ""}
              {" · "}
              <span className="text-muted-foreground">Nome deve ser idêntico ao da Kiwify (acentos e maiúsculas importam)</span>
            </div>
          </div>
        )}
      </div>
    </IntegrationCard>
  );
};

// ─── Google Sheets ────────────────────────────────────────────────────────────

const SheetsCard = ({ status }: { status: IntegrationStatus | undefined }) => {
  const queryClient = useQueryClient();
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [credentialsJson, setCredentialsJson] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status) {
      setSpreadsheetId(status.sheetsSpreadsheetId || "");
    }
  }, [status]);

  const save = async () => {
    setLoading(true);
    try {
      await api.put("/admin/integrations/sheets", { spreadsheetId, credentialsJson });
      await queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Google Sheets salvo!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IntegrationCard
      icon="📊"
      title="Google Sheets"
      description="Registra dados de venda nas planilhas automaticamente"
      connected={!!status?.sheetsConnected}
    >
      <div className="space-y-3">
        <div>
          <label className="text-sm text-muted-foreground">ID da Planilha</label>
          <input
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm font-mono bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1">
            URL da planilha: docs.google.com/spreadsheets/d/<strong>ID_AQUI</strong>/edit
          </p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">
            Credenciais Service Account (JSON)
          </label>
          <textarea
            value={credentialsJson}
            onChange={(e) => setCredentialsJson(e.target.value)}
            placeholder={status?.sheetsConnected ? "Credenciais já configuradas — cole novamente só para atualizar" : 'Cole o conteúdo do credentials.json aqui...'}
            rows={4}
            className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm font-mono bg-background resize-none"
          />
          {status?.sheetsConnected && (
            <p className="text-xs text-green-600 mt-1">
              ✅ Configurado — cole novamente só para atualizar
            </p>
          )}
        </div>
        <SaveButton onClick={save} loading={loading} />
      </div>
    </IntegrationCard>
  );
};

// ─── SMTP ────────────────────────────────────────────────────────────────────

const SmtpCard = ({ status }: { status: IntegrationStatus | undefined }) => {
  const queryClient = useQueryClient();
  const [host, setHost] = useState("");
  const [port, setPort] = useState<number>(587);
  const [user, setUser] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status) {
      setHost(status.smtpHost || "");
      setPort(status.smtpPort || 587);
      setUser(status.smtpUser || "");
      setFromName(status.smtpFromName || "");
      setFromEmail(status.smtpFromEmail || "");
    }
  }, [status]);

  const save = async () => {
    setLoading(true);
    try {
      await api.put("/admin/integrations/smtp", { host, port, user, fromName, fromEmail });
      await queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("SMTP salvo!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IntegrationCard
      icon="✉️"
      title="Email (SMTP)"
      description="Servidor de email para notificações aos alunos"
      connected={!!status?.smtpConnected}
    >
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
          ⚠️ A senha do SMTP fica configurada no n8n por segurança. Aqui salvamos apenas
          os dados de referência.
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-sm text-muted-foreground">Servidor SMTP</label>
            <input
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="smtp.gmail.com"
              className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Porta</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm bg-background"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-muted-foreground">Usuário</label>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="seu@gmail.com"
              className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Nome remetente</label>
            <input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Plataforma de Cursos"
              className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm bg-background"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Email remetente</label>
          <input
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="noreply@seudominio.com"
            className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm bg-background"
          />
        </div>

        <SaveButton onClick={save} loading={loading} />
      </div>
    </IntegrationCard>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────

const IntegrationsPage = () => {
  const qc = useQueryClient();

  const { data: status } = useQuery<IntegrationStatus>({
    queryKey: ["integrations"],
    queryFn: () => api.get("/admin/integrations").then((r) => r.data.data),
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: () => api.get("/courses").then((r) => r.data.data ?? r.data),
  });

  const { data: mappings, error: mappingsError, refetch: refetchMappings } = useQuery<Mapping[], Error>({
    queryKey: ["product-mapping"],
    queryFn: () =>
      api.get("/admin/integrations/product-mapping").then((r) => r.data.data ?? []),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure as ferramentas que sua plataforma usa para automatizar vendas e comunicação.
        </p>
      </div>

      <N8nCard status={status} />
      <ProductMappingCard
        courses={courses}
        mappings={mappings}
        mappingsError={mappingsError}
      />
      <SheetsCard status={status} />
      <SmtpCard status={status} />
    </div>
  );
};

export default IntegrationsPage;
