import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const QuizPage = () => {
  const { slug, moduleId, quizId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [retrying, setRetrying] = useState(false);

  const { data: course } = useQuery({
    queryKey: ["course-by-slug", slug],
    queryFn: () => api.get(`/courses/slug/${slug}`).then((r) => r.data.data ?? r.data),
    enabled: !!slug,
  });

  const courseId = course?.id;

  const { data: moduleData } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: () => api.get(`/courses/${courseId}/modules/${moduleId}`).then((r) => r.data.data ?? r.data),
    enabled: !!courseId,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["activity", quizId],
    queryFn: () =>
      api.get(`/courses/${courseId}/modules/${moduleId}/activities/${quizId}`)
        .then((r) => r.data.data ?? r.data),
    enabled: !!courseId,
  });

  const { data: initialResult, isLoading: resultLoading } = useQuery({
    queryKey: ["quiz-result", quizId],
    queryFn: () =>
      api.get(`/courses/${courseId}/modules/${moduleId}/activities/${quizId}/result`)
        .then((r) => r.data.data ?? r.data)
        .catch(() => null),
    enabled: !!courseId,
  });

  // Sincroniza resultado inicial se existir
  useEffect(() => {
    if (initialResult && !result && !retrying) {
      setResult(initialResult);
      const prevAnswers: Record<string, string> = {};
      initialResult.feedback?.forEach((f: any) => {
        if (f.selectedOptionId) prevAnswers[String(f.questionId)] = String(f.selectedOptionId);
      });
      setAnswers(prevAnswers);
    }
  }, [initialResult, result, retrying]);

  const submitMut = useMutation({
    mutationFn: () => {
      const answersPayload = Object.entries(answers).map(([questionId, optionId]) => ({
        questionId: Number(questionId),
        selectedOptionId: Number(optionId),
      }));
      return api.post(
        `/courses/${courseId}/modules/${moduleId}/activities/${quizId}/submit`,
        { answers: answersPayload }
      ).then((r) => r.data.data ?? r.data);
    },
    onSuccess: (data) => {
      setResult(data);
      setRetrying(false);
      queryClient.invalidateQueries({
        queryKey: ["module-sequence", courseId, Number(moduleId)],
      });
    },
  });

  const isLoading = activityLoading || resultLoading || !courseId;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Atividade não encontrada.</p>
        <Button className="mt-4" onClick={() => navigate(`/learn/${slug}`)}>Voltar ao curso</Button>
      </div>
    );
  }

  const questions = activity.questions || [];
  const submitted = result !== null;
  const passed = result?.passed ?? false;
  const score = result ? (result.score ?? result.pct ?? 0) : 0;

  const handleSelect = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers({ ...answers, [questionId]: optionId });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(`/learn/${slug}`)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-fast mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> {course?.title} — {moduleData?.title}
      </button>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{activity.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
          </div>
          <Badge variant="outline">Mínimo: {activity.passingScore}%</Badge>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">Nenhuma questão cadastrada nesta atividade.</p>
        </div>
      ) : (
        <>
          {submitted && (
            <div className={cn("rounded-xl p-5 mb-6 flex items-center gap-4", passed ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20")}>
              {passed ? <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" /> : <XCircle className="h-8 w-8 text-red-600 shrink-0" />}
              <div>
                <p className={cn("font-semibold", passed ? "text-green-700" : "text-red-700")}>
                  {passed ? "Aprovado!" : "Reprovado"}
                </p>
                <p className="text-sm text-muted-foreground">Pontuação: {score}% (Mínimo: {activity.passingScore}%)</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {questions.map((q: any, qIdx: number) => {
              const feedback = result?.feedback?.find((f: any) => String(f.questionId) === String(q.id));
              const correctOptionId = feedback?.correctOptionId;
              const selectedOptionId = answers[q.id];

              return (
                <div key={q.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-medium text-foreground">
                      <span className="text-muted-foreground mr-2">{qIdx + 1}.</span>
                      {q.questionText}
                    </h3>
                    <span className="text-xs text-muted-foreground shrink-0">{q.points} pts</span>
                  </div>

                  <div className="space-y-2">
                    {(q.options || []).map((opt: any, oIdx: number) => {
                      const isSelected = String(selectedOptionId) === String(opt.id);
                      const isCorrect = String(correctOptionId) === String(opt.id);

                      let optionClasses = "border-border hover:border-primary/40 text-foreground";

                      if (submitted) {
                        if (isCorrect) {
                          // Se a atividade estiver finalizada, a opção que for a correta deve ficar com borda verde e fundo verde suave
                          optionClasses = "border-green-500/50 bg-green-500/10 text-green-700 font-medium";
                        } else if (isSelected) {
                          // Se o usuário tiver selecionado uma opção errada, essa opção deve ficar com borda vermelha
                          optionClasses = "border-red-500/50 bg-red-500/10 text-red-700";
                        } else {
                          optionClasses = "border-border text-muted-foreground opacity-60";
                        }
                      } else if (isSelected) {
                        optionClasses = "border-primary bg-primary/5 text-foreground";
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelect(String(q.id), String(opt.id))}
                          disabled={submitted}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-lg border text-sm transition-fast flex items-center justify-between",
                            optionClasses
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-medium min-w-[20px]">{String.fromCharCode(65 + oIdx)}.</span>
                            {opt.optionText}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {submitted && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Correta" />}
                            {submitted && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-600" aria-label="Sua resposta" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!submitted && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => submitMut.mutate()}
                disabled={Object.keys(answers).length < questions.length || submitMut.isPending}
              >
                {submitMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Enviar Respostas
              </Button>
            </div>
          )}

          {submitted && (
            <div className="mt-6 flex justify-between">
              {!passed && (
                <Button variant="outline" onClick={() => { setAnswers({}); setResult(null); setRetrying(true); }}>
                  Tentar Novamente
                </Button>
              )}
              <div className="flex-1" />
              <Button onClick={() => navigate(`/learn/${slug}`)}>
                {passed ? "✓ Continuar Curso" : "Voltar ao Curso"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuizPage;
