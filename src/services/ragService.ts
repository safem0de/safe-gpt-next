import type { ChatMessage } from "@/types/chat";

const RAG_API_BASE_URL = process.env.RAG_API_BASE_URL || "http://localhost:8000";
const RAG_USER = process.env.RAG_USER;
const RAG_PASS = process.env.RAG_PASS;
const RAG_AUTH_URL = process.env.RAG_AUTH_URL || `${RAG_API_BASE_URL}/auth/login`;

type RagTokenCache = {
  token: string;
  expiresAt: number;
} | null;

let ragTokenCache: RagTokenCache = null;

function base64UrlDecode(value: string): string {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded =
    normalized + "===".slice((normalized.length + 3) % 4); // pad to multiple of 4
  if (typeof atob === "function") {
    return atob(padded);
  }
  return Buffer.from(padded, "base64").toString("binary");
}

function decodeJwtExpiry(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const decoded = JSON.parse(base64UrlDecode(payload));
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function getRagAccessToken(): Promise<string | null> {
  if (!RAG_AUTH_URL || !RAG_USER || !RAG_PASS) {
    console.warn("[RAG] Missing auth configuration, skip login");
    return null;
  }

  if (ragTokenCache && ragTokenCache.expiresAt > Date.now()) {
    return ragTokenCache.token;
  }

  const body = new URLSearchParams({
    username: RAG_USER,
    password: RAG_PASS,
  });

  const loginRes = await fetch(RAG_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  if (!loginRes.ok) {
    const errText = await loginRes.text();
    throw new Error(`RAG auth failed: ${loginRes.status} ${errText}`);
  }

  const loginJson = await loginRes.json();
  const accessToken = loginJson.access_token as string | undefined;

  if (!accessToken) {
    throw new Error("RAG auth response missing access_token");
  }

  const decodedExpiry = decodeJwtExpiry(accessToken);
  const safetyWindow = 60 * 1000;
  const fallbackExpiry = Date.now() + 55 * 60 * 1000;
  const expiresAt = (decodedExpiry ?? fallbackExpiry) - safetyWindow;

  ragTokenCache = {
    token: accessToken,
    expiresAt,
  };

  return accessToken;
}

async function buildRagHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const ragAccessToken = await getRagAccessToken();

  if (ragAccessToken) {
    headers.Authorization = `Bearer ${ragAccessToken}`;
  } else if (RAG_USER && RAG_PASS) {
    const encoded = Buffer.from(`${RAG_USER}:${RAG_PASS}`).toString("base64");
    headers.Authorization = `Basic ${encoded}`;
  }

  return headers;
}

export async function fetchRagContext(userMessage: string): Promise<string> {
  try {
    const headers = await buildRagHeaders();
    const ragRes = await fetch(
      `${RAG_API_BASE_URL}/api/retrieve?query=${encodeURIComponent(
        userMessage
      )}&top_k=15`,
      { headers }
    );

    if (!ragRes.ok) {
      const errText = await ragRes.text();
      throw new Error(`status ${ragRes.status}: ${errText}`);
    }

    const ragJson = await ragRes.json();
    const matches = ragJson.results ?? ragJson.matches ?? ragJson.data ?? [];
    const context = formatRagMatches(matches);
    console.log(`[RAG] matches=${matches.length} contextLen=${context.length}`);
    return context;
  } catch (error) {
    console.error("❌ Backend error:", error);
    return "";
  }
}

export function extractUserMessage(messages: ChatMessage[]): string {
  const lastMessage = messages.at(-1);
  if (!lastMessage) {
    return "";
  }
  if (typeof lastMessage.content === "string") {
    return lastMessage.content;
  }
  const textPart = lastMessage.content.find(
    (part): part is Extract<ChatMessage["content"][number], { type: "text" }> =>
      part.type === "text"
  );
  return textPart?.text ?? "";
}

function formatRagMatches(matches: any[]): string {
  const filtered = matches.filter((r: any) => (r.rerank_score ?? r.score ?? 0) > 0.7);
  const finalMatches = filtered.length > 0 ? filtered : matches;
  if (!Array.isArray(finalMatches) || finalMatches.length === 0) {
    return "";
  }

  return finalMatches
    .slice(0, 8)
    .map((r: any) => {
      const page = r.payload?.page ?? "ไม่ทราบหน้า";
      const source = r.payload?.source ?? "";
      const summary = r.payload?.summary ?? "";
      const rerankScore = r.rerank_score ?? r.score ?? 0;
      return `[แหล่ง: ${source}, หน้า: ${page}, คะแนน: ${rerankScore.toFixed(2)}]\n${r.payload?.text}\n\n${summary}`;
    })
    .filter(Boolean)
    .join("\n\n");
}
