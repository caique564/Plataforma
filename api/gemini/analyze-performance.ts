import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { subject, level, performanceData } = req.body;

    if (!subject || !level || !performanceData) {
      return res.status(400).json({ error: "Parâmetros de desempenho incompletos." });
    }

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
    console.error("Erro no Vercel handler /analyze-performance:", error);
    res.status(500).json({ error: error.message || "Erro interno ao gerar diagnóstico final." });
  }
}
