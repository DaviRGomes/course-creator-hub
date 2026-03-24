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
  const [testResult, setTestResult] = useState<"ok" | "error" | null>(null);

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
      toast.success("n8n salvo!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const test = async () => {
    try {
      await api.post("/admin/integrations/n8n/test");
      setTestResult("ok");
    } catch {
      setTestResult("error");
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
            onChange={(e) => setWebhookUrl(e.target.value)}
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
            className="border border-border px-4 py-2 rounded-lg text-sm"
          >
            🔌 Testar conexão
          </button>
        </div>
        {testResult && (
          <p className={`text-sm ${testResult === "ok" ? "text-green-600" : "text-destructive"}`}>
            {testResult === "ok"
              ? "✅ Webhook respondeu com sucesso!"
              : "❌ Falha. Verifique a URL e tente novamente."}
          </p>
        )}
      </div>
    </IntegrationCard>
  );
};

// ─── Produtos → Cursos ───────────────────────────────────────────────────────

const ProductMappingCard = ({
  courses,
  mappings,
  refetch,
}: {
  courses: Course[] | undefined;
  mappings: Mapping[] | undefined;
  refetch: () => void;
}) => {
  const [productName, setProductName] = useState("");
  const [courseId, setCourseId] = useState("");

  const add = async () => {
    if (!productName.trim() || !courseId) {
      toast.error("Preencha o nome do produto e selecione o curso.");
      return;
    }
    try {
      await api.post("/admin/integrations/product-mapping", {
        productName: productName.trim(),
        courseId: Number(courseId),
      });
      setProductName("");
      setCourseId("");
      refetch();
      toast.success("Mapeamento adicionado!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao adicionar");
    }
  };

  const remove = async (id: number) => {
    await api.delete(`/admin/integrations/product-mapping/${id}`);
    refetch();
    toast.success("Removido!");
  };

  return (
    <IntegrationCard
      icon="🔗"
      title="Produtos → Cursos"
      description="Define qual curso cada produto da Kiwify libera"
      connected={!!mappings?.length}
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Quando um aluno comprar na Kiwify, o sistema matricula automaticamente
          no curso correspondente.
        </p>

        {mappings && mappings.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left text-muted-foreground text-xs">
                  <th className="px-3 py-2">Produto (Kiwify)</th>
                  <th className="px-3 py-2">Curso</th>
                  <th className="px-3 py-2 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mappings.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 font-mono text-xs">{m.productName}</td>
                    <td className="px-3 py-2 text-sm">{m.courseTitle}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => remove(m.id)}
                        className="text-destructive hover:underline text-xs"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Nome exato do produto na Kiwify"
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background"
          />
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
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
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm whitespace-nowrap"
          >
            + Adicionar
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          ⚠️ Nome deve ser exatamente igual ao da Kiwify (incluindo acentos e maiúsculas)
        </p>
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
            placeholder='Cole o conteúdo do credentials.json aqui...'
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
  const [host, setHost] = useState(status?.smtpHost || "");
  const [port, setPort] = useState<number>(status?.smtpPort || 587);
  const [user, setUser] = useState(status?.smtpUser || "");
  const [fromName, setFromName] = useState(status?.smtpFromName || "");
  const [fromEmail, setFromEmail] = useState(status?.smtpFromEmail || "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await api.put("/admin/integrations/smtp", { host, port, user, fromName, fromEmail });
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

  const { data: mappings, refetch: refetchMappings } = useQuery<Mapping[]>({
    queryKey: ["product-mapping"],
    queryFn: () =>
      api.get("/admin/integrations/product-mapping").then((r) => r.data.data),
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
        refetch={refetchMappings}
      />
      <SheetsCard status={status} />
      <SmtpCard status={status} />
    </div>
  );
};

export default IntegrationsPage;
