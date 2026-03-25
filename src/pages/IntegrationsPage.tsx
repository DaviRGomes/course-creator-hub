import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

// ─── tipos ───────────────────────────────────────────────────────────────────

interface IntegrationStatus {
  kiwifyConnected: boolean;
  kiwifyAccountId: string | null;
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
        className={`text-xs px-3 py-1 rounded-full font-medium ${
          connected
            ? "bg-green-100 text-green-700"
            : "bg-muted text-muted-foreground"
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

// ─── Kiwify ──────────────────────────────────────────────────────────────────

const KiwifyCard = ({ status }: { status: IntegrationStatus | undefined }) => {
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setSecret] = useState("");
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status) {
      setAccountId(status.kiwifyAccountId || "");
      if (status.kiwifyConnected) setClientId("***configurado***");
    }
  }, [status]);

  const save = async () => {
    setLoading(true);
    try {
      await api.put("/admin/integrations/kiwify", { clientId, clientSecret, accountId });
      await queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Kiwify salvo!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IntegrationCard
      icon="🛒"
      title="Kiwify"
      description="Relatório financeiro de vendas e reembolsos"
      connected={!!status?.kiwifyConnected}
    >
      <div className="space-y-3">
        <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
          <p className="font-medium mb-1">Como obter as credenciais:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Acesse Kiwify → Apps → API</li>
            <li>Clique em "Criar API Key"</li>
            <li>Copie o Client ID, Client Secret e Account ID</li>
          </ol>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Client ID</label>
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="seu-client-id"
            className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm bg-background"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Client Secret</label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={status?.kiwifyConnected ? "●●●●●●●● (já configurado — deixe vazio para manter)" : "seu-client-secret"}
            className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Expira em 96h — o sistema renova automaticamente
          </p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Account ID</label>
          <input
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="seu-account-id"
            className="w-full border border-border rounded-lg px-3 py-2 mt-1 text-sm bg-background"
          />
        </div>
        <SaveButton onClick={save} loading={loading} />
      </div>
    </IntegrationCard>
  );
};

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
  const [productName, setProductName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const add = async () => {
    if (!productName.trim() || !courseId) {
      toast.error("Preencha o nome do produto e selecione o curso.");
      return;
    }
    setAdding(true);
    try {
      await api.post("/admin/integrations/product-mapping", {
        productName: productName.trim(),
        courseId: Number(courseId),
      });
      setProductName("");
      setCourseId("");
      await queryClient.invalidateQueries({ queryKey: ["product-mapping"] });
      toast.success("Mapeamento adicionado!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao adicionar");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: number) => {
    setRemovingId(id);
    try {
      await api.delete(`/admin/integrations/product-mapping/${id}`);
      await queryClient.invalidateQueries({ queryKey: ["product-mapping"] });
      toast.success("Mapeamento removido!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao remover");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <IntegrationCard
      icon="🔗"
      title="Produtos → Cursos"
      description="Define qual curso cada produto da Kiwify libera"
      connected={!!mappings?.length}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Quando um aluno comprar na Kiwify, o sistema identifica o produto e matricula
          automaticamente no curso correspondente.
        </p>

        {/* Tabela de mapeamentos existentes */}
        {mappingsError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            ⚠️ Erro ao carregar mapeamentos: {mappingsError.message}
          </div>
        ) : mappings === undefined ? (
          <div className="text-sm text-muted-foreground text-center py-3">Carregando...</div>
        ) : mappings.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
            Nenhum mapeamento configurado ainda.<br />
            Adicione abaixo para ativar a matrícula automática.
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left text-muted-foreground text-xs">
                  <th className="px-3 py-2">Produto na Kiwify</th>
                  <th className="px-3 py-2">Curso liberado</th>
                  <th className="px-3 py-2 w-24 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mappings.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-xs text-foreground">{m.productName}</td>
                    <td className="px-3 py-2 text-sm text-foreground">{m.courseTitle}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => remove(m.id)}
                        disabled={removingId === m.id}
                        className="text-destructive hover:underline text-xs disabled:opacity-50"
                      >
                        {removingId === m.id ? "Removendo..." : "Remover"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground">
              {mappings.length} mapeamento{mappings.length !== 1 ? "s" : ""} ativo{mappings.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* Formulário para adicionar novo mapeamento */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Adicionar novo mapeamento</p>
          <div className="flex gap-2">
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Nome exato do produto na Kiwify"
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background"
            />
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-background min-w-[160px]"
            >
              <option value="">Selecionar curso</option>
              {courses?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <button
              onClick={add}
              disabled={adding || !productName.trim() || !courseId}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm whitespace-nowrap disabled:opacity-50"
            >
              {adding ? "Adicionando..." : "+ Adicionar"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            ⚠️ O nome deve ser idêntico ao cadastrado na Kiwify (acentos e maiúsculas importam)
          </p>
        </div>
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

      <KiwifyCard status={status} />
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
