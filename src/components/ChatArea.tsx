// components/ChatArea.tsx

"use client";
import { useRef, useEffect } from "react";
import ChatInput from "./ChatInput";
// import { useLang } from "@/contexts/LangContext";
// import { TH, EN } from "@/constants/lang";
import { buildUserMessage } from "../utils/messageBuilder";
import { ChatMessageRenderer } from "./ChatMessageRenderer";
import { sendChat } from "../services/chatService";
import { addOrUpdateChat } from '@/services/chatService';
import { useChatStore } from "@/store/chat-store";


export default function ChatArea() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  // const { lang } = useLang();
  // const t = lang === "th" ? TH : EN;

  const chatId = useChatStore((s) => s.chatId);
  const messages = useChatStore((s) => s.messages);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const fetchChatHistory = useChatStore((s) => s.fetchChatHistory);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async ({ text, imageFile }: { text?: string; imageFile?: File; }) => {
    if (!text && !imageFile) return;

    const userMessage = await buildUserMessage({ text, imageFile });
    const newMessages = [...messages, userMessage];

    // 1. **อัปเดตเฉพาะ user message ให้แสดงทันที**
    setActiveChat(chatId ?? "", newMessages);

    // 2. เรียก API หา assistant (อาจโชว์ loading, หรือ dummy ai typing)
    const assistantMessage = await sendChat(newMessages);

    // 3. พอได้คำตอบ ค่อยอัปเดตแชทใน store (แสดง ai message)
    const allMessages = [...newMessages, assistantMessage];
    setActiveChat(chatId ?? "", allMessages);

    // 4. sync backend
    const res = await addOrUpdateChat('user-123', allMessages, chatId);

    // 5. กรณี chat ใหม่ เอา chatId ใหม่มา set ใน store
    if (res.success && res?.chat._id && !chatId) {
      setActiveChat(res.chat._id, allMessages);
      // ดึง history ใหม่ทันทีที่สร้างแชทแรก
      await fetchChatHistory('user-123');
    }
  };


  return (
    <div className="flex flex-col h-full relative bg-white">
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex mb-3 ${msg.role === "user" ? "justify-end" : "justify-start"
              }`}
          >
            <div
              className={`rounded px-4 py-2 ${msg.role === "user"
                ? "bg-slate-900 text-white max-w-lg ml-auto text-right"
                : "bg-slate-100 text-black w-full max-w-2xl text-left"
                }`}
            >
              <ChatMessageRenderer content={msg.content} />
            </div>
          </div>
        ))}
        {/* 👇 ตำแหน่ง scroll ถึงสุดท้าย */}
        <div ref={bottomRef} />
      </div>
      <div className="absolute left-0 right-0 bottom-1 px-4 pb-2">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
