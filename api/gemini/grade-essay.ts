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
    console.error("Erro no Vercel handler /grade-essay:", error);
    res.status(500).json({ error: error.message || "Erro interno ao avaliar resposta discursiva." });
  }
}
