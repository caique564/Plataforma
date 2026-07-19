/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { StudyLevel, StudySetup, ChatMessage, EvaluationQuestion, QuestionAttempt, PerformanceDiagnosis } from "./types";
import { 
  explainSubject, 
  sendChatMessage, 
  generateEvaluation, 
  gradeEssayQuestion, 
  analyzePerformance 
} from "./lib/api";
import WelcomeScreen, { StudyOptions } from "./components/WelcomeScreen";
import { 
  BookOpen, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  User, 
  Sparkles, 
  Settings, 
  Flame, 
  FileText, 
  TrendingUp, 
  Compass, 
  BookOpenCheck,
  Send,
  GraduationCap,
  Award,
  ChevronRight,
  Info
} from "lucide-react";

// Robust Inline Custom Markdown Renderer
function MarkdownText({ text }: { text: string }) {
  if (!text) return null;
  const blocks = text.split("\n\n");
  
  return (
    <div className="markdown-body space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        
        // Headers
        if (trimmed.startsWith("### ")) {
          return <h3 key={idx} className="text-base font-bold mt-5 mb-2 text-slate-800 dark:text-slate-100 font-display">{trimmed.slice(4)}</h3>;
        }
        if (trimmed.startsWith("## ")) {
          return <h2 key={idx} className="text-lg font-bold mt-6 mb-3 text-slate-800 dark:text-slate-100 font-display border-b pb-1 border-slate-200 dark:border-slate-700">{trimmed.slice(3)}</h2>;
        }
        if (trimmed.startsWith("# ")) {
          return <h1 key={idx} className="text-xl font-black mt-8 mb-4 text-slate-900 dark:text-white font-display border-b-2 pb-1.5 border-slate-200 dark:border-slate-700">{trimmed.slice(2)}</h1>;
        }
        
        // Bullet list
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split(/\n[-*]\s+/);
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1.5 my-3">
              {items.map((item, itemIdx) => {
                const cleanedItem = item.replace(/^[-*]\s+/, "");
                return <li key={itemIdx} className="text-slate-700 dark:text-slate-300">{parseBoldAndInlineCode(cleanedItem)}</li>;
              })}
            </ul>
          );
        }

        // Numbered list
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = trimmed.split(/\n\d+\.\s+/);
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-1.5 my-3">
              {items.map((item, itemIdx) => {
                const cleanedItem = item.replace(/^\d+\.\s+/, "");
                return <li key={itemIdx} className="text-slate-700 dark:text-slate-300">{parseBoldAndInlineCode(cleanedItem)}</li>;
              })}
            </ol>
          );
        }

        // Blockquote
        if (trimmed.startsWith(">")) {
          const quote = trimmed.replace(/^>\s*/, "");
          return (
            <blockquote key={idx} className="border-l-4 border-blue-500 bg-blue-50/40 dark:bg-blue-950/10 pl-4 py-2 italic text-slate-600 dark:text-slate-400 my-3 rounded-r-md">
              {parseBoldAndInlineCode(quote)}
            </blockquote>
          );
        }

        // Code block
        if (trimmed.startsWith("```")) {
          const lines = trimmed.split("\n");
          const codeLines = lines.slice(1, lines.length - (lines[lines.length - 1].startsWith("```") ? 1 : 0));
          return (
            <pre key={idx} className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto shadow-inner my-4">
              <code>{codeLines.join("\n")}</code>
            </pre>
          );
        }

        // Regular paragraph with linebreaks
        const lines = trimmed.split("\n");
        return (
          <p key={idx} className="text-slate-700 dark:text-slate-300">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {parseBoldAndInlineCode(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function parseBoldAndInlineCode(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-xs font-mono font-medium border border-slate-200 dark:border-slate-700">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function App() {
  const [setup, setSetup] = useState<StudySetup | null>(null);
  const [activeTab, setActiveTab] = useState<"explanation" | "chat" | "evaluation">("explanation");
  
  // App state
  const [loading, setLoading] = useState<boolean>(false);
  const [explanationText, setExplanationText] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  
  // Evaluation Mode State
  const [evalConfigured, setEvalConfigured] = useState<boolean>(false);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<"fácil" | "médio" | "difícil" | "escaldante">("médio");
  const [questionType, setQuestionType] = useState<"closed" | "mista">("closed");
  const [numOpenQuestions, setNumOpenQuestions] = useState<number>(1);
  const [detectImprovementsEnabled, setDetectImprovementsEnabled] = useState<boolean>(true);
  
  const [evaluationQuestions, setEvaluationQuestions] = useState<EvaluationQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [attempts, setAttempts] = useState<Record<string, QuestionAttempt>>({});
  
  // Interactive Question State
  const [selectedClosedOption, setSelectedClosedOption] = useState<number | null>(null);
  const [writtenOpenAnswer, setWrittenOpenAnswer] = useState<string>("");
  const [gradingLoading, setGradingLoading] = useState<boolean>(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    status: "correct" | "partial" | "incorrect";
    score: number;
    feedback: string;
  } | null>(null);
  
  // Finished Diagnostic State
  const [evalFinished, setEvalFinished] = useState<boolean>(false);
  const [diagnosis, setDiagnosis] = useState<PerformanceDiagnosis | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState<boolean>(false);

  // Ref for chat auto-scrolling
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when chat messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // Dark mode trigger
  const [darkMode, setDarkMode] = useState<boolean>(false);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Handle study onboarding
  const handleStartStudy = async (subject: string, level: StudyLevel, options?: StudyOptions) => {
    setLoading(true);
    try {
      // 1. Pre-configure states from WelcomeScreen options
      if (options) {
        setNumQuestions(options.numQuestions);
        setDifficulty(options.difficulty);
        setQuestionType(options.questionType);
        setNumOpenQuestions(options.numOpenQuestions);
        setDetectImprovementsEnabled(options.detectImprovements);
      }

      // 2. Fetch explanation and evaluation in parallel if requested!
      const activeOpenQuestions = options && options.questionType === "closed" ? 0 : (options?.numOpenQuestions || 0);
      
      const explainPromise = explainSubject(subject, level);
      const evalPromise = (options && options.createQuestions)
        ? generateEvaluation({
            subject,
            level,
            numQuestions: options.numQuestions,
            difficulty: options.difficulty,
            numOpenQuestions: activeOpenQuestions
          })
        : Promise.resolve(null);

      const [explanation, questions] = await Promise.all([explainPromise, evalPromise]);
      setExplanationText(explanation);
      setSetup({ subject, level });
      
      if (questions && questions.length > 0) {
        setEvaluationQuestions(questions);
        setCurrentQuestionIndex(0);
        setAttempts({});
        setCurrentFeedback(null);
        setSelectedClosedOption(null);
        setWrittenOpenAnswer("");
        setEvalConfigured(true);
        setEvalFinished(false);
        setDiagnosis(null);
      } else {
        setEvalConfigured(false);
        setEvaluationQuestions([]);
      }
      
      // Auto-populate chat with welcome message
      const welcomeMsg: ChatMessage = {
        id: "welcome",
        role: "model",
        text: `Olá! Preparei o material de estudos para você sobre **${subject}** adaptado para o nível **${level}**. \n\nSinta-se à vontade para ler a explicação inicial na aba **Teoria** ou mandar suas dúvidas aqui no chat que estarei pronta para detalhar o que você quiser!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages([welcomeMsg]);
      setActiveTab("explanation");
    } catch (error: any) {
      alert("Erro ao preparar o material de estudos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Chat message send handler
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !setup || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      // Map ChatMessage structure to server-expected role structure
      const apiMessages = updatedMessages.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const modelReply = await sendChatMessage(apiMessages, setup.subject, setup.level);
      
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "model",
        text: modelReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "model",
        text: `Desculpe, ocorreu um erro ao processar sua dúvida: ${error.message}. Por favor, tente enviar novamente.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Generate Evaluation Quiz
  const handleStartEvaluation = async () => {
    if (!setup) return;
    setLoading(true);
    try {
      const activeOpenQuestions = questionType === "closed" ? 0 : numOpenQuestions;
      const questions = await generateEvaluation({
        subject: setup.subject,
        level: setup.level,
        numQuestions,
        difficulty,
        numOpenQuestions: activeOpenQuestions
      });

      setEvaluationQuestions(questions);
      setCurrentQuestionIndex(0);
      setAttempts({});
      setCurrentFeedback(null);
      setSelectedClosedOption(null);
      setWrittenOpenAnswer("");
      setEvalConfigured(true);
      setEvalFinished(false);
      setDiagnosis(null);
    } catch (error: any) {
      alert("Erro ao gerar sua avaliação: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check/Submit individual question answer
  const handleConfirmAnswer = async () => {
    if (!setup || evaluationQuestions.length === 0) return;
    const currentQuestion = evaluationQuestions[currentQuestionIndex];
    
    setGradingLoading(true);
    try {
      let isCorrect = false;
      let score = 0;
      let feedbackText = "";

      if (currentQuestion.type === "closed") {
        if (selectedClosedOption === null) {
          alert("Selecione uma opção antes de confirmar.");
          setGradingLoading(false);
          return;
        }
        
        const isAnswerCorrect = selectedClosedOption === currentQuestion.correctOptionIndex;
        score = isAnswerCorrect ? 100 : 0;
        isCorrect = isAnswerCorrect;
        feedbackText = currentQuestion.explanation;

        setCurrentFeedback({
          status: isAnswerCorrect ? "correct" : "incorrect",
          score,
          feedback: feedbackText
        });

        // Record attempt
        const attempt: QuestionAttempt = {
          questionId: currentQuestion.id,
          userAnswer: selectedClosedOption.toString(),
          status: isAnswerCorrect ? "correct" : "incorrect",
          score,
          feedback: feedbackText
        };
        setAttempts(prev => ({ ...prev, [currentQuestion.id]: attempt }));

      } else {
        // Open/essay question evaluated by Gemini
        if (!writtenOpenAnswer.trim()) {
          alert("Por favor, escreva uma resposta antes de confirmar.");
          setGradingLoading(false);
          return;
        }

        const grading = await gradeEssayQuestion({
          questionText: currentQuestion.text,
          userAnswer: writtenOpenAnswer,
          idealCriteria: currentQuestion.idealCriteria,
          explanation: currentQuestion.explanation,
          subject: setup.subject,
          level: setup.level
        });

        setCurrentFeedback({
          status: grading.status,
          score: grading.score,
          feedback: grading.feedback
        });

        const attempt: QuestionAttempt = {
          questionId: currentQuestion.id,
          userAnswer: writtenOpenAnswer,
          status: grading.status,
          score: grading.score,
          feedback: grading.feedback
        };
        setAttempts(prev => ({ ...prev, [currentQuestion.id]: attempt }));
      }
    } catch (error: any) {
      alert("Erro ao validar sua resposta: " + error.message);
    } finally {
      setGradingLoading(false);
    }
  };

  // Proceed to next question
  const handleNextQuestion = () => {
    setSelectedClosedOption(null);
    setWrittenOpenAnswer("");
    setCurrentFeedback(null);

    if (currentQuestionIndex + 1 < evaluationQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz finished, generate diagnostic performance analysis
      handleFinishEvaluation();
    }
  };

  // Finish Evaluation Quiz & Diagnose Focus Study Areas
  const handleFinishEvaluation = async () => {
    if (!setup) return;
    setDiagnosisLoading(true);
    setEvalFinished(true);

    try {
      // Map attempts to structured evaluation items for Gemini review
      const performanceData = evaluationQuestions.map(q => {
        const attempt = attempts[q.id];
        return {
          text: q.text,
          type: q.type,
          subTopic: q.subTopic,
          status: attempt?.status || "incorrect",
          score: attempt?.score || 0,
          explanation: q.explanation,
          userAnswer: q.type === "closed" 
            ? (q.options ? q.options[parseInt(attempt?.userAnswer || "-1")] : "Sem resposta")
            : attempt?.userAnswer,
          feedback: attempt?.feedback || ""
        };
      });

      if (detectImprovementsEnabled) {
        const analysis = await analyzePerformance(setup.subject, setup.level, performanceData);
        setDiagnosis(analysis);
      } else {
        // Create local calculated diagnosis
        const totalScore = Object.values(attempts).reduce((acc, curr) => acc + curr.score, 0);
        const avgScore = evaluationQuestions.length > 0 ? Math.round(totalScore / evaluationQuestions.length) : 0;
        
        const correctSubtopics = performanceData.filter(p => p.status === "correct").map(p => p.subTopic);
        const incorrectSubtopics = performanceData.filter(p => p.status !== "correct").map(p => p.subTopic);
        
        setDiagnosis({
          overallSummary: `Você concluiu o teste com sucesso! Sua média de acertos foi de ${avgScore}%. Se desejar uma análise profunda baseada em IA, certifique-se de marcar a opção 'Detectar Pontos de Melhoria' no início da trilha.`,
          strengths: correctSubtopics.length > 0 ? Array.from(new Set(correctSubtopics)) : ["Domínio geral do assunto"],
          reforzamento: incorrectSubtopics.length > 0 ? Array.from(new Set(incorrectSubtopics)) : ["Nenhum ponto crítico de atenção urgente."],
          actionPlan: [
            "Revise as correções de cada questão onde houve erros para fixar os conceitos.",
            "Use o chat explicativo com o tutor de estudos para tirar dúvidas específicas.",
            "Faça uma nova rodada de simulados ajustando a quantidade ou dificuldade das questões."
          ]
        });
      }
    } catch (error: any) {
      alert("Erro ao realizar o diagnóstico de desempenho: " + error.message);
    } finally {
      setDiagnosisLoading(false);
    }
  };

  // Reset session and study state to start with a new subject
  const handleResetSession = () => {
    setSetup(null);
    setExplanationText("");
    setChatMessages([]);
    setEvalConfigured(false);
    setEvaluationQuestions([]);
    setAttempts({});
    setEvalFinished(false);
    setDiagnosis(null);
    setActiveTab("explanation");
  };

  // Calculate overall performance metrics
  const totalQuestionsEvaluated = evaluationQuestions.length;
  const closedQuestions = evaluationQuestions.filter(q => q.type === "closed");
  const openQuestions = evaluationQuestions.filter(q => q.type === "open");
  
  const totalCorrectClosed = closedQuestions.reduce((acc, q) => {
    const att = attempts[q.id];
    return acc + (att && att.status === "correct" ? 1 : 0);
  }, 0);

  const averageScoreOpen = openQuestions.length > 0
    ? Math.round(openQuestions.reduce((acc, q) => acc + (attempts[q.id]?.score || 0), 0) / openQuestions.length)
    : 100;

  // Global accuracy percentage
  const totalPoints = Object.values(attempts).reduce((acc, curr) => acc + curr.score, 0);
  const maxPossiblePoints = totalQuestionsEvaluated * 100;
  const overallAccuracyPercentage = maxPossiblePoints > 0 
    ? Math.round((totalPoints / maxPossiblePoints) * 100) 
    : 0;

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""} bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200`}>
      
      {/* Absolute Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <div className="bg-slate-950/90 border border-slate-800 p-8 rounded-2xl flex flex-col items-center gap-4 max-w-sm text-center shadow-2xl">
            <div className="w-12 h-12 rounded-sm bg-indigo-500 flex items-center justify-center font-bold text-2xl animate-pulse">Σ</div>
            <div className="flex space-x-2">
              <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
            <p className="font-semibold text-lg">Processando...</p>
            <p className="text-xs text-slate-400">A Inteligência Artificial está preparando suas explicações acadêmicas e gerando questões dinâmicas sob demanda.</p>
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col lg:flex-row w-full overflow-hidden">
        
        {/* SIDEBAR */}
        <aside className="w-full lg:w-80 bg-slate-900 text-white flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 p-6 flex-shrink-0">
          
          {/* Header Branding */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={handleResetSession} className="flex items-center gap-2.5 hover:opacity-90 text-left">
              <div className="w-8 h-8 bg-indigo-500 text-white rounded-sm flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">Σ</div>
              <div>
                <h1 className="text-lg font-bold tracking-tight uppercase leading-none font-display text-white">Sapiens.ai</h1>
                <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase mt-1">AI Study Platform</p>
              </div>
            </button>
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400 hover:text-white transition-all text-xs"
              title="Alternar Tema Escuro"
            >
              {darkMode ? "☀️ LIGHT" : "🌙 DARK"}
            </button>
          </div>

          {/* Active Session Status */}
          {setup ? (
            <div className="space-y-6 flex-grow flex flex-col justify-between">
              <div className="space-y-5">
                
                {/* Active Subject Card */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block mb-1">MÉTODO DE ENSINO</span>
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 font-semibold px-2 py-0.5 rounded border border-indigo-500/20 inline-block">
                      Tutor Personalizado
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block mb-1">ASSUNTO ATIVO</span>
                    <p className="text-sm font-bold text-slate-100 font-display leading-tight break-words">{setup.subject}</p>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block mb-1">NÍVEL ACADÊMICO</span>
                    <span className="text-xs text-indigo-300 font-medium font-mono uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800 inline-block">
                      {setup.level}
                    </span>
                  </div>
                </div>

                {/* Main Action Mode Selector */}
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2.5 block">Selecione o Modo Ativo</span>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => {
                        setActiveTab("explanation");
                        if (evalConfigured && !evalFinished) {
                          if (!confirm("Deseja sair do modo avaliação? Suas respostas atuais serão guardadas.")) return;
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 border-2 transition-all ${
                        activeTab === "explanation" 
                          ? "border-indigo-500 bg-indigo-500/10 text-white font-bold" 
                          : "border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-xs uppercase font-bold tracking-wider">1. Teoria & Resumo</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-60" />
                    </button>

                    <button 
                      onClick={() => {
                        setActiveTab("chat");
                        if (evalConfigured && !evalFinished) {
                          if (!confirm("Deseja sair do modo avaliação? Suas respostas atuais serão guardadas.")) return;
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 border-2 transition-all ${
                        activeTab === "chat" 
                          ? "border-indigo-500 bg-indigo-500/10 text-white font-bold" 
                          : "border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs uppercase font-bold tracking-wider">2. Chat com IA</span>
                      </div>
                      <span className="text-[9px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">ONLINE</span>
                    </button>

                    <button 
                      onClick={() => {
                        setActiveTab("evaluation");
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 border-2 transition-all ${
                        activeTab === "evaluation" 
                          ? "border-indigo-500 bg-indigo-600 text-white font-black" 
                          : "border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BookOpenCheck className="w-4 h-4" />
                        <span className="text-xs uppercase font-bold tracking-wider">3. Modo Avaliação</span>
                      </div>
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded uppercase">QUIZ</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Reset Session footer button */}
              <div className="mt-auto border-t border-slate-800 pt-5 space-y-4">
                <button
                  onClick={handleResetSession}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/80 text-xs text-slate-300 font-bold py-2.5 px-4 transition-colors uppercase tracking-widest"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Novo Assunto</span>
                </button>
                <div className="flex items-center gap-2 text-slate-500 justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                  <span className="text-[9px] font-bold tracking-wider uppercase">Sapiens AI Ativo</span>
                </div>
              </div>
            </div>
          ) : (
            // Sidebar display when there is no subject selected yet
            <div className="flex-grow flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    Bem-vindo ao **Sapiens.ai**. Insira seu assunto de estudos ao lado para habilitar o tutor inteligente, o chat explicativo e a avaliação diagnóstica.
                  </p>
                </div>
                <div className="border-l-2 border-indigo-500/40 pl-3 py-1 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Habilidades Disponíveis:</span>
                  <p className="text-[11px] text-slate-400">• Geração de Teoria Personalizada</p>
                  <p className="text-[11px] text-slate-400">• Respostas a Dúvidas por Chat</p>
                  <p className="text-[11px] text-slate-400">• Avaliação de Múltipla Escolha e Aberta</p>
                  <p className="text-[11px] text-slate-400">• Diagnóstico e Plano de Estudos</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono text-center">Sapiens Core Engine v2.4.0</p>
            </div>
          )}
        </aside>

        {/* MAIN WORKING AREA */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-900">
          
          {/* Active Navigation Header */}
          {setup ? (
            <header className="h-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sm:px-8 flex-shrink-0">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-mono">
                    {activeTab === "explanation" ? "Módulo Teórico" : activeTab === "chat" ? "Atendimento Tutor" : "Avaliação Acadêmica"}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight font-display">
                    {activeTab === "explanation" ? "Teoria Básica e Explicação" : activeTab === "chat" ? "Esclarecimento de Dúvidas" : "Diagnóstico de Aprendizado"}
                  </span>
                </div>
                
                {/* Visual Badge Divider */}
                <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-800"></div>

                {/* Sub info in header */}
                <div className="hidden md:flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Status:</span>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded">
                      Trilha Iniciada
                    </span>
                  </div>
                  {activeTab === "evaluation" && evalConfigured && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Progresso:</span>
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase">
                        {evalFinished ? "Finalizado" : `Questão ${currentQuestionIndex + 1} de ${evaluationQuestions.length}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right indicators */}
              {activeTab === "evaluation" && evalConfigured && !evalFinished && (
                <div className="flex items-center gap-4">
                  <div className="hidden lg:block w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex) / evaluationQuestions.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    {Math.round(((currentQuestionIndex) / evaluationQuestions.length) * 100)}% concluído
                  </span>
                </div>
              )}
            </header>
          ) : null}

          {/* MAIN PAGE BODY */}
          <div className="flex-1 overflow-y-auto min-h-0">
            
            {/* 1. ONBOARDING WELCOME SCREEN */}
            {!setup ? (
              <WelcomeScreen onSubmit={handleStartStudy} isLoading={loading} />
            ) : (
              <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full animate-fade-in" id="workspace-content">
                
                {/* A. TAB 1: THEORY / INITIAL EXPLANATION */}
                {activeTab === "explanation" && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
                      {/* Geometric tag */}
                      <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] px-3.5 py-1 font-bold tracking-widest uppercase">
                        Material de Estudo
                      </div>
                      
                      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <BookOpen className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-xl font-bold font-display text-slate-800 dark:text-white uppercase tracking-tight">Explicação Inicial do Assunto</h2>
                      </div>
                      
                      {explanationText ? (
                        <div className="space-y-4">
                          <MarkdownText text={explanationText} />
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <p className="text-slate-400">Gerando conteúdo conceitual...</p>
                        </div>
                      )}
                    </div>

                    {/* Interactive Prompt Card */}
                    <div className="bg-slate-900 border-2 border-slate-800 text-white rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center md:text-left">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400 font-display">Entendeu os conceitos teóricos fundamentais?</h4>
                        <p className="text-xs text-slate-300">Você pode tirar dúvidas personalizadas no Chat com o Tutor ou ir direto testar seus conhecimentos.</p>
                      </div>
                      <div className="flex flex-wrap gap-3 w-full md:w-auto justify-center">
                        <button 
                          onClick={() => setActiveTab("chat")}
                          className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-700 transition-colors uppercase tracking-wider"
                        >
                          Ir para o Chat IA
                        </button>
                        <button 
                          onClick={() => setActiveTab("evaluation")}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors uppercase tracking-wider shadow-lg shadow-indigo-500/20"
                        >
                          Iniciar Avaliação
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* B. TAB 2: CHAT CONVERSATION */}
                {activeTab === "chat" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] min-h-[400px]">
                    
                    {/* Left Mini-Summary Area (Geometric Balance Sidebar reference) */}
                    <div className="lg:col-span-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-sm">
                      <div className="space-y-4">
                        <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                          <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest block mb-1">Dica de Aprendizado</span>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white font-display">Utilize perguntas específicas!</h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          O Tutor IA foi alimentado com o seu nível de entendimento (**{setup.level}**). Você pode pedir para ele:
                        </p>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">•</span>
                            <span>Criar analogias do dia-a-dia para conceitos abstratos.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">•</span>
                            <span>Apresentar fórmulas comentadas passo a passo.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">•</span>
                            <span>Recomendar livros ou referências clássicas.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">•</span>
                            <span>Formular uma pergunta rápida para você responder aqui.</span>
                          </li>
                        </ul>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse flex-shrink-0" />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                          Dica: Digite <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 font-mono">"explique de outra forma"</code> para ver visões alternativas.
                        </p>
                      </div>
                    </div>

                    {/* Right Conversational Window */}
                    <div className="lg:col-span-8 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-sm">
                      
                      {/* Chat Header */}
                      <div className="bg-slate-50 dark:bg-slate-900/60 px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest font-mono">Tutor Conectado</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">MODEL: GEMINI-3.5-FLASH</span>
                      </div>

                      {/* Message History */}
                      <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {chatMessages.map((msg) => {
                          const isAI = msg.role === "model";
                          return (
                            <div 
                              key={msg.id} 
                              className={`flex ${isAI ? "justify-start" : "justify-end"} animate-fade-in`}
                            >
                              <div className={`max-w-[85%] rounded-xl px-4 py-3.5 shadow-sm border ${
                                isAI 
                                  ? "bg-slate-50 dark:bg-slate-900/80 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100" 
                                  : "bg-indigo-600 border-indigo-700 text-white"
                              }`}>
                                {/* Message Role Header */}
                                <div className="flex items-center justify-between gap-4 mb-2 text-[10px] opacity-60 font-mono font-bold uppercase">
                                  <span>{isAI ? "IA TUTOR" : "VOCÊ (ALUNO)"}</span>
                                  <span>{msg.timestamp}</span>
                                </div>
                                <div className="text-sm prose dark:prose-invert break-words">
                                  {isAI ? (
                                    <MarkdownText text={msg.text} />
                                  ) : (
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Loader Bubble */}
                        {chatLoading && (
                          <div className="flex justify-start animate-pulse">
                            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl px-4 py-3 text-sm">
                              <span className="font-bold text-[10px] font-mono uppercase block text-slate-400 mb-1">IA TUTOR</span>
                              <div className="flex items-center gap-1.5 py-1">
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Chat Input Bar */}
                      <form onSubmit={handleSendChat} className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex gap-2">
                        <input
                          type="text"
                          required
                          disabled={chatLoading}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder={`Pergunte algo sobre "${setup.subject}"...`}
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button
                          type="submit"
                          disabled={chatLoading || !chatInput.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          <span className="hidden sm:inline">Enviar</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* C. TAB 3: QUIZ EVALUATION MODE */}
                {activeTab === "evaluation" && (
                  <div className="space-y-6">
                    
                    {/* CASE C1: QUIZ UNCONFIGURED - Configuration Screen */}
                    {!evalConfigured ? (
                      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm relative">
                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] px-3.5 py-1 font-bold tracking-widest uppercase">
                          Setup de Avaliação
                        </div>
                        
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                          <BookOpenCheck className="w-5 h-5 text-indigo-500" />
                          <h2 className="text-xl font-bold font-display text-slate-800 dark:text-white uppercase tracking-tight">Modo de Avaliação de Desempenho</h2>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                          Configure abaixo as diretrizes para a criação do seu teste de aprendizado. O examinador inteligente criará perguntas personalizadas de acordo com o nível selecionado (**{setup.level}**).
                        </p>

                        <div className="space-y-6">
                          {/* Questions count */}
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                              Quantidade total de questões
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              {[3, 5, 10, 15].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => setNumQuestions(num)}
                                  className={`py-2 px-3 text-sm font-semibold border rounded-lg transition-all ${
                                    numQuestions === num
                                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold"
                                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                                  }`}
                                >
                                  {num} Questões
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Difficulty selection */}
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                              Nível de Dificuldade do Exame
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {([
                                { val: "fácil", color: "text-emerald-600 dark:text-emerald-400" },
                                { val: "médio", color: "text-blue-600 dark:text-blue-400" },
                                { val: "difícil", color: "text-orange-600 dark:text-orange-400" },
                                { val: "escaldante", color: "text-red-600 dark:text-red-400" }
                              ] as const).map(({ val, color }) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setDifficulty(val)}
                                  className={`py-2 px-1 text-xs font-bold border rounded-lg transition-all uppercase tracking-wider ${
                                    difficulty === val
                                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/10"
                                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                                  }`}
                                >
                                  <span className={color}>
                                    {val === "escaldante" ? "🔥 " : ""}
                                    {val}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                              * <strong>Escaldante</strong>: A avaliação começa fácil, avança gradativamente para o médio e termina com desafios profundos e complexos para consolidar seu aprendizado.
                            </p>
                          </div>

                          {/* Question Format selection */}
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                              Formato das Questões
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setQuestionType("closed")}
                                className={`flex flex-col text-left p-4 border rounded-xl transition-all ${
                                  questionType === "closed"
                                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                }`}
                              >
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Apenas questões fechadas</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Multipla escolha com alternativas de A a D com feedback instantâneo.</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setQuestionType("mista")}
                                className={`flex flex-col text-left p-4 border rounded-xl transition-all ${
                                  questionType === "mista"
                                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                }`}
                              >
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Contém questões abertas</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Questões discursivas que exigem redação própria, avaliadas de 0 a 100 pela IA.</span>
                              </button>
                            </div>
                          </div>

                          {/* Specific number of open questions */}
                          {questionType === "mista" && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                                Quantas questões abertas (dissertativas) você deseja incluir?
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min="1"
                                  max={numQuestions}
                                  step="1"
                                  className="flex-1 accent-indigo-600 cursor-pointer"
                                  value={numOpenQuestions}
                                  onChange={(e) => setNumOpenQuestions(parseInt(e.target.value))}
                                />
                                <span className="text-sm font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-md min-w-[50px] text-center font-mono">
                                  {numOpenQuestions} de {numQuestions}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                Restante ({numQuestions - numOpenQuestions}) serão questões de múltipla escolha normais.
                              </p>
                            </div>
                          )}

                          {/* Button Start Quiz */}
                          <button
                            onClick={handleStartEvaluation}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all uppercase tracking-wider text-xs shadow-lg shadow-indigo-500/10"
                          >
                            <span>Criar Avaliação Personalizada</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      // CASE C2: EVALUATION ACTIVE OR FINISHED
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* LEFT COLUMN: ACTIVE QUESTION / DISSERTATIVE FORM */}
                        <div className="lg:col-span-8 space-y-6">
                          {!evalFinished ? (
                            // ACTIVE QUIZ INTERACTIVITY VIEW
                            <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 p-6 sm:p-8 relative shadow-sm rounded-xl">
                              
                              {/* Header Card Status */}
                              <div className="absolute -top-3.5 left-6 bg-slate-900 text-white text-[10px] px-3 py-1 font-bold tracking-widest uppercase">
                                Questão {currentQuestionIndex + 1} de {evaluationQuestions.length}
                              </div>

                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-6 mt-2">
                                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                                  Tópico: <span className="text-indigo-600 dark:text-indigo-400">{evaluationQuestions[currentQuestionIndex]?.subTopic}</span>
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded uppercase">
                                  Dificuldade: {evaluationQuestions[currentQuestionIndex]?.difficulty}
                                </span>
                              </div>

                              {/* Question Enunciation */}
                              <h3 className="text-lg font-serif text-slate-800 dark:text-slate-100 leading-relaxed mb-6 italic">
                                "{evaluationQuestions[currentQuestionIndex]?.text}"
                              </h3>

                              {/* CONDITIONAL INPUT: CLOSED (Múltipla escolha) */}
                              {evaluationQuestions[currentQuestionIndex]?.type === "closed" ? (
                                <div className="space-y-3" role="radiogroup">
                                  {evaluationQuestions[currentQuestionIndex]?.options?.map((option, idx) => {
                                    const optionChar = String.fromCharCode(65 + idx); // A, B, C, D
                                    const isSelected = selectedClosedOption === idx;
                                    const isCorrectOpt = idx === evaluationQuestions[currentQuestionIndex].correctOptionIndex;
                                    const isAttempted = attempts[evaluationQuestions[currentQuestionIndex].id] !== undefined;
                                    
                                    let btnStyle = "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200";
                                    
                                    if (isAttempted) {
                                      if (isCorrectOpt) {
                                        // Highlight correct answer in green
                                        btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-semibold";
                                      } else if (isSelected) {
                                        // Highlight wrong selection in red
                                        btnStyle = "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 ring-2 ring-red-500/20";
                                      } else {
                                        btnStyle = "opacity-50 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400";
                                      }
                                    } else if (isSelected) {
                                      btnStyle = "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30";
                                    }

                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        disabled={isAttempted || gradingLoading}
                                        onClick={() => setSelectedClosedOption(idx)}
                                        className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left text-sm transition-all ${btnStyle}`}
                                      >
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                                          isSelected 
                                            ? "bg-indigo-500 border-indigo-600 text-white" 
                                            : "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                                        }`}>
                                          {optionChar}
                                        </span>
                                        <span className="flex-1 leading-relaxed">{option}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                // CONDITIONAL INPUT: OPEN (Dissertativa)
                                <div className="space-y-4">
                                  <label htmlFor="essay-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Sua Resposta Escrita (Dissertativa)
                                  </label>
                                  <textarea
                                    id="essay-input"
                                    rows={6}
                                    disabled={attempts[evaluationQuestions[currentQuestionIndex].id] !== undefined || gradingLoading}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Escreva sua resposta teórica abordando os pontos principais solicitados..."
                                    value={writtenOpenAnswer}
                                    onChange={(e) => setWrittenOpenAnswer(e.target.value)}
                                  />
                                  
                                  {/* Requirements box */}
                                  {evaluationQuestions[currentQuestionIndex].idealCriteria && (
                                    <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/40 rounded-lg flex gap-2.5">
                                      <Info className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                      <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Conceitos esperados na resposta:</span>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                          {evaluationQuestions[currentQuestionIndex].idealCriteria}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* CONDITIONAL ATTEMPT FEEDBACK PANEL */}
                              {currentFeedback && (
                                <div className="mt-8 space-y-4 animate-fade-in">
                                  {currentFeedback.status === "correct" ? (
                                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-r-xl">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <span className="text-emerald-800 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">RESPOSTA CORRETA</span>
                                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold ml-auto">Nota: {currentFeedback.score}/100</span>
                                      </div>
                                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed prose dark:prose-invert">
                                        <MarkdownText text={currentFeedback.feedback} />
                                      </div>
                                    </div>
                                  ) : currentFeedback.status === "partial" ? (
                                    <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-xl">
                                      <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                                        <span className="text-amber-800 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">RESPOSTA PARCIALMENTE CORRETA</span>
                                        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold ml-auto">Nota: {currentFeedback.score}/100</span>
                                      </div>
                                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed prose dark:prose-invert">
                                        <MarkdownText text={currentFeedback.feedback} />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-xl">
                                      <div className="flex items-center gap-2 mb-2">
                                        <XCircle className="w-5 h-5 text-red-600" />
                                        <span className="text-red-800 dark:text-red-400 font-bold text-xs uppercase tracking-wider">RESPOSTA INCORRETA</span>
                                        <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold ml-auto">Nota: {currentFeedback.score}/100</span>
                                      </div>
                                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed prose dark:prose-invert">
                                        <div className="mb-3 font-semibold text-slate-800 dark:text-slate-200 bg-red-100/50 dark:bg-red-950/40 p-2.5 rounded">
                                          Explicação da correção acadêmica detalhada:
                                        </div>
                                        <MarkdownText text={currentFeedback.feedback} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* QUESTION FOOTER CONTROLS */}
                              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
                                <div className="text-xs text-slate-400">
                                  {attempts[evaluationQuestions[currentQuestionIndex].id] === undefined 
                                    ? "Selecione ou redija e clique em confirmar para obter o gabarito."
                                    : "Resposta registrada no sistema."}
                                </div>

                                <div className="flex gap-3">
                                  {attempts[evaluationQuestions[currentQuestionIndex].id] === undefined ? (
                                    <button
                                      onClick={handleConfirmAnswer}
                                      disabled={gradingLoading || (evaluationQuestions[currentQuestionIndex].type === "closed" ? selectedClosedOption === null : !writtenOpenAnswer.trim())}
                                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 px-6 font-bold text-xs uppercase hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors tracking-widest rounded disabled:opacity-40"
                                    >
                                      {gradingLoading ? "Corrigindo..." : "Confirmar Resposta"}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={handleNextQuestion}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 font-bold text-xs uppercase transition-colors tracking-widest rounded shadow-md flex items-center gap-2"
                                    >
                                      <span>{currentQuestionIndex + 1 === evaluationQuestions.length ? "Finalizar Avaliação" : "Próxima Questão"}</span>
                                      <ArrowRight className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>

                            </div>
                          ) : (
                            // EXAM HAS COMPLETED - SHOW RESULTS AND INSTRUCTIONAL REPORT DIAGNOSIS
                            <div className="space-y-6">
                              <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-xl shadow-sm relative">
                                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] px-3.5 py-1 font-bold tracking-widest uppercase">
                                  Avaliação Concluída
                                </div>

                                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                                  <Award className="w-6 h-6 text-indigo-500 animate-bounce" />
                                  <h2 className="text-xl font-bold font-display text-slate-800 dark:text-white uppercase tracking-tight">Resultado do seu Diagnóstico Acadêmico</h2>
                                </div>

                                {diagnosisLoading ? (
                                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                    <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">A IA está consolidando suas respostas e formulando um plano de estudos sob medida...</p>
                                  </div>
                                ) : diagnosis ? (
                                  <div className="space-y-6">
                                    
                                    {/* Core summary text block */}
                                    <div className="bg-slate-50 dark:bg-slate-900/60 p-5 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed">
                                      <p className="text-sm text-slate-700 dark:text-slate-300 font-light whitespace-pre-line">
                                        {diagnosis.overallSummary}
                                      </p>
                                    </div>

                                    {/* Strengths & Weaknesses visual grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {/* Strengths card */}
                                      <div className="bg-emerald-50/50 dark:bg-emerald-950/15 border-2 border-emerald-100 dark:border-emerald-900/40 p-5 rounded-xl">
                                        <div className="flex items-center gap-2.5 border-b border-emerald-100 dark:border-emerald-900/30 pb-2 mb-4">
                                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider font-display">Tópicos Dominados</h4>
                                        </div>
                                        {diagnosis.strengths.length > 0 ? (
                                          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                            {diagnosis.strengths.map((str, idx) => (
                                              <li key={idx} className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                <span>{str}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="text-xs text-slate-400 italic">Nenhum ponto forte detectado. Revise a matéria novamente.</p>
                                        )}
                                      </div>

                                      {/* Reinforcement card */}
                                      <div className="bg-red-50/50 dark:bg-red-950/15 border-2 border-red-100 dark:border-red-900/40 p-5 rounded-xl">
                                        <div className="flex items-center gap-2.5 border-b border-red-100 dark:border-red-900/30 pb-2 mb-4">
                                          <AlertTriangle className="w-5 h-5 text-red-500" />
                                          <h4 className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wider font-display">Foco Prioritário de Estudos</h4>
                                        </div>
                                        {diagnosis.reforzamento.length > 0 ? (
                                          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                            {diagnosis.reforzamento.map((item, idx) => (
                                              <li key={idx} className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                                                <span className="font-semibold text-red-900 dark:text-red-300">{item}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="text-xs text-slate-400 italic">Parabéns! Nenhum ponto de revisão obrigatório recomendado.</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action Plan step by step */}
                                    <div className="bg-slate-900 text-white p-6 rounded-xl space-y-4 shadow-xl">
                                      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-2.5">
                                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-display">Plano de Ação Inteligente Recomendado</h4>
                                      </div>
                                      
                                      <div className="space-y-3">
                                        {diagnosis.actionPlan.map((step, idx) => (
                                          <div key={idx} className="flex gap-3">
                                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold flex items-center justify-center border border-indigo-500/30 flex-shrink-0">
                                              {idx + 1}
                                            </span>
                                            <p className="text-xs text-slate-300 leading-relaxed font-light">{step}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 justify-between">
                                      <button
                                        onClick={() => {
                                          setEvalConfigured(false);
                                          setEvaluationQuestions([]);
                                          setAttempts({});
                                          setEvalFinished(false);
                                          setDiagnosis(null);
                                        }}
                                        className="border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 px-6 font-bold text-xs uppercase tracking-widest rounded"
                                      >
                                        Refazer Nova Avaliação
                                      </button>

                                      <button
                                        onClick={() => setActiveTab("chat")}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 font-bold text-xs uppercase tracking-widest rounded shadow-md"
                                      >
                                        Falar com o Tutor no Chat
                                      </button>
                                    </div>

                                  </div>
                                ) : (
                                  <div className="py-12 text-center text-slate-400">
                                    Não foi possível carregar o diagnóstico pedagógico.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* RIGHT COLUMN: REAL TIME STATS & COMPONENT BOXES */}
                        <div className="lg:col-span-4 space-y-6">
                          
                          {/* Accuracy Score Card */}
                          <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center rounded-xl shadow-sm">
                            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Porcentagem de Acerto</span>
                            
                            <div className="text-5xl font-mono font-black text-slate-900 dark:text-white flex items-baseline">
                              {overallAccuracyPercentage}
                              <span className="text-indigo-500 text-2xl font-bold ml-0.5">%</span>
                            </div>

                            {/* Text diagnosis classification */}
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-3 font-display">
                              {overallAccuracyPercentage >= 85 
                                ? "Excelente Rendimento! 🏆" 
                                : overallAccuracyPercentage >= 65 
                                ? "Bom Desempenho. 👍" 
                                : "Abaixo da Média recomendada. 📚"}
                            </p>
                            
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic leading-relaxed">
                              {overallAccuracyPercentage >= 85 
                                ? "Excelente domínio sobre o tema selecionado." 
                                : "Pratique um pouco mais os pontos de dúvida."}
                            </p>
                          </div>

                          {/* Specific Question Log Progress List */}
                          <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col shadow-sm">
                            <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                              Status das Questões
                            </h4>
                            <div className="space-y-3.5">
                              {evaluationQuestions.map((q, idx) => {
                                const attempt = attempts[q.id];
                                let statusBadge = <span className="text-[9px] text-slate-400 font-bold uppercase font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 border border-slate-200 dark:border-slate-800 rounded">Pendente</span>;
                                
                                if (attempt) {
                                  if (attempt.status === "correct") {
                                    statusBadge = <span className="text-[9px] text-emerald-600 font-bold uppercase font-mono bg-emerald-100/50 dark:bg-emerald-950/20 px-1.5 py-0.5 border border-emerald-200 dark:border-emerald-900/30 rounded">Correto</span>;
                                  } else if (attempt.status === "partial") {
                                    statusBadge = <span className="text-[9px] text-amber-600 font-bold uppercase font-mono bg-amber-100/50 dark:bg-amber-950/20 px-1.5 py-0.5 border border-amber-200 dark:border-amber-900/30 rounded">Parcial</span>;
                                  } else {
                                    statusBadge = <span className="text-[9px] text-red-600 font-bold uppercase font-mono bg-red-100/50 dark:bg-red-950/20 px-1.5 py-0.5 border border-red-200 dark:border-red-900/30 rounded">Incorreto</span>;
                                  }
                                }

                                const isCurrent = currentQuestionIndex === idx && !evalFinished;

                                return (
                                  <div 
                                    key={q.id} 
                                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                                      isCurrent 
                                        ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900 font-semibold" 
                                        : "border-transparent"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold ${
                                        isCurrent 
                                          ? "bg-indigo-500 text-white" 
                                          : attempt 
                                          ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" 
                                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                      }`}>
                                        {idx + 1}
                                      </span>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-mono uppercase leading-none mb-1">
                                          {q.type === "closed" ? "Múltipla Escolha" : "Dissertativa"}
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[120px] sm:max-w-[160px]">
                                          {q.subTopic}
                                        </span>
                                      </div>
                                    </div>
                                    {statusBadge}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>

                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

          </div>

          {/* SYSTEM KEYBOARD SHORTCUTS REFERENCE / FOOTER */}
          <footer className="h-10 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-6 sm:px-8 flex items-center gap-6 text-slate-400 dark:text-slate-500 flex-shrink-0">
            <div className="hidden sm:flex gap-4 text-[9px] font-bold uppercase">
              <span className="flex items-center gap-1">
                <kbd className="bg-white dark:bg-slate-900 px-1 py-0.5 border border-slate-300 dark:border-slate-800 rounded shadow-sm text-slate-500 dark:text-slate-300">Teoria</kbd> Explicações
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-white dark:bg-slate-900 px-1 py-0.5 border border-slate-300 dark:border-slate-800 rounded shadow-sm text-slate-500 dark:text-slate-300">Chat IA</kbd> Dúvidas
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-white dark:bg-slate-900 px-1 py-0.5 border border-slate-300 dark:border-slate-800 rounded shadow-sm text-slate-500 dark:text-slate-300">Avaliação</kbd> Quiz Inteligente
              </span>
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="text-[9px] font-bold uppercase tracking-wider">AI Monitorando Padrões de Aprendizado...</span>
            </div>
          </footer>

        </main>
      </div>

    </div>
  );
}
