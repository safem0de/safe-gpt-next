import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const AI_MODEL = process.env.AI_MODEL;

export async function POST(req: Request) {
  const { messages, rag } = await req.json();
  const userMessage = messages[messages.length - 1].content[0].text;

  let context = "";
  if (rag) {
    const ragRes = await fetch(
      `http://localhost:8000/api/retrieve?query=${encodeURIComponent(userMessage)}`
    );
    const ragJson = await ragRes.json();

    const matches = ragJson.results ?? ragJson.matches ?? [];
    if (Array.isArray(matches) && matches.length > 0) {
      context = matches
        .map((r: any) => r.payload?.text ?? "")
        .filter((t: string) => t)
        .join("\n\n");
    }
  }

  // 🎯 system prompt สำหรับ RAG mode
  const ragPrompt = `
PARAMETER repeat_penalty 1.08
PARAMETER temperature 0.5
PARAMETER num_ctx 4096

SYSTEM """You are a professional document AI assistant.

- ใช้ข้อมูลจาก context ข้างล่างนี้เท่านั้น
- ถ้าผู้ใช้ถาม ให้ระบุหน้าที่พบ และถ้ามีภาพให้ใส่ [ภาพ: pic_x_x.jpeg]
- ตอบเป็นภาษาไทยเสมอ
- ห้ามแต่งเรื่อง ห้ามเดาเพิ่มจากภายนอกเอกสาร

Context:
${context}
"""
`;

  // 🎯 system prompt สำหรับ Non-RAG mode
  const nonRagPrompt = `
SYSTEM """You are a helpful AI chatbot.
- ตอบเป็นภาษาไทยที่สุภาพ
- สามารถใช้ความรู้ทั่วไป ไม่จำกัดแค่ context
"""
`;

  const systemPrompt = rag ? ragPrompt : nonRagPrompt;

  const result = await generateText({
    model: google(AI_MODEL as string),
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature: rag ? 0.5 : 0.5,
    maxTokens: 4096,
  });

  return Response.json({
    text: result.text,
  });
}
