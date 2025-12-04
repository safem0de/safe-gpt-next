// services/chatService.ts
import { nanoid } from "nanoid";
import { ChatMessage } from "../types/chat";

export async function sendChat(messages: ChatMessage[], useRag: boolean): Promise<ChatMessage> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, rag: useRag }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Chat API error:", res.status, errorText);
    throw new Error(`Chat API failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();

  if (data.success === false) {
    throw new Error(data.error || "Failed to send chat");
  }

  return {
    id: nanoid(),
    role: "assistant",
    content: [{ type: "text", text: data.text }] as const,
  };
}

export async function saveChatHistory(userId: string, messages: any[]) {
  console.log("user_Id : ", userId);
  console.log("message : ", messages);

  await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, messages }),
  });
}

export async function addOrUpdateChat(userId: string,
  messages: ChatMessage[],
  oid?: string | null,
  title?: string) {

  const payload: any = {
    userId,
    messages,
    title,
    ...(oid && { _id: oid }), // เพิ่ม _id เฉพาะถ้ามี
  };

  const res = await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Add/Update chat API error:", res.status, errorText);
    throw new Error(`Failed to save chat: ${res.status} ${errorText}`);
  }

  return await res.json();
}
