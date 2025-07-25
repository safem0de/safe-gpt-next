// services/chatService.ts
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

  return await res.json();
}