// Mock data for demo mode

export const mockUsers = [
  { id: "1", name: "João Silva", email: "joao@email.com", role: "STUDENT", active: true },
  { id: "2", name: "Maria Santos", email: "maria@email.com", role: "ADMIN", active: true },
  { id: "3", name: "Pedro Costa", email: "pedro@email.com", role: "STUDENT", active: false },
  { id: "4", name: "Ana Oliveira", email: "ana@email.com", role: "STUDENT", active: true },
  { id: "5", name: "Carlos Lima", email: "carlos@email.com", role: "STUDENT", active: true },
];

export const mockCourses = [
  {
    id: "1",
    title: "Conexões Sociais",
    description: "Aprenda a construir conexões sociais genuínas e fortalecer seus relacionamentos pessoais e profissionais.",
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    slug: "conexoes-sociais",
    active: true,
    modulesCount: 4,
    progress: 65,
  },
  {
    id: "2",
    title: "Comunicação Assertiva",
    description: "Desenvolva habilidades de comunicação assertiva para se expressar com clareza e confiança.",
    thumbnail: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80",
    slug: "comunicacao-assertiva",
    active: true,
    modulesCount: 3,
    progress: 30,
  },
  {
    id: "3",
    title: "Inteligência Emocional",
    description: "Entenda e gerencie suas emoções para uma vida mais equilibrada e produtiva.",
    thumbnail: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&q=80",
    slug: "inteligencia-emocional",
    active: true,
    modulesCount: 5,
    progress: 0,
  },
];

export const mockModules: Record<
  string,
  Array<{
    id: string;
    title: string;
    description: string;
    orderIndex: number;
    videosCount: number;
    activitiesCount: number;
  }>
> = {
  "1": [
    { id: "m0", title: "Apresentação do Curso", description: "Conheça o curso e a instrutora", orderIndex: 0, videosCount: 1, activitiesCount: 0 },
    { id: "m1", title: "Fundamentos das Conexões", description: "Princípios básicos para criar conexões genuínas", orderIndex: 1, videosCount: 3, activitiesCount: 1 },
    { id: "m2", title: "Linguagem Corporal", description: "Como usar a linguagem corporal a seu favor", orderIndex: 2, videosCount: 4, activitiesCount: 1 },
    { id: "m3", title: "Networking Estratégico", description: "Construa uma rede de contatos poderosa", orderIndex: 3, videosCount: 3, activitiesCount: 1 },
  ],
  "2": [
    { id: "m4", title: "Introdução à Comunicação", description: "Princípios fundamentais", orderIndex: 0, videosCount: 3, activitiesCount: 1 },
    { id: "m5", title: "Escuta Ativa", description: "Aprenda a ouvir de verdade", orderIndex: 1, videosCount: 4, activitiesCount: 1 },
    { id: "m6", title: "Feedback Construtivo", description: "Dar e receber feedback", orderIndex: 2, videosCount: 3, activitiesCount: 1 },
  ],
  "3": [
    { id: "m7", title: "Autoconhecimento", description: "Entenda suas emoções", orderIndex: 0, videosCount: 4, activitiesCount: 1 },
    { id: "m8", title: "Empatia", description: "Conecte-se com os outros", orderIndex: 1, videosCount: 3, activitiesCount: 1 },
  ],
};

export const mockVideos: Record<
  string,
  Array<{
    id: string;
    title: string;
    url: string;
    duration: number;
    orderIndex: number;
    sequenceOrder: number;
    muxPlaybackId?: string;
    muxStatus?: string;
  }>
> = {
  m0: [
    { id: "v0", title: "Boas-vindas ao Conexões Sociais", url: "", duration: 191, orderIndex: 0, sequenceOrder: 0 },
  ],
  m1: [
    { id: "v1", title: "O que são conexões genuínas?", url: "", duration: 630, orderIndex: 0, sequenceOrder: 0 },
    { id: "v2", title: "Os 5 pilares do relacionamento", url: "", duration: 495, orderIndex: 1, sequenceOrder: 1 },
    { id: "v3", title: "Barreiras emocionais", url: "", duration: 420, orderIndex: 2, sequenceOrder: 2 },
  ],
  m2: [
    { id: "v4", title: "Introdução à linguagem corporal", url: "", duration: 540, orderIndex: 0, sequenceOrder: 0 },
    { id: "v5", title: "Contato visual e postura", url: "", duration: 480, orderIndex: 1, sequenceOrder: 1 },
    { id: "v6", title: "Gestos e expressões", url: "", duration: 390, orderIndex: 2, sequenceOrder: 2 },
    { id: "v7", title: "Espelhamento", url: "", duration: 350, orderIndex: 3, sequenceOrder: 3 },
  ],
  m3: [
    { id: "v8", title: "O que é networking?", url: "", duration: 600, orderIndex: 0, sequenceOrder: 0 },
    { id: "v9", title: "Eventos e oportunidades", url: "", duration: 450, orderIndex: 1, sequenceOrder: 1 },
    { id: "v10", title: "Mantendo o contato", url: "", duration: 380, orderIndex: 2, sequenceOrder: 2 },
  ],
  m4: [
    { id: "v11", title: "Princípios da comunicação", url: "", duration: 520, orderIndex: 0, sequenceOrder: 0 },
    { id: "v12", title: "Comunicação verbal vs não-verbal", url: "", duration: 440, orderIndex: 1, sequenceOrder: 1 },
    { id: "v13", title: "Tom de voz", url: "", duration: 380, orderIndex: 2, sequenceOrder: 2 },
  ],
};

// Sequences for each module (interleaved videos + quizzes with status)
export const mockSequences: Record<string, Array<{
  id: string;
  title: string;
  type: "VIDEO" | "ACTIVITY";
  duration?: number;
  status: "COMPLETED" | "AVAILABLE" | "LOCKED";
}>> = {
  m0: [
    { id: "v0", title: "Boas-vindas ao Conexões Sociais", type: "VIDEO", duration: 191, status: "COMPLETED" },
  ],
  m1: [
    { id: "v1", title: "O que são conexões genuínas?", type: "VIDEO", duration: 630, status: "COMPLETED" },
    { id: "v2", title: "Os 5 pilares do relacionamento", type: "VIDEO", duration: 495, status: "COMPLETED" },
    { id: "a1", title: "Quiz - Fundamentos", type: "ACTIVITY", status: "COMPLETED" },
    { id: "v3", title: "Barreiras emocionais", type: "VIDEO", duration: 420, status: "COMPLETED" },
  ],
  m2: [
    { id: "v4", title: "Introdução à linguagem corporal", type: "VIDEO", duration: 540, status: "COMPLETED" },
    { id: "v5", title: "Contato visual e postura", type: "VIDEO", duration: 480, status: "AVAILABLE" },
    { id: "v6", title: "Gestos e expressões", type: "VIDEO", duration: 390, status: "LOCKED" },
    { id: "a2", title: "Quiz - Linguagem Corporal", type: "ACTIVITY", status: "LOCKED" },
    { id: "v7", title: "Espelhamento", type: "VIDEO", duration: 350, status: "LOCKED" },
  ],
  m3: [
    { id: "v8", title: "O que é networking?", type: "VIDEO", duration: 600, status: "LOCKED" },
    { id: "v9", title: "Eventos e oportunidades", type: "VIDEO", duration: 450, status: "LOCKED" },
    { id: "a3", title: "Quiz - Networking", type: "ACTIVITY", status: "LOCKED" },
    { id: "v10", title: "Mantendo o contato", type: "VIDEO", duration: 380, status: "LOCKED" },
  ],
  m4: [
    { id: "v11", title: "Princípios da comunicação", type: "VIDEO", duration: 520, status: "AVAILABLE" },
    { id: "v12", title: "Comunicação verbal vs não-verbal", type: "VIDEO", duration: 440, status: "LOCKED" },
    { id: "v13", title: "Tom de voz", type: "VIDEO", duration: 380, status: "LOCKED" },
  ],
};

export const mockMaterials: Record<string, Array<{
  id: string;
  title: string;
  type: string;
  url?: string;
}>> = {
  m1: [
    { id: "mat1", title: "E-book Fundamentos", type: "PDF", url: "#" },
    { id: "mat2", title: "Checklist Conexões", type: "PDF", url: "#" },
  ],
  m2: [
    { id: "mat3", title: "Guia Linguagem Corporal", type: "PDF", url: "#" },
  ],
  m3: [
    { id: "mat4", title: "Template Networking", type: "WORD", url: "#" },
    { id: "mat5", title: "Links Úteis", type: "LINK", url: "#" },
  ],
};

export const mockActivities: Record<
  string,
  Array<{
    id: string;
    title: string;
    description: string;
    sequenceOrder: number;
    passingScore: number;
    questions: Array<{
      id: string;
      questionText: string;
      questionType: string;
      orderIndex: number;
      points: number;
      options: Array<{ optionText: string; isCorrect: boolean; orderIndex: number }>;
    }>;
  }>
> = {
  m1: [
    {
      id: "a1",
      title: "Quiz - Fundamentos",
      description: "Avalie seu conhecimento sobre conexões",
      sequenceOrder: 2,
      passingScore: 70,
      questions: [
        {
          id: "q1",
          questionText: "Qual é o primeiro pilar de um relacionamento saudável?",
          questionType: "MULTIPLE_CHOICE",
          orderIndex: 0,
          points: 10,
          options: [
            { optionText: "Confiança", isCorrect: true, orderIndex: 0 },
            { optionText: "Dinheiro", isCorrect: false, orderIndex: 1 },
            { optionText: "Aparência", isCorrect: false, orderIndex: 2 },
            { optionText: "Status", isCorrect: false, orderIndex: 3 },
          ],
        },
        {
          id: "q2",
          questionText: "Conexões genuínas exigem vulnerabilidade.",
          questionType: "TRUE_FALSE",
          orderIndex: 1,
          points: 10,
          options: [
            { optionText: "Verdadeiro", isCorrect: true, orderIndex: 0 },
            { optionText: "Falso", isCorrect: false, orderIndex: 1 },
          ],
        },
      ],
    },
  ],
  m2: [
    {
      id: "a2",
      title: "Quiz - Linguagem Corporal",
      description: "Teste sobre linguagem corporal",
      sequenceOrder: 3,
      passingScore: 70,
      questions: [],
    },
  ],
  m3: [
    {
      id: "a3",
      title: "Quiz - Networking",
      description: "Teste sobre networking",
      sequenceOrder: 2,
      passingScore: 75,
      questions: [],
    },
  ],
};

// Student-specific mock data
export interface Enrollment {
  courseId: string;
  enrolledAt: string;
  progress: number;
  completedLessons: string[];
  completedActivities: string[];
}

export const mockEnrollments: Enrollment[] = [
  {
    courseId: "1",
    enrolledAt: "2025-12-01",
    progress: 65,
    completedLessons: ["v0", "v1", "v2", "v3", "v4"],
    completedActivities: ["a1"],
  },
  {
    courseId: "2",
    enrolledAt: "2026-01-15",
    progress: 30,
    completedLessons: [],
    completedActivities: [],
  },
  {
    courseId: "3",
    enrolledAt: "2026-03-01",
    progress: 0,
    completedLessons: [],
    completedActivities: [],
  },
];
