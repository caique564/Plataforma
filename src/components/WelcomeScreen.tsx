import React, { useState } from "react";
import { StudyLevel } from "../types";
import { 
  BookOpen, 
  GraduationCap, 
  ArrowRight, 
  Lightbulb, 
  Compass, 
  Award, 
  Settings, 
  HelpCircle, 
  BookOpenCheck, 
  Sparkles,
  CheckCircle,
  FileText
} from "lucide-react";

export interface StudyOptions {
  createQuestions: boolean;
  questionType: "closed" | "mista";
  numQuestions: number;
  numOpenQuestions: number;
  difficulty: "fácil" | "médio" | "difícil" | "escaldante";
  detectImprovements: boolean;
}

interface WelcomeScreenProps {
  onSubmit: (subject: string, level: StudyLevel, options: StudyOptions) => void;
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
  
  // Custom Study Options State
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [createQuestions, setCreateQuestions] = useState(true);
  const [questionType, setQuestionType] = useState<"closed" | "mista">("mista");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [numOpenQuestions, setNumOpenQuestions] = useState<number>(2);
  const [difficulty, setDifficulty] = useState<"fácil" | "médio" | "difícil" | "escaldante">("médio");
  const [detectImprovements, setDetectImprovements] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    
    onSubmit(subject.trim(), level, {
      createQuestions,
      questionType: createQuestions ? questionType : "closed",
      numQuestions,
      numOpenQuestions: createQuestions && questionType === "mista" ? numOpenQuestions : 0,
      difficulty,
      detectImprovements: createQuestions ? detectImprovements : false
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in" id="welcome-screen">
      <div className="text-center mb-8">
        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold tracking-wide uppercase inline-block mb-3">
          Tutor Inteligente de Estudos • Sapiens.ai
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
          O que você deseja <span className="text-indigo-600 dark:text-indigo-400">estudar</span> hoje?
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Digite qualquer assunto acadêmico ou técnico. O tutor formulará um plano de estudos conceitual, simulado e diagnóstico de aprendizado sob demanda.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Subject Field */}
          <div>
            <label htmlFor="subject-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Assunto ou Matéria de Estudo
            </label>
            <input
              id="subject-input"
              type="text"
              required
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Ex: Termodinâmica Básica, História Geral do Brasil, Programação Orientada a Objetos..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isLoading}
            />

            {/* Quick Suggestions */}
            <div className="mt-2.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mr-2 font-medium">Sugestões rápidas:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {SAMPLE_SUBJECTS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setSubject(sample)}
                    disabled={isLoading}
                    className="text-[10px] bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full transition-colors font-medium border border-slate-200 dark:border-slate-700"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Level Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              Qual é seu nível atual de entendimento sobre este assunto?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5" role="radiogroup">
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
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all h-full ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/15"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {info.icon}
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{info.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-normal">
                      {info.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Trail Options Section */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-5">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors pb-1"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-500 animate-spin-slow" />
                <span className="text-xs font-bold uppercase tracking-wider">Customizar Trilha de Aprendizado</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {showAdvanced ? "Ocultar Opções ▲" : "Mostrar Opções ▼"}
              </span>
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 animate-fade-in">
                
                {/* 1. Toggle "Criar Questões" */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createQuestions}
                        onChange={(e) => setCreateQuestions(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 accent-indigo-500"
                      />
                      <span>Criar Questões de Avaliação</span>
                    </label>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6">
                      A Inteligência Artificial criará um exame customizado sob demanda para você testar seus conhecimentos teóricos.
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${createQuestions ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                    {createQuestions ? "ATIVADO" : "DESATIVADO"}
                  </span>
                </div>

                {createQuestions && (
                  <div className="pl-6 border-l-2 border-indigo-200 dark:border-indigo-900 space-y-4 pt-1 animate-fade-in">
                    
                    {/* Select total questions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                          Total de Questões
                        </span>
                        <div className="flex gap-1.5">
                          {[3, 5, 10, 15].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                setNumQuestions(num);
                                if (numOpenQuestions > num) setNumOpenQuestions(num);
                              }}
                              className={`flex-1 py-1 px-2 text-xs font-semibold border rounded-lg transition-all ${
                                numQuestions === num
                                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold"
                                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                          Dificuldade do Simulado
                        </span>
                        <select
                          value={difficulty}
                          onChange={(e: any) => setDifficulty(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="fácil">Fácil</option>
                          <option value="médio">Médio</option>
                          <option value="difícil">Difícil</option>
                          <option value="escaldante">Escaldante 🔥</option>
                        </select>
                      </div>
                    </div>

                    {/* 2. Choose Open/Dissertative Questions */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={questionType === "mista"}
                              onChange={(e) => setQuestionType(e.target.checked ? "mista" : "closed")}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 accent-indigo-500"
                            />
                            <span>Escolher Questões Abertas (Dissertativas)</span>
                          </label>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6">
                            Adicione perguntas onde você precisa digitar a resposta por escrito. O Gemini analisará a coerência técnica e dará notas de 0 a 100.
                          </p>
                        </div>
                      </div>

                      {questionType === "mista" && (
                        <div className="pl-6 pt-1 space-y-1.5 animate-fade-in">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="range"
                              min="1"
                              max={numQuestions}
                              step="1"
                              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                              value={numOpenQuestions}
                              onChange={(e) => setNumOpenQuestions(parseInt(e.target.value))}
                            />
                            <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900 font-mono flex-shrink-0">
                              {numOpenQuestions} Abertas
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-400">
                            Restante ({numQuestions - numOpenQuestions}) serão questões de múltipla escolha.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 3. Toggle "Detectar pontos de melhoria" */}
                    <div className="flex items-start justify-between gap-4 pt-1.5">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={detectImprovements}
                            onChange={(e) => setDetectImprovements(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 accent-indigo-500"
                          />
                          <span>Detectar Pontos de Melhorias (Diagnóstico)</span>
                        </label>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6">
                          Gera um relatório pedagógico detalhado ao final do teste listando as matérias que você dominou, o que precisa reforçar e um plano de ação personalizado.
                        </p>
                      </div>
                    </div>

                  </div>
                )}
                
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            id="start-study-btn"
            type="submit"
            disabled={isLoading || !subject.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none text-xs uppercase tracking-wider"
          >
            {isLoading ? (
              <div className="flex items-center gap-2 py-0.5">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Preparando sua Trilha Personalizada...</span>
              </div>
            ) : (
              <>
                <span>Iniciar Trilha de Estudos</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
