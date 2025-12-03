const RAG_API_BASE_URL = process.env.RAG_API_BASE_URL || "http://localhost:8000";
const RAG_API_TOKEN_URL = process.env.RAG_API_TOKEN_URL || `${RAG_API_BASE_URL}/auth/login`;
const RAG_API_USERNAME = process.env.RAG_API_USERNAME;
const RAG_API_PASSWORD = process.env.RAG_API_PASSWORD;
const RAG_API_BEARER_TOKEN = process.env.RAG_API_BEARER_TOKEN;
const RAG_API_TOKEN_TTL_MS = Number(process.env.RAG_API_TOKEN_TTL_MS ?? 5 * 60 * 1000); // default 5 min

type RagTokenCache = { token: string; expiresAt: number } | null;
let cachedRagToken: RagTokenCache = null;

const hasValidCachedToken = (cache: RagTokenCache) =>
  !!cache && cache.expiresAt > Date.now() + 5_000;

async function loginToRag(): Promise<string> {
  if (!RAG_API_USERNAME || !RAG_API_PASSWORD) {
    throw new Error("RAG API credentials missing. Set RAG_API_USERNAME and RAG_API_PASSWORD.");
  }

  const res = await fetch(RAG_API_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: RAG_API_USERNAME, password: RAG_API_PASSWORD }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`RAG login failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const token: string | undefined =
    data.access_token || data.token || data.accessToken;

  if (!token) {
    throw new Error("RAG login response did not include an access token.");
  }

  const ttl = Number.isFinite(RAG_API_TOKEN_TTL_MS) ? RAG_API_TOKEN_TTL_MS : 5 * 60 * 1000;
  cachedRagToken = { token, expiresAt: Date.now() + ttl };
  return token;
}

export async function getRagAccessToken(forceRefresh = false): Promise<string | null> {
  // If user provides a static bearer token, prefer that.
  if (RAG_API_BEARER_TOKEN && !forceRefresh) {
    return RAG_API_BEARER_TOKEN;
  }

  if (!forceRefresh && hasValidCachedToken(cachedRagToken)) {
    return cachedRagToken!.token;
  }

  try {
    return await loginToRag();
  } catch (error) {
    console.error("Failed to get RAG token:", error);
    return null;
  }
}
