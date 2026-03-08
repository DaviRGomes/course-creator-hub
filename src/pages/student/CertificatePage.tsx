import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download } from "lucide-react";

interface CertificateSettings {
  platformName: string;
  instructorName: string;
  instructorTitle: string;
  message: string;
  primaryColor: string;
  logoUrl: string;
}

const DEFAULT_SETTINGS: CertificateSettings = {
  platformName: "Plataforma de Cursos",
  instructorName: "Instrutor",
  instructorTitle: "Instrutor do Curso",
  message: "Por ter concluído com êxito todas as aulas e atividades, demonstrando dedicação e comprometimento com o aprendizado.",
  primaryColor: "#B8860B",
  logoUrl: "",
};

const OrnamentCorner = ({ gold, position }: { gold: string; position: string }) => {
  const flip = {
    "top-left": "",
    "top-right": "scale(-1,1)",
    "bottom-left": "scale(1,-1)",
    "bottom-right": "scale(-1,-1)",
  }[position];

  const posStyle = {
    "top-left": { top: 0, left: 0 },
    "top-right": { top: 0, right: 0 },
    "bottom-left": { bottom: 0, left: 0 },
    "bottom-right": { bottom: 0, right: 0 },
  }[position];

  return (
    <svg
      width="80" height="80" viewBox="0 0 80 80"
      className="absolute pointer-events-none"
      style={posStyle}
    >
      <g transform={flip} style={{ transformOrigin: "40px 40px" }}>
        <path d="M0,0 Q0,30 20,40 Q0,30 0,60" fill="none" stroke={gold} strokeWidth="1.5" opacity="0.6" />
        <path d="M0,0 Q30,0 40,20 Q30,0 60,0" fill="none" stroke={gold} strokeWidth="1.5" opacity="0.6" />
        <circle cx="12" cy="12" r="2" fill={gold} opacity="0.5" />
        <path d="M5,5 L18,18" stroke={gold} strokeWidth="0.5" opacity="0.4" />
      </g>
    </svg>
  );
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

  const gold = settings.primaryColor || "#B8860B";

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then((r) => r.data.data ?? r.data),
  });

  const studentName = name || email?.split("@")[0] || "Aluno";
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
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
          style={{ backgroundColor: gold, borderColor: gold }}
        >
          <Download className="h-4 w-4" />
          Baixar PDF
        </Button>
      </div>

      {/* CERTIFICATE */}
      <div
        id="certificate"
        className="relative max-w-3xl mx-auto bg-card overflow-hidden"
        style={{
          border: `2px solid ${gold}44`,
          borderRadius: "16px",
          boxShadow: `0 0 60px ${gold}15, inset 0 0 60px ${gold}08`,
        }}
      >
        {/* Ornamental corners */}
        <OrnamentCorner gold={gold} position="top-left" />
        <OrnamentCorner gold={gold} position="top-right" />
        <OrnamentCorner gold={gold} position="bottom-left" />
        <OrnamentCorner gold={gold} position="bottom-right" />

        {/* Top decorative strip */}
        <div className="text-center py-4" style={{ borderBottom: `1px solid ${gold}22` }}>
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-10 mx-auto object-contain" />
          ) : (
            <p className="text-xs font-semibold tracking-[0.3em] uppercase" style={{ color: gold }}>
              ✦ {settings.platformName} ✦
            </p>
          )}
        </div>

        {/* Main body */}
        <div className="px-8 md:px-16 py-10 md:py-14 text-center">
          {/* Title */}
          <h1
            className="text-3xl md:text-4xl font-bold tracking-wide"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              color: gold,
            }}
          >
            Certificado de Conclusão
          </h1>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-3 my-6">
            <div className="h-px w-16 md:w-24" style={{ backgroundColor: gold + "44" }} />
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M10,2 L12,8 L18,10 L12,12 L10,18 L8,12 L2,10 L8,8 Z" fill={gold} opacity="0.6" />
            </svg>
            <div className="h-px w-16 md:w-24" style={{ backgroundColor: gold + "44" }} />
          </div>

          {/* Course title */}
          <h2
            className="text-xl md:text-2xl font-semibold text-foreground"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            {course.title}
          </h2>

          {/* Thin line */}
          <div className="h-px w-32 mx-auto my-6" style={{ backgroundColor: gold + "33" }} />

          {/* Awarded to */}
          <p className="text-sm text-muted-foreground mb-1">Conferido a</p>
          <p
            className="text-2xl md:text-3xl font-bold capitalize"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              color: gold,
            }}
          >
            {studentName}
          </p>

          {/* Message */}
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-6 leading-relaxed">
            {settings.message}
          </p>

          {/* Footer */}
          <div className="flex items-end justify-center gap-8 md:gap-16 mt-10 pt-6" style={{ borderTop: `1px solid ${gold}22` }}>
            {/* Date */}
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground mb-1">Data</p>
              <p className="text-xs text-muted-foreground">{today}</p>
              <div className="h-px w-24 mt-2" style={{ backgroundColor: gold + "44" }} />
            </div>

            {/* Central medal */}
            <div className="flex flex-col items-center -mb-1">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke={gold} strokeWidth="1.5" opacity="0.5" />
                <circle cx="24" cy="24" r="15" fill="none" stroke={gold} strokeWidth="0.5" opacity="0.3" />
                <circle cx="24" cy="24" r="10" fill={gold + "15"} stroke={gold} strokeWidth="0.5" opacity="0.4" />
              </svg>
              <p className="text-lg mt-1" style={{ color: gold }}>✦</p>
            </div>

            {/* Signature */}
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground mb-1">Instrutor</p>
              <p className="text-xs text-muted-foreground">{settings.instructorName}</p>
              <div className="h-px w-24 mt-2" style={{ backgroundColor: gold + "44" }} />
              <p className="text-[10px] text-muted-foreground mt-1">{settings.instructorTitle}</p>
            </div>
          </div>
        </div>

        {/* Bottom decorative strip */}
        <div className="text-center py-3" style={{ borderTop: `1px solid ${gold}22` }}>
          <p className="text-xs tracking-[0.5em]" style={{ color: gold + "66" }}>
            ✦ ✦ ✦
          </p>
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
