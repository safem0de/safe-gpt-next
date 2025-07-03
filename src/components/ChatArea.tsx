"use client";
import { useRef, useEffect, useState } from "react";
import ChatInput from "./ChatInput";
import { useLang } from "@/contexts/LangContext";
import { TH, EN } from "@/constants/lang";
import { buildUserMessage } from "../utils/messageBuilder";
import type { ChatMessage } from "../types/chat";
import { ChatMessageRenderer } from "./ChatMessageRenderer";
import { sendChat } from "../services/chatService";
import { saveChatHistory } from '@/services/chatService';

export default function ChatArea() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { lang } = useLang();
  const t = lang === "th" ? TH : EN;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async ({text, imageFile,}: {text?: string;imageFile?: File;}) => {
    if (!text && !imageFile) return;

    const userMessage = await buildUserMessage({ text, imageFile });
    setMessages((prev) => [...prev, userMessage]);

    const assistantMessage = await sendChat([...messages, userMessage]);
    setMessages((prev) => [...prev, assistantMessage]);

    await saveChatHistory('user-123', [...messages, userMessage, assistantMessage]);
  };

  return (
    <div className="flex flex-col h-full relative bg-white">
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex mb-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded px-4 py-2 ${
                msg.role === "user"
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
