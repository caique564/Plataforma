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
    const { messages, subject, level } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Mensagens inválidas ou ausentes." });
    }

    // Format historical messages for Gemini chats.create
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
    console.error("Erro no Vercel handler /chat:", error);
    res.status(500).json({ error: error.message || "Erro interno ao processar chat." });
  }
}
