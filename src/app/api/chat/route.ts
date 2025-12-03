import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { requireAuth } from "@/utils/auth-helper";
import { getRagAccessToken } from "@/services/ragAuthService";
import { NextResponse } from "next/server";

const AI_MODEL = process.env.AI_MODEL;
const RAG_API_BASE_URL = process.env.RAG_API_BASE_URL || "http://localhost:8000";
const RAG_API_BEARER_TOKEN = process.env.RAG_API_BEARER_TOKEN;

export async function POST(req: Request) {
  // Require authentication
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
    const url = `${RAG_API_BASE_URL}/api/retrieve?query=${encodeURIComponent(
      userMessage
    )}&top_k=15`;

    const buildHeaders = (token: string | null): HeadersInit => {
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return headers;
    };

    let token = await getRagAccessToken(false);
    let ragRes = await fetch(url, { headers: buildHeaders(token) });

    // Retry once on 401 in case token expired
    if (ragRes.status === 401 && !RAG_API_BEARER_TOKEN) {
      token = await getRagAccessToken(true);
      ragRes = await fetch(url, { headers: buildHeaders(token) });
    }

    if (!ragRes.ok) {
      const errText = await ragRes.text();
      console.error("Backend error:", ragRes.status, errText);
      throw new Error(`RAG API failed: ${errText}`);
    }

    const ragJson = await ragRes.json();
    const matches = ragJson.results ?? ragJson.matches ?? ragJson.data ?? [];
    const filtered = matches.filter((r: any) => (r.rerank_score ?? r.score ?? 0) > 0.7);
    const finalMatches = filtered.length > 0 ? filtered : matches;

    if (Array.isArray(finalMatches) && finalMatches.length > 0) {
      context = finalMatches
        .slice(0, 8)
        .map((r: any) => {
          const page = r.payload?.page ?? "unknown-page";
          const source = r.payload?.source ?? "";
          const summary = r.payload?.summary ?? "";
          const rerankScore = r.rerank_score ?? r.score ?? 0;
          return `[source: ${source}, page: ${page}, score: ${rerankScore.toFixed(2)}]\n${r.payload?.text}\n\n${summary}`;
        })
        .filter(Boolean)
        .join("\n\n");
    }

    console.log(`RAG Response: ${matches.length} matches, context length:${context.length}`);
  }

  const ragPrompt = `
SYSTEM """คุณคือผู้ช่วยภาษาไทย ตอบโดยอ้างอิงข้อมูลใน Context ด้านล่างเท่านั้น
- ต้องอ้างอิงที่มา (source) และหน้าหรือหัวข้อ (page) หากมีให้
- หากข้อมูลไม่พอ ให้ตอบว่ายังไม่ทราบหรือข้อมูลไม่เพียงพอ
"""
`;

  const nonRagPrompt = `
SYSTEM """คุณคือผู้ช่วยภาษาไทยที่ตอบให้กระชับ ชัดเจน และเป็นประโยชน์
- ถ้าไม่แน่ใจ ให้บอกว่ายังไม่แน่ใจ
"""
`;

  const systemPrompt = rag ? ragPrompt : nonRagPrompt;
  const recentMessages = messages.slice(-3); // keep recent messages small

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
      context, // include context for frontend debug
    });
  } catch (err: any) {
    console.error("Error in POST /api/chat:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}
