import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { requireAuth } from "@/utils/auth-helper";
import { extractUserMessage, fetchRagContext } from "@/services/ragService";
import { NextResponse } from "next/server";

const AI_MODEL = process.env.AI_MODEL;

export async function POST(req: Request) {
  const userIdOrError = await requireAuth();
  if (userIdOrError instanceof NextResponse) {
    return userIdOrError;
  }

  const userId = userIdOrError;
  console.log("[chat] Authorized user:", userId);

  const { messages, rag } = await req.json();
  const userMessage = extractUserMessage(messages);
  const context = rag ? await fetchRagContext(userMessage) : "";

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

  const nonRagPrompt = `
SYSTEM """คุณคือแชทบอท AI ที่ช่วยเหลือผู้ใช้
- ตอบเป็นภาษาไทย
- สามารถใช้ความรู้ทั่วไป ไม่จำกัดแค่ context
"""
`;

  const systemPrompt = rag ? ragPrompt : nonRagPrompt;
  const recentMessages = messages.slice(-3);

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
      context,
    });
  } catch (err: any) {
    console.error("Error in POST /api/chat:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}
