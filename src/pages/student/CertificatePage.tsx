import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DEMO_MODE } from "@/lib/config";
import { mockCourses, mockEnrollments } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, Download } from "lucide-react";
import { useRef } from "react";

const CertificatePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { email } = useAuth();
  const certRef = useRef<HTMLDivElement>(null);

  const course = DEMO_MODE ? mockCourses.find((c) => c.id === courseId) : null;
  const enrollment = DEMO_MODE ? mockEnrollments.find((e) => e.courseId === courseId) : null;

  if (!course || !enrollment || enrollment.progress < 100) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Certificado não disponível.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard")}>
          Voltar ao painel
        </Button>
      </div>
    );
  }

  const studentName = email?.split("@")[0] || "Aluno";
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao painel
      </button>

      <div className="print:hidden mb-4 flex justify-end">
        <Button onClick={handlePrint} className="gap-2">
          <Download className="h-4 w-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      {/* Certificate */}
      <div
        ref={certRef}
        className="bg-card border-2 border-primary/20 rounded-2xl p-8 md:p-12 max-w-3xl mx-auto text-center print:border-primary print:shadow-none"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Award className="h-8 w-8 text-primary" />
          </div>
        </div>

        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Certificado de Conclusão
        </p>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          {course.title}
        </h1>

        <div className="w-16 h-px bg-border mx-auto mb-6" />

        <p className="text-muted-foreground mb-1">Conferido a</p>
        <p className="text-xl font-semibold text-foreground capitalize mb-6">
          {studentName}
        </p>

        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
          Por ter concluído com êxito todas as aulas e atividades do curso
          <span className="font-medium text-foreground"> {course.title}</span>.
        </p>

        <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">Data</p>
            <p>{today}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="font-medium text-foreground mb-1">Plataforma</p>
            <p>Plataforma de Cursos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePage;
