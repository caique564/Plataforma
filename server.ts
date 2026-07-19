import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

// Initialize Gemini client on server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Server-side API Endpoints

// 1. Initial Material Explanation Generation
app.post("/api/gemini/explain", async (req, res) => {
  try {
    const { subject, level } = req.body;
    if (!subject || !level) {
      return res.status(400).json({ error: "Assunto e nível são obrigatórios." });
    }

    const prompt = `Crie um material didático completo, altamente estruturado e aprofundado sobre o assunto: "${subject}".
O nível de entendimento do estudante é: "${level}".
Adapte a linguagem e a complexidade conceitual de acordo com este nível.

O material deve conter obrigatoriamente:
1. Uma introdução cativante sobre o assunto.
2. Explicações detalhadas dos conceitos-chave (use formatação Markdown para criar tópicos, sub-tópicos relevantes e termos destacados em negrito).
3. Exemplos práticos do dia a dia, analógicos ou técnicos relevantes a este nível.
4. Um resumo rápido dos pontos essenciais.

Escreva tudo em Português. Mantenha um tom encorajador, instrutivo e didático de um tutor acadêmico de excelência.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é um tutor acadêmico especializado e amigável. Suas explicações devem ser claras, bem estruturadas em Markdown e adaptadas com perfeição ao nível de entendimento fornecido pelo usuário.",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Erro na rota /explain:", error);
    res.status(500).json({ error: error.message || "Erro interno ao gerar explicação." });
  }
});

// 2. Chat with Tutor
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, subject, level } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Mensagens inválidas ou ausentes." });
    }

    // Format historical messages for Gemini chats.create
    // Each message has role: 'user' | 'model' and text
    const chatHistory = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // The current message to send is the last user message
    const lastUserMessage = chatHistory[chatHistory.length - 1];
    const historyBeforeLast = chatHistory.slice(0, chatHistory.length - 1);

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      history: historyBeforeLast,
      config: {
        systemInstruction: `Você é um tutor de IA especializado engajado em uma conversa de estudos sobre o assunto "${subject}" no nível de entendimento "${level}".
Responda de forma direta, clara, educativa e use Markdown para tornar as explicações visualmente agradáveis e organizadas.
Forneça exemplos práticos sempre que apropriado. Se o usuário fugir muito do tema "${subject}", tente gentilmente trazê-lo de volta ao foco dos estudos.`,
      },
    });

    const response = await chat.sendMessage({
      message: lastUserMessage.parts[0].text,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Erro na rota /chat:", error);
    res.status(500).json({ error: error.message || "Erro interno ao processar chat." });
  }
});

// 3. Generate structured quiz evaluation
app.post("/api/gemini/generate-evaluation", async (req, res) => {
  try {
    const { subject, level, numQuestions, difficulty, numOpenQuestions } = req.body;

    if (!subject || !level) {
      return res.status(400).json({ error: "Assunto e nível são obrigatórios." });
    }

    const nTotal = parseInt(numQuestions) || 5;
    const nOpen = parseInt(numOpenQuestions) || 0;
    const nClosed = Math.max(0, nTotal - nOpen);

    let difficultyInstruction = "";
    if (difficulty === "escaldante") {
      difficultyInstruction = `A dificuldade deve ser escalonada progressivamente (começando com questões fáceis, passando por médias e terminando em difíceis). Por exemplo, para um total de ${nTotal} questões, ordene-as de forma que as primeiras sejam de dificuldade 'fácil', as do meio 'médio' e as últimas 'difícil'.`;
    } else {
      difficultyInstruction = `Todas as questões geradas devem ter o nível de dificuldade configurado estritamente como '${difficulty}'.`;
    }

    const prompt = `Crie uma avaliação acadêmica sobre o assunto: "${subject}" para um estudante no nível "${level}".
Gere um total de exatamente ${nTotal} questões, sendo exatamente:
- ${nClosed} questões fechadas (múltipla escolha com 4 opções de A a D).
- ${nOpen} questões abertas (dissertativas de resposta curta/média escrita pelo usuário).

Dificuldade das questões:
${difficultyInstruction}

Para cada questão fechada (tipo 'closed'), defina:
1. Texto da pergunta (pergunta clara e baseada em conceitos corretos do assunto).
2. Quatro opções de resposta estruturadas em uma lista de strings (Ex: ["Opção A", "Opção B", "Opção C", "Opção D"]).
3. O índice da opção correta (correctOptionIndex, onde 0 = A, 1 = B, 2 = C, 3 = D).
4. Uma explicação detalhada contendo o porquê de aquela ser a alternativa correta e o erro das outras.
5. Um sub-tópico específico do assunto geral correspondente a essa questão (Ex: se o assunto é 'Física Térmica', o sub-tópico pode ser 'Escalas de Temperatura' ou 'Dilatação Térmica'). Isso ajudará a avaliar o desempenho do aluno.

Para cada questão aberta (tipo 'open'), defina:
1. Texto da pergunta.
2. Critérios de resposta ideal (idealCriteria) explicando de forma sucinta quais palavras-chave, conceitos ou abordagens o aluno deve incluir em seu texto para que a resposta seja considerada correta.
3. Uma explicação didática e detalhada da resposta ideal.
4. Um sub-tópico específico do assunto correspondente à questão.

Gere as questões estruturadas em formato JSON válido conforme o esquema especificado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["questions"],
          properties: {
            questions: {
              type: Type.ARRAY,
              description: "Lista de questões geradas para a avaliação.",
              items: {
                type: Type.OBJECT,
                required: ["id", "type", "difficulty", "text", "subTopic", "explanation"],
                properties: {
                  id: { type: Type.STRING, description: "Identificador único da questão (ex: q1, q2)." },
                  type: { type: Type.STRING, description: "Tipo da questão: 'closed' para múltipla escolha ou 'open' para dissertativa." },
                  difficulty: { type: Type.STRING, description: "Nível de dificuldade individual da questão: 'fácil', 'médio' ou 'difícil'." },
                  text: { type: Type.STRING, description: "O enunciado da pergunta." },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Lista de 4 alternativas para questões fechadas. Deixe vazio ou nulo para questões abertas."
                  },
                  correctOptionIndex: {
                    type: Type.INTEGER,
                    description: "Índice de 0 a 3 da alternativa correta para questões fechadas. Deixe vazio ou -1 para abertas."
                  },
                  idealCriteria: {
                    type: Type.STRING,
                    description: "Palavras-chave e conceitos obrigatórios esperados na resposta de questões abertas. Vazio para fechadas."
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "Explicação profunda e detalhada da resposta correta."
                  },
                  subTopic: {
                    type: Type.STRING,
                    description: "O sub-tópico específico do assunto avaliado por esta questão para fins estatísticos de foco de estudo."
                  }
                }
              }
            }
          }
        }
      }
    });

    const jsonText = response.text || "{}";
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error("Erro na rota /generate-evaluation:", error);
    res.status(500).json({ error: error.message || "Erro interno ao gerar avaliação." });
  }
});

