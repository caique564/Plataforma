/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, EvaluationQuestion, PerformanceDiagnosis, StudyLevel } from "../types";

export async function explainSubject(subject: string, level: StudyLevel): Promise<string> {
  const response = await fetch("/api/gemini/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, level }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Falha ao gerar explicação inicial do assunto.");
  }
  const data = await response.json();
  return data.text;
}

export async function sendChatMessage(
  messages: { role: "user" | "model"; text: string }[],
  subject: string,
  level: StudyLevel
): Promise<string> {
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, subject, level }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Falha ao obter resposta do tutor.");
  }
  const data = await response.json();
  return data.text;
}

export interface EvaluationResponse {
  questions: EvaluationQuestion[];
}

export async function generateEvaluation(params: {
  subject: string;
  level: StudyLevel;
  numQuestions: number;
  difficulty: "fácil" | "médio" | "difícil" | "escaldante";
  numOpenQuestions: number;
}): Promise<EvaluationQuestion[]> {
  const response = await fetch("/api/gemini/generate-evaluation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Falha ao gerar avaliação.");
  }
  const data = await response.json();
  return data.questions || [];
}

export interface GradeResponse {
  score: number;
  status: "correct" | "partial" | "incorrect";
  feedback: string;
}

export async function gradeEssayQuestion(params: {
  questionText: string;
  userAnswer: string;
  idealCriteria?: string;
  explanation?: string;
  subject: string;
  level: StudyLevel;
}): Promise<GradeResponse> {
  const response = await fetch("/api/gemini/grade-essay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Falha ao avaliar resposta dissertativa.");
  }
  return response.json();
}

export async function analyzePerformance(
  subject: string,
  level: StudyLevel,
  performanceData: any[]
): Promise<PerformanceDiagnosis> {
  const response = await fetch("/api/gemini/analyze-performance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, level, performanceData }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Falha ao gerar diagnóstico final.");
  }
  return response.json();
}
