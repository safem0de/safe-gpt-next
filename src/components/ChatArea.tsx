// components/ChatArea.tsx

"use client";
import { useRef, useEffect, useState } from "react";
import ChatInput from "./ChatInput";
import { buildUserMessage } from "../utils/messageBuilder";
import { ChatMessageRenderer } from "./ChatMessageRenderer";
import { sendChat } from "../services/chatService";
import { addOrUpdateChat } from '@/services/chatService';
import { useChatStore } from "@/store/chat-store";
import AILoadingIndicator from "./AILoadingIndicator";
import ChatWelcome from "./ChatWelcome";
import { useSession } from "next-auth/react";


export default function ChatArea() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const chatId = useChatStore((s) => s.chatId);
  const messages = useChatStore((s) => s.messages);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const fetchChatHistory = useChatStore((s) => s.fetchChatHistory);
  const ragEnabled = useChatStore((s) => s.ragEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?.email || session?.user?.name || null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async ({ text, imageFile }: { text?: string; imageFile?: File; }) => {
    if (!text && !imageFile) return;
    if (!userId) {
      console.error("Cannot send message: user is not authenticated");
      return;
    }

    try {
      const userMessage = await buildUserMessage({ text, imageFile });
      const newMessages = [...messages, userMessage];

      // 1. **อัปเดตเฉพาะ user message ให้แสดงทันที**
      setActiveChat(chatId ?? "", newMessages);

      // 2. เริ่ม loading
      setIsLoading(true);

      // 3. เรียก API หา assistant
      const assistantMessage = await sendChat(newMessages, ragEnabled);

      // 4. หยุด loading
      setIsLoading(false);

      // 5. พอได้คำตอบ ค่อยอัปเดตแชทใน store (แสดง ai message)
      const allMessages = [...newMessages, assistantMessage];
      setActiveChat(chatId ?? "", allMessages);

      // 6. sync backend
      const res = await addOrUpdateChat(userId, allMessages, chatId);

      // 7. กรณี chat ใหม่ เอา chatId ใหม่มา set ใน store
      if (res.success && res?.chat._id && !chatId) {
        setActiveChat(res.chat._id, allMessages);
        // ดึง history ใหม่ทันทีที่สร้างแชทแรก
        await fetchChatHistory(userId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col h-full relative bg-white">
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-2">
        {messages.length === 0 && <ChatWelcome />}
        {messages.map((msg) => (
          <div
            key={msg.id ?? JSON.stringify(msg.content)}
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

        {/* 👇 AI Loading Indicator */}
        {isLoading && <AILoadingIndicator />}

        {/* 👇 ตำแหน่ง scroll ถึงสุดท้าย */}
        <div ref={bottomRef} />
      </div>
      <div className="absolute left-0 right-0 bottom-1 px-4 pb-2">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
