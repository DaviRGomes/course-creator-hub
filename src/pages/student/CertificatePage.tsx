import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, ShoppingCart, Lock } from "lucide-react";

interface CertificateSettings {
  platformName: string;
  instructorName: string;
  instructorTitle: string;
  message: string;
  primaryColor: string;
  logoUrl: string;
}

const DEFAULT_SETTINGS: CertificateSettings = {
  platformName: "Conexões Sociais",
  instructorName: "Instrutor",
  instructorTitle: "Instrutor do Curso",
  message: "Por ter concluído com êxito todas as aulas e atividades, demonstrando dedicação e comprometimento com o aprendizado.",
  primaryColor: "#22c55e",
  logoUrl: "",
};

const CertificatePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { name, email } = useAuth();

  const settings: CertificateSettings = (() => {
    try {
      const saved = localStorage.getItem("certificate_settings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  })();

  const accent = settings.primaryColor || "#22c55e";

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then((r) => r.data.data ?? r.data),
  });

  const { data: certStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ["cert-status", courseId],
    queryFn: () =>
      api.get(`/student/courses/${courseId}/certificate-status`).then((r) => r.data.data ?? r.data),
    enabled: !!courseId,
  });

  const isLoading = loadingCourse || loadingStatus;

  const studentName = name || email?.split("@")[0] || "Aluno";
  const initial = studentName.charAt(0).toUpperCase();
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] rounded-2xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Certificado não disponível.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard")}>
          Voltar ao painel
        </Button>
      </div>
    );
  }

  // Gate: certificação paga obrigatória e ainda não paga
  if (certStatus?.certificationRequired && !certStatus?.certificationPaid) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Certificado bloqueado</h2>
          <p className="text-muted-foreground">
            Para emitir o certificado de{" "}
            <span className="font-medium text-foreground">{course.title}</span>, é necessário
            adquirir a certificação.
          </p>
        </div>
        {certStatus?.purchaseUrl ? (
          <Button
            size="lg"
            className="gap-2"
            style={{ backgroundColor: accent, borderColor: accent, color: "#fff" }}
            onClick={() => window.open(certStatus.purchaseUrl, "_blank")}
          >
            <ShoppingCart className="h-5 w-5" />
            Comprar Certificação
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Entre em contato com o suporte para adquirir a certificação.
          </p>
        )}
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          Voltar ao painel
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Controls — hidden on print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </button>
        <Button
          onClick={() => window.print()}
          className="gap-2"
          style={{ backgroundColor: accent, borderColor: accent, color: "#fff" }}
        >
          <Download className="h-4 w-4" />
          Baixar PDF
        </Button>
      </div>

      {/* CERTIFICATE */}
      <div
        id="certificate"
        className="relative max-w-4xl mx-auto overflow-hidden"
        style={{
          borderRadius: "16px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          aspectRatio: "16/9",
        }}
      >
        {/* Accent gradient overlay on right side */}
        <div
          className="absolute top-0 right-0 w-1/3 h-full pointer-events-none"
          style={{
            background: `linear-gradient(180deg, ${accent}30 0%, ${accent}08 50%, transparent 100%)`,
          }}
        />

        {/* Top accent bar */}
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accent}00 70%)` }}
        />

        {/* Left accent bar */}
        <div
          className="absolute top-0 left-0 w-1 h-full"
          style={{ background: `linear-gradient(180deg, ${accent}, ${accent}00 60%)` }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8 md:p-12">
          {/* Top section */}
          <div>
            {/* Title */}
            <div className="mb-8">
              <h1
                className="text-3xl md:text-5xl font-bold tracking-wide uppercase"
                style={{ color: accent, letterSpacing: "0.15em" }}
              >
                Certificado
              </h1>
              <p className="text-xl md:text-2xl font-light text-slate-300 tracking-wider uppercase mt-1">
                de Conclusão
              </p>
            </div>

            {/* Student info */}
            <div className="flex items-center gap-4 mb-6">
              {/* Avatar initial */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
                style={{
                  backgroundColor: "#334155",
                  color: "#94a3b8",
                  border: "2px solid #475569",
                }}
              >
                {initial}
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold text-white uppercase tracking-wide">
                  {studentName}
                </p>
                <p className="text-sm text-slate-400">
                  {settings.message}
                </p>
              </div>
            </div>

            {/* Date */}
            <p className="text-xs text-slate-500 mb-8">
              Finalizado em {today}
            </p>

            {/* Platform label + Course title */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                {settings.platformName}_
              </p>
              <h2 className="text-xl md:text-3xl font-extrabold text-white uppercase leading-tight">
                {course.title}
              </h2>
            </div>
          </div>

          {/* Bottom section */}
          <div className="flex items-end justify-between mt-auto pt-6">
            {/* Logo / Platform name */}
            <div>
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="h-8 object-contain opacity-80"
                />
              ) : (
                <p className="text-lg font-bold text-slate-500 tracking-wider lowercase">
                  {settings.platformName}
                </p>
              )}
            </div>

            {/* Signatures */}
            <div className="flex items-end gap-8">
              <div className="text-center">
                {/* Signature line SVG */}
                <svg width="80" height="24" viewBox="0 0 80 24" className="mx-auto mb-1">
                  <path
                    d="M5,18 C15,4 25,20 35,10 C45,0 55,16 65,8 C70,5 75,12 78,10"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="h-px w-20 bg-slate-600 mb-1" />
                <p className="text-xs font-semibold text-slate-300">{settings.instructorName}</p>
                <p className="text-[10px] text-slate-500 italic">{settings.instructorTitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative circle stamp (top right) */}
        <div
          className="absolute top-6 right-6 md:top-10 md:right-10 pointer-events-none"
          style={{ opacity: 0.08 }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="55" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="60" cy="60" r="45" fill="none" stroke="white" strokeWidth="1" />
            <text
              x="60"
              y="55"
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="bold"
              letterSpacing="2"
            >
              CERTIFICADO
            </text>
            <text x="60" y="70" textAnchor="middle" fill="white" fontSize="8" letterSpacing="1">
              APROVADO
            </text>
          </svg>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate {
            position: fixed; top: 0; left: 0;
            width: 100vw; height: 100vh;
            max-width: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CertificatePage;
