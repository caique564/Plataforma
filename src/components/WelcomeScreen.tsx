import React, { useState } from "react";
import { StudyLevel } from "../types";
import { BookOpen, GraduationCap, ArrowRight, Lightbulb, Compass, Award } from "lucide-react";

interface WelcomeScreenProps {
  onSubmit: (subject: string, level: StudyLevel) => void;
  isLoading: boolean;
}

const LEVEL_INFO: Record<StudyLevel, { label: string; desc: string; icon: React.ReactNode }> = {
  Iniciante: {
    label: "Iniciante",
    desc: "Introduções simples, analogias fáceis e termos explicados do zero.",
    icon: <Compass className="w-5 h-5 text-sky-500" />,
  },
  Intermediário: {
    label: "Intermediário",
    desc: "Explicações equilibradas, aprofundamento moderado e exemplos práticos mais complexos.",
    icon: <BookOpen className="w-5 h-5 text-blue-500" />,
  },
  Avançado: {
    label: "Avançado",
    desc: "Fórmulas, termos técnicos precisos, análise aprofundada e debates avançados.",
    icon: <Award className="w-5 h-5 text-indigo-500" />,
  },
  Técnico: {
    label: "Técnico",
    desc: "Foco em aplicações práticas de mercado de trabalho, normas e resoluções operacionais.",
    icon: <Lightbulb className="w-5 h-5 text-emerald-500" />,
  },
  Superior: {
    label: "Superior",
    desc: "Rigor científico/acadêmico, citações conceituais teóricas e jargão formal universitário.",
    icon: <GraduationCap className="w-5 h-5 text-violet-500" />,
  },
};

const SAMPLE_SUBJECTS = [
  "Cálculo Diferencial e Integral",
  "História da Revolução Industrial",
  "Estruturas de Dados em C++",
  "Princípios de Economia e Macroeconomia",
  "Fotossíntese e Ciclos Biogeoquímicos",
  "Design Patterns e Arquitetura de Software",
];

export default function WelcomeScreen({ onSubmit, isLoading }: WelcomeScreenProps) {
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState<StudyLevel>("Iniciante");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    onSubmit(subject.trim(), level);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-fade-in" id="welcome-screen">
      <div className="text-center mb-10">
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-xs font-semibold tracking-wide uppercase inline-block mb-4">
          Tutor de Inteligência Artificial
        </span>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
          O que você deseja <span className="text-blue-600 dark:text-blue-400">estudar</span> hoje?
        </h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Digite qualquer tema científico, profissional ou acadêmico. Nossa IA criará explicações sob medida e avaliações completas de aprendizado.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Subject Field */}
          <div>
            <label htmlFor="subject-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Assunto ou Matéria de Estudo
            </label>
            <div className="relative">
              <input
                id="subject-input"
                type="text"
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ex: Introdução à Física Quântica, Inteligência Artificial na Medicina, Segunda Guerra..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Quick Suggestions */}
            <div className="mt-3">
              <span className="text-xs text-slate-400 dark:text-slate-500 mr-2 font-medium">Sugestões:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {SAMPLE_SUBJECTS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setSubject(sample)}
                    disabled={isLoading}
                    className="text-xs bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full transition-colors font-medium border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Level Field */}
          <div>
            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Qual é seu nível atual de entendimento sobre este assunto?
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3" role="radiogroup">
              {(Object.keys(LEVEL_INFO) as StudyLevel[]).map((lvl) => {
                const isSelected = level === lvl;
                const info = LEVEL_INFO[lvl];
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    disabled={isLoading}
                    aria-checked={isSelected}
                    role="radio"
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all h-full ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/55 dark:bg-blue-950/20 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {info.icon}
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{info.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                      {info.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="start-study-btn"
            type="submit"
            disabled={isLoading || !subject.trim()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Preparando material de estudos...</span>
              </div>
            ) : (
              <>
                <span>Iniciar Trilha de Estudos</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
