import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Award, CheckCircle2, Clock, Lock, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CertificateStatus {
  available: boolean;
  progressPercent: number;
  progressOk: boolean;
  daysOk: boolean;
  daysEnrolled: number;
  daysRemaining: number;
  unlocksAtDate: string;
}

interface Props {
  courseId: number;
  compact?: boolean;
}

const CertificateStatusCard = ({ courseId, compact = false }: Props) => {
  const navigate = useNavigate();

  const { data: certStatus, isLoading } = useQuery<CertificateStatus>({
    queryKey: ["certificate-status", courseId],
    queryFn: () =>
      api
        .get(`/student/courses/${courseId}/certificate-status`)
        .then((r) => r.data.data ?? r.data),
    enabled: !!courseId,
  });

  if (isLoading || !certStatus) return null;

  if (compact) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Certificado</span>
          </div>
          {certStatus.available && (
            <Badge className="bg-success/10 text-success border-success/20 text-xs">
              Disponível
            </Badge>
          )}
        </div>

        {certStatus.available ? (
          <Button
            size="sm"
            className="w-full mt-1 gap-2"
            onClick={() => navigate(`/certificate/${courseId}`)}
          >
            <Award className="h-4 w-4" />
            Emitir Certificado
          </Button>
        ) : (
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {certStatus.progressOk ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span>Progresso: {certStatus.progressPercent}% / 70%</span>
            </div>
            <div className="flex items-center gap-2">
              {certStatus.daysOk ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span>
                {certStatus.daysOk
                  ? `${certStatus.daysEnrolled} dias matriculado ✓`
                  : `Libera em ${certStatus.daysRemaining} dia(s)`}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Certificado</h3>
        </div>
        {certStatus.available && (
          <Badge className="bg-success/10 text-success border-success/20">
            Disponível
          </Badge>
        )}
      </div>

      {certStatus.available ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            🎉 Parabéns! Você atingiu todos os requisitos para emitir seu certificado.
          </p>
          <Button
            className="w-full gap-2"
            onClick={() => navigate(`/certificate/${courseId}`)}
          >
            <Award className="h-4 w-4" />
            Emitir Certificado
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Complete os requisitos abaixo para desbloquear seu certificado:
          </p>

          {/* Progress requirement */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {certStatus.progressOk ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-foreground">Progresso do curso</span>
              </div>
              <span className="text-muted-foreground">
                {certStatus.progressPercent}% / 70%
              </span>
            </div>
            <Progress value={Math.min(certStatus.progressPercent, 100)} className="h-2" />
          </div>

          {/* Days requirement */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {certStatus.daysOk ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-foreground">Tempo de matrícula</span>
            </div>
            <span className="text-muted-foreground">
              {certStatus.daysOk ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {certStatus.daysEnrolled} dias ✓
                </span>
              ) : (
                <span>
                  Libera em {certStatus.daysRemaining} dia(s) — {certStatus.unlocksAtDate}
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateStatusCard;
