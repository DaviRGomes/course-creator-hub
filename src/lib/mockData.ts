// Mock data for demo mode

export const mockUsers = [
  { id: "1", name: "João Silva", email: "joao@email.com", role: "STUDENT", active: true },
  { id: "2", name: "Maria Santos", email: "maria@email.com", role: "ADMIN", active: true },
  { id: "3", name: "Pedro Costa", email: "pedro@email.com", role: "STUDENT", active: false },
  { id: "4", name: "Ana Oliveira", email: "ana@email.com", role: "STUDENT", active: true },
  { id: "5", name: "Carlos Lima", email: "carlos@email.com", role: "STUDENT", active: true },
];

export const mockCourses = [
  { id: "1", title: "Siege Masterclass", description: "Aprenda todas as técnicas avançadas de jogo competitivo. Domine mapas, operadores e estratégias de equipe.", thumbnail: "", active: true, modulesCount: 3 },
  { id: "2", title: "Fundamentos de Design", description: "Curso completo de design thinking e prototipagem. Do conceito ao produto final.", thumbnail: "", active: true, modulesCount: 5 },
  { id: "3", title: "Marketing Digital", description: "Estratégias de marketing para crescimento orgânico e pago.", thumbnail: "", active: false, modulesCount: 2 },
];

export const mockModules: Record<string, Array<{ id: string; title: string; description: string; orderIndex: number; videosCount: number; activitiesCount: number }>> = {
  "1": [
    { id: "m1", title: "Fundamentos", description: "Conceitos básicos", orderIndex: 0, videosCount: 5, activitiesCount: 2 },
    { id: "m2", title: "Técnicas Avançadas", description: "Estratégias para nível alto", orderIndex: 1, videosCount: 4, activitiesCount: 1 },
    { id: "m3", title: "Competitivo", description: "Preparação para torneios", orderIndex: 2, videosCount: 3, activitiesCount: 2 },
  ],
  "2": [
    { id: "m4", title: "Introdução ao Design", description: "Princípios fundamentais", orderIndex: 0, videosCount: 6, activitiesCount: 1 },
    { id: "m5", title: "Prototipagem", description: "Ferramentas e técnicas", orderIndex: 1, videosCount: 4, activitiesCount: 2 },
  ],
  "3": [
    { id: "m6", title: "SEO Básico", description: "Otimização para buscadores", orderIndex: 0, videosCount: 3, activitiesCount: 1 },
  ],
};

export const mockVideos: Record<string, Array<{ id: string; title: string; url: string; duration: number; orderIndex: number }>> = {
  "m1": [
    { id: "v1", title: "Introdução ao Siege", url: "https://youtube.com/watch?v=example1", duration: 630, orderIndex: 0 },
    { id: "v2", title: "Conceitos Básicos", url: "https://youtube.com/watch?v=example2", duration: 495, orderIndex: 1 },
    { id: "v3", title: "Mapas e Posições", url: "https://youtube.com/watch?v=example3", duration: 720, orderIndex: 3 },
    { id: "v4", title: "Operadores Essenciais", url: "https://youtube.com/watch?v=example4", duration: 540, orderIndex: 4 },
    { id: "v5", title: "Comunicação em Equipe", url: "https://youtube.com/watch?v=example5", duration: 390, orderIndex: 5 },
  ],
  "m2": [
    { id: "v6", title: "Peeking Avançado", url: "https://youtube.com/watch?v=example6", duration: 600, orderIndex: 0 },
    { id: "v7", title: "Strats de Ataque", url: "https://youtube.com/watch?v=example7", duration: 480, orderIndex: 1 },
  ],
};

export const mockActivities: Record<string, Array<{
  id: string; title: string; description: string; sequenceOrder: number; passingScore: number;
  questions: Array<{ id: string; questionText: string; questionType: string; orderIndex: number; points: number; options: Array<{ optionText: string; isCorrect: boolean; orderIndex: number }> }>;
}>> = {
  "m1": [
    {
      id: "a1", title: "Quiz - Fundamentos", description: "Avalie seu conhecimento", sequenceOrder: 2, passingScore: 70,
      questions: [
        {
          id: "q1", questionText: "Qual operador tem maior taxa de win no ataque?", questionType: "MULTIPLE_CHOICE", orderIndex: 0, points: 10,
          options: [
            { optionText: "Ash", isCorrect: false, orderIndex: 0 },
            { optionText: "Thermite", isCorrect: true, orderIndex: 1 },
            { optionText: "Sledge", isCorrect: false, orderIndex: 2 },
            { optionText: "Hibana", isCorrect: false, orderIndex: 3 },
          ],
        },
        {
          id: "q2", questionText: "O drone serve apenas para reconhecimento?", questionType: "TRUE_FALSE", orderIndex: 1, points: 10,
          options: [
            { optionText: "Verdadeiro", isCorrect: false, orderIndex: 0 },
            { optionText: "Falso", isCorrect: true, orderIndex: 1 },
          ],
        },
      ],
    },
    {
      id: "a2", title: "Avaliação Final", description: "Prova final do módulo", sequenceOrder: 6, passingScore: 80,
      questions: [],
    },
  ],
  "m2": [
    {
      id: "a3", title: "Quiz Avançado", description: "Teste avançado", sequenceOrder: 2, passingScore: 75,
      questions: [],
    },
  ],
};

// Student-specific mock data
export interface Enrollment {
  courseId: string;
  enrolledAt: string;
  progress: number; // 0-100
  completedLessons: string[]; // video IDs
  completedActivities: string[]; // activity IDs
}

export const mockEnrollments: Enrollment[] = [
  {
    courseId: "1",
    enrolledAt: "2025-12-01",
    progress: 100,
    completedLessons: ["v1", "v2", "v3", "v4", "v5", "v6"],
    completedActivities: ["a1", "a2"],
  },
  {
    courseId: "2",
    enrolledAt: "2026-01-15",
    progress: 10,
    completedLessons: [],
    completedActivities: [],
  },
];
