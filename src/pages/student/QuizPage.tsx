import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const QuizPage = () => {
  const { courseId, moduleId, quizId } = useParams();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then((r) => r.data.data ?? r.data),
  });

  const { data: moduleData } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: () => api.get(`/courses/${courseId}/modules/${moduleId}`).then((r) => r.data.data ?? r.data),
  });

  const { data: activity, isLoading } = useQuery({
    queryKey: ["activity", quizId],
    queryFn: () =>
      api.get(`/courses/${courseId}/modules/${moduleId}/activities/${quizId}`)
        .then((r) => r.data.data ?? r.data),
  });

  const submitMut = useMutation({
    mutationFn: () => {
      const answersPayload = Object.entries(answers).map(([questionId, optionIndex]) => ({
        questionId,
        selectedOptionIndex: optionIndex,
      }));
      return api.post(
        `/courses/${courseId}/modules/${moduleId}/activities/${quizId}/submit`,
        { answers: answersPayload }
      ).then((r) => r.data.data ?? r.data);
    },
    onSuccess: (data) => setResult(data),
    onError: () => {
      // Fallback: calculate locally if submit endpoint not available
      const questions = activity?.questions || [];
      let earned = 0;
      let total = 0;
      questions.forEach((q: any) => {
        total += q.points;
        const selected = answers[q.id];
        if (selected !== undefined && q.options?.[selected]?.isCorrect) {
          earned += q.points;
        }
      });
      const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
      setResult({ earned, total, score: pct, passed: pct >= (activity?.passingScore || 70) });
    },
  });

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
        <Button className="mt-4" onClick={() => navigate(`/learn/${courseId}`)}>Voltar ao curso</Button>
      </div>
    );
  }

  const questions = activity.questions || [];
  const submitted = result !== null;
  const passed = result?.passed ?? false;
  const score = result ? (result.score ?? result.pct ?? 0) : 0;

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(`/learn/${courseId}`)}
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
            <div className={cn("rounded-xl p-5 mb-6 flex items-center gap-4", passed ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20")}>
              {passed ? <CheckCircle2 className="h-8 w-8 text-success shrink-0" /> : <XCircle className="h-8 w-8 text-destructive shrink-0" />}
              <div>
                <p className={cn("font-semibold", passed ? "text-success" : "text-destructive")}>
                  {passed ? "Aprovado!" : "Reprovado"}
                </p>
                <p className="text-sm text-muted-foreground">Pontuação: {score}%</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {questions.map((q: any, qIdx: number) => {
              const selectedOption = answers[q.id];
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
                      const isSelected = selectedOption === oIdx;
                      const showCorrect = submitted && opt.isCorrect;
                      const showWrong = submitted && isSelected && !opt.isCorrect;

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelect(q.id, oIdx)}
                          disabled={submitted}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-lg border text-sm transition-fast",
                            !submitted && isSelected && "border-primary bg-primary/5 text-foreground",
                            !submitted && !isSelected && "border-border hover:border-primary/40 text-foreground",
                            showCorrect && "border-success bg-success/5 text-success",
                            showWrong && "border-destructive bg-destructive/5 text-destructive",
                            submitted && !showCorrect && !showWrong && "border-border text-muted-foreground opacity-60"
                          )}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                          {opt.optionText}
                          {showCorrect && <CheckCircle2 className="inline h-4 w-4 ml-2" />}
                          {showWrong && <XCircle className="inline h-4 w-4 ml-2" />}
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
                Enviar Respostas
              </Button>
            </div>
          )}

          {submitted && (
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => { setAnswers({}); setResult(null); }}>
                Refazer
              </Button>
              <Button onClick={() => navigate(`/learn/${courseId}`)}>
                Voltar ao Curso
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuizPage;
