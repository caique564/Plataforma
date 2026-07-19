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
    console.error("Erro no Vercel handler /generate-evaluation:", error);
    res.status(500).json({ error: error.message || "Erro interno ao gerar avaliação." });
  }
}
