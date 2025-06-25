"use client";

import { useChat } from "@ai-sdk/react";
import { TH, EN } from "@/constants/lang";
import { useLang } from "@/contexts/LangContext";

export default function ChatArea() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({});
  const { lang, setLang } = useLang();
  const t = lang === "th" ? TH : EN;

  return (
    <div className="relative h-full w-full">
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === "user" ? "User: " : "AI: "}
          {message.content}
        </div>
      ))}

      <form
        className="flex absolute bottom-0 left-0 right-0"
        onSubmit={handleSubmit}
        style={{ backdropFilter: "blur(6px)" }}
      >
        <textarea
          rows={2}
          name="prompt"
          value={input}
          onChange={handleInputChange}
          className="flex-1 px-3 py-2 rounded border-none bg-zinc-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t.askanything}
          autoComplete="off"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 mx-1 rounded transition disabled:opacity-40"
          disabled={!input.trim()}
        >
          {t.submit}
        </button>
      </form>
    </div>
  );
}
