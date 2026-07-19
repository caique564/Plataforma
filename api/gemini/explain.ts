import { GoogleGenAI } from "@google/genai";

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
    console.error("Erro no Vercel handler /explain:", error);
    res.status(500).json({ error: error.message || "Erro interno ao gerar explicação." });
  }
}
