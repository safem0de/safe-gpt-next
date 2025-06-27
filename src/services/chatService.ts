import { ChatMessage } from "../types/chat";

export async function sendChat(messages: ChatMessage[]): Promise<ChatMessage> {
  const res = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });

  const data = await res.json();

  return {
    role: "assistant",
    content: [{ type: "text", text: data.text }] as const,
  };
}
