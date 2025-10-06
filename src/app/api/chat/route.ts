import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const AI_MODEL = process.env.AI_MODEL;

export async function POST(req: Request) {
  const { messages, rag } = await req.json();
  const userMessage = messages[messages.length - 1].content[0].text;

  let context = "";
  if (rag) {
    // 🔹 ดึงข้อมูลจาก backend RAG API
    const ragRes = await fetch(
      `http://localhost:8000/api/retrieve?query=${encodeURIComponent(
        userMessage
      )}&top_k=15`
    );

    if (!ragRes.ok) {
      const errText = await ragRes.text();
      console.error("❌ Backend error:", errText);
      throw new Error(`RAG API failed: ${errText}`);
    }
    const ragJson = await ragRes.json();

    // ใช้ results ที่ backend ส่งมา
    const matches = ragJson.results ?? ragJson.matches ?? [];
    if (Array.isArray(matches) && matches.length > 0) {
      context = matches
        .map((r: any) => {
          const page = r.payload?.page ?? "ไม่ทราบหน้า";
          const source = r.payload?.source ?? "";
          const summary = r.payload?.summary ?? "";
          const rerankScore = r.rerank_score ?? r.score ?? 0; // ใช้ rerank score ถ้ามี
          return `[แหล่ง: ${source}, หน้า: ${page}, คะแนน: ${rerankScore.toFixed(2)}]\n${r.payload?.text}\n\n${summary}`;
        })
        .filter((t: string) => t)
        .join("\n\n");
    }
  }

  // 🎯 system prompt สำหรับ RAG mode
  const ragPrompt = `
SYSTEM """คุณคือผู้ช่วย AI สำหรับเอกสาร
- ใช้ข้อมูลจาก context ข้างล่างนี้เท่านั้น
- ถ้าผู้ใช้ถาม ให้ระบุหน้าที่พบ และ source
- ห้ามแต่งเรื่อง ห้ามเดาจากภายนอกเอกสาร
- ทบทวนคำถามและเช็คอีกครั้งก่อนตอบ
- ตอบเป็นภาษาไทย

Context:
${context}
"""
`;

  // 🎯 system prompt สำหรับ Non-RAG mode
  const nonRagPrompt = `
SYSTEM """คุณคือแชทบอท AI ที่ช่วยเหลือผู้ใช้
- ตอบเป็นภาษาไทย
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
    temperature: rag ? 0.5 : 0.7,
    maxTokens: 2048,
  });

  return Response.json({
    text: result.text,
    context, // ส่ง context กลับไปให้ frontend debug ได้
  });
}