// 4. Grade/evaluate open/essay question answer
app.post("/api/gemini/grade-essay", async (req, res) => {
  try {
    const { questionText, userAnswer, idealCriteria, explanation, subject, level } = req.body;

    if (!questionText || userAnswer === undefined) {
      return res.status(400).json({ error: "Faltam parâmetros obrigatórios para avaliação da resposta dissertativa." });
    }

    const prompt = `Analise e avalie de forma construtiva a resposta do aluno a uma questão aberta sobre o assunto "${subject}" (Nível: "${level}").

Dados da Questão:
- Enunciado da Pergunta: "${questionText}"
- Critérios de Resposta Esperados: "${idealCriteria || ""}"
- Explicação da Resposta Correta: "${explanation || ""}"

Resposta Escrita pelo Aluno:
"${userAnswer}"

Você deve retornar uma avaliação estruturada em formato JSON contendo:
1. "score": Uma nota de 0 a 100 de acordo com o nível de corretude conceitual e adequação aos critérios. Se a resposta for vazia ou totalmente incorreta, dê 0. Se for impecável, dê 100.
2. "status": Uma classificação em string sendo 'correct' (para nota >= 75), 'partial' (para nota entre 40 e 74) ou 'incorrect' (para nota < 40).
3. "feedback": Um comentário pedagógico detalhado explicando o que o aluno acertou, o que ele errou ou esqueceu de mencionar, e qual a resposta ideal de maneira clara e acolhedora.

Forneça a saída estritamente em JSON de acordo com o esquema de resposta.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["score", "status", "feedback"],
          properties: {
            score: { type: Type.INTEGER, description: "Pontuação atribuída de 0 a 100." },
            status: { type: Type.STRING, description: "Classificação: 'correct', 'partial' ou 'incorrect'." },
            feedback: { type: Type.STRING, description: "Feedback explicativo detalhado em português, apontando os erros e acertos do estudante." }
          }
        }
      }
    });

    const jsonText = response.text || "{}";
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error("Erro na rota /grade-essay:", error);
    res.status(500).json({ error: error.message || "Erro interno ao avaliar resposta discursiva." });
  }
});

// 5. Generate final focus performance diagnosis
app.post("/api/gemini/analyze-performance", async (req, res) => {
  try {
    const { subject, level, performanceData } = req.body;

    if (!subject || !level || !performanceData) {
      return res.status(400).json({ error: "Parâmetros de desempenho incompletos." });
    }

    // performanceData is an array of { text, type, subTopic, status, score, explanation, userAnswer, feedback }
    const resultsSummary = performanceData.map((item: any, i: number) => {
      return `Questão ${i + 1} (${item.type === "closed" ? "Múltipla Escolha" : "Dissertativa"}):
- Sub-tópico: ${item.subTopic}
- Enunciado: ${item.text}
- Status: ${item.status === "correct" ? "Correto" : item.status === "partial" ? "Parcialmente Correto" : "Incorreto"} (Nota: ${item.score}/100)
- Resposta do usuário: ${item.userAnswer || "N/A"}
- Feedback/Explicação dada: ${item.feedback || item.explanation || "N/A"}`;
    }).join("\n\n");

    const prompt = `Analise o desempenho geral de um estudante na avaliação sobre o assunto "${subject}" no nível de entendimento "${level}".
Abaixo está o resumo detalhado de cada questão respondida pelo aluno, incluindo o sub-tópico de cada uma, o resultado obtido e as respostas fornecidas:

${resultsSummary}

Gere um diagnóstico pedagógico de alto nível estruturado em formato JSON contendo:
1. "overallSummary": Um parágrafo resumindo o desempenho geral do estudante, parabenizando pelos pontos fortes e fornecendo incentivo sincero.
2. "strengths": Lista de strings detalhando os conceitos ou sub-tópicos onde o aluno demonstrou excelente domínio conceitual.
3. "reforzamento": Lista de sub-tópicos específicos ou partes do assunto principal que o estudante demonstrou dificuldade e que de acordo com as respostas **precisam ser obrigatoriamente reforçados com novos estudos para a melhora do aprendizado**.
4. "actionPlan": Um plano de ação estruturado em tópicos, mostrando exatamente onde o aluno deve priorizar o foco nos estudos para preencher as lacunas encontradas.

Escreva tudo de forma primorosa em Português e devolva estritamente no formato JSON conforme o esquema solicitado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["overallSummary", "strengths", "reforzamento", "actionPlan"],
          properties: {
            overallSummary: { type: Type.STRING, description: "Resumo amigável e incentivador sobre o desempenho geral do aluno." },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de sub-tópicos ou conceitos dominados pelo aluno."
            },
            reforzamento: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de partes do assunto que precisam ser revisadas com urgência (foco prioritário)."
            },
            actionPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Tópicos de ações práticas recomendadas para direcionar os estudos futuros de forma inteligente."
            }
          }
        }
      }
    });

    const jsonText = response.text || "{}";
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error("Erro na rota /analyze-performance:", error);
    res.status(500).json({ error: error.message || "Erro interno ao gerar diagnóstico final." });
  }
});

// Vite Middleware & Production File Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode: integration with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware loaded.");
  } else {
    // Production mode: Serve static client assets built into /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static build routing active.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express dev server running on http://localhost:${PORT}`);
  });
}

startServer();
