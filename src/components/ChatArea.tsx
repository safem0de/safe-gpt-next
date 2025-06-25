'use client';

import { useChat } from '@ai-sdk/react';
import { TH, EN } from "@/constants/lang";
import { useLang } from "@/contexts/LangContext";

export default function ChatArea() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({});
  const { lang, setLang } = useLang();
  const t = lang === "th" ? TH : EN;

  return (
    <>
      {messages.map(message => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input name="prompt" value={input} onChange={handleInputChange} />
        <button type="submit">{t.submit}</button>
      </form>
    </>
  );
}