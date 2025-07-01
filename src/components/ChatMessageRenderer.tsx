import React from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "../types/chat";
import CopyableCodeBlock from "./CopyableCodeBlock";

export function ChatMessageRenderer({
  content,
}: {
  content: ChatMessage["content"];
}) {
  if (!Array.isArray(content)) return <div>{content}</div>;

  return (
    <>
      {content.map((c, i) =>
        c.type === "text" ? (
          <ReactMarkdown
            key={i}
            components={{
              p: ({ children }) => <p className="mb-2">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc ml-6">{children}</ul>
              ),
              strong: ({ children }) => (
                <strong className="font-bold">{children}</strong>
              ),
              code({ children, className, ...props }) {
                // ถ้ามี className และเป็น block code
                const isBlock = className && className.startsWith("language-");
                if (!isBlock) {
                  // inline code
                  return (
                    <code className="bg-zinc-200 rounded px-1 py-0.5 text-sm">
                      {children}
                    </code>
                  );
                }
                // code block
                const language = className?.replace("language-", "") || "";
                return (
                  <CopyableCodeBlock
                    code={String(children).replace(/\n$/, "")}
                    language={language}
                  />
                );
              },
            }}
          >
            {c.text}
          </ReactMarkdown>
        ) : (
          <img
            key={i}
            src={c.image}
            alt="uploaded"
            className="max-w-xs max-h-60 my-2"
          />
        )
      )}
    </>
  );
}