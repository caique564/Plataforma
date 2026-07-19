/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StudyLevel = "Iniciante" | "Intermediário" | "Avançado" | "Técnico" | "Superior";

export interface StudySetup {
  subject: string;
  level: StudyLevel;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface EvaluationQuestion {
  id: string;
  type: "closed" | "open";
  difficulty: "fácil" | "médio" | "difícil";
  text: string;
  options?: string[]; // strictly for 'closed'
  correctOptionIndex?: number; // strictly for 'closed', 0-3
  idealCriteria?: string; // strictly for 'open'
  explanation: string;
  subTopic: string;
}

export interface QuestionAttempt {
  questionId: string;
  userAnswer: string; // for closed: stringified index or text; for open: the user's text
  status: "correct" | "partial" | "incorrect" | "pending";
  score: number; // 0 to 100
  feedback?: string; // For essay questions graded by AI, or closed details
}

export interface PerformanceDiagnosis {
  overallSummary: string;
  strengths: string[];
  reforzamento: string[];
  actionPlan: string[];
}

export interface StudySession {
  id: string;
  subject: string;
  level: StudyLevel;
  createdAt: string;
  introExplanation?: string;
  chatMessages: ChatMessage[];
  evaluationConfig?: {
    numQuestions: number;
    difficulty: "fácil" | "médio" | "difícil" | "escaldante";
    numOpenQuestions: number;
  };
  questions: EvaluationQuestion[];
  attempts: Record<string, QuestionAttempt>; // key is questionId
  quizCompleted: boolean;
  diagnosis?: PerformanceDiagnosis;
}
