import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { requireAuth } from "@/utils/auth-helper";
import { NextResponse } from "next/server";

const AI_MODEL = process.env.AI_MODEL;
const RAG_API_BASE_URL = process.env.RAG_API_BASE_URL || "http://localhost:8000";

export async function POST(req: Request) {
  // ✅ Require authentication
  const userIdOrError = await requireAuth();
  if (userIdOrError instanceof NextResponse) {
    return userIdOrError; // Return 401 error
  }
  const { messages, rag } = await req.json();
  const lastMessage = messages[messages.length - 1];
  const userMessage = typeof lastMessage.content === "string"
    ? lastMessage.content
    : lastMessage.content[0].text || "";

  let context = "";
  if (rag) {
    // 🔹 ดึงข้อมูลจาก backend RAG API
    const ragRes = await fetch(
      `${RAG_API_BASE_URL}/api/retrieve?query=${encodeURIComponent(
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
    // const matches = ragJson.results ?? ragJson.matches ?? [];
    const matches = ragJson.results ?? ragJson.matches ?? ragJson.data ?? [];
    const filtered = matches.filter((r: any) => (r.rerank_score ?? r.score ?? 0) > 0.7);
    if (Array.isArray(matches) && matches.length > 0) {
      context = filtered
        .map((r: any) => {
          const page = r.payload?.page ?? "ไม่ทราบหน้า";
          const source = r.payload?.source ?? "";
          const summary = r.payload?.summary ?? "";
          const rerankScore = r.rerank_score ?? r.score ?? 0; // ใช้ rerank score ถ้ามี
          return `[แหล่ง: ${source}, หน้า: ${page}, คะแนน: ${rerankScore.toFixed(2)}]\n${r.payload?.text}\n\n${summary}`;
        })
        .filter(Boolean) // กรอง string พวก undefined, null, '', 0, false ออกหมด
        .join("\n\n");
    }
    console.log(`👍 RAG Response: ${matches.length} matches, context length:${context.length}`);
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
  const recentMessages = messages.slice(-3); // ใช้แค่ 3 ข้อความล่าสุด
  try {
    const result = await generateText({
      model: google(AI_MODEL as string),
      messages: [
        { role: "system", content: systemPrompt },
        ...recentMessages,
      ],
      temperature: rag ? 0.4 : 0.5,
      maxTokens: 2048,
    });

    return Response.json({
      text: result.text,
      context, // ส่ง context กลับไปให้ frontend debug ได้
    });
  } catch (err: any) {
    console.error("Error in POST /api/chat:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}
