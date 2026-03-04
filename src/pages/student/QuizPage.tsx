import { useParams, useNavigate } from "react-router-dom";
import { DEMO_MODE } from "@/lib/config";
import { mockActivities, mockCourses, mockModules } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const QuizPage = () => {
  const { courseId, moduleId, quizId } = useParams();
  const navigate = useNavigate();

  const course = DEMO_MODE ? mockCourses.find((c) => c.id === courseId) : null;
  const moduleData = DEMO_MODE ? (mockModules[courseId!] || []).find((m) => m.id === moduleId) : null;
  const activities = DEMO_MODE ? (mockActivities[moduleId!] || []) : [];
  const activity = activities.find((a) => a.id === quizId);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!activity) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Atividade não encontrada.</p>
        <Button className="mt-4" onClick={() => navigate(`/learn/${courseId}`)}>Voltar ao curso</Button>
      </div>
    );
  }

  const questions = activity.questions || [];

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const getScore = () => {
    let earned = 0;
    let total = 0;
    questions.forEach((q) => {
      total += q.points;
      const selected = answers[q.id];
      if (selected !== undefined && q.options[selected]?.isCorrect) {
        earned += q.points;
      }
    });
    return { earned, total, pct: total > 0 ? Math.round((earned / total) * 100) : 0 };
  };

  const score = submitted ? getScore() : null;
  const passed = score ? score.pct >= activity.passingScore : false;

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
          {/* Result banner */}
          {submitted && score && (
            <div
              className={cn(
                "rounded-xl p-5 mb-6 flex items-center gap-4",
                passed ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"
              )}
            >
              {passed ? (
                <CheckCircle2 className="h-8 w-8 text-success shrink-0" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive shrink-0" />
              )}
              <div>
                <p className={cn("font-semibold", passed ? "text-success" : "text-destructive")}>
                  {passed ? "Aprovado!" : "Reprovado"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Pontuação: {score.earned}/{score.total} ({score.pct}%)
                </p>
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((q, qIdx) => {
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
                    {q.options.map((opt, oIdx) => {
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
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
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
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < questions.length}
              >
                Enviar Respostas
              </Button>
            </div>
          )}

          {submitted && (
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => { setAnswers({}); setSubmitted(false); }}>
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
