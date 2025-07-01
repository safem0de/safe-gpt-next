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

              code(
                {
                  inline,
                  className,
                  children,
                  ...props
                }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) {
                const codeStr = String(children).trim();

                // Case: code block ที่เป็น statement เดี่ยวๆ ไม่มีขึ้นบรรทัดใหม่ → ให้แสดงเป็น inline
                const shouldBeInline =
                  !inline &&
                  !codeStr.includes('\n') &&
                  codeStr.length < 20 &&
                  /^[a-zA-Z0-9_ ./-]+$/.test(codeStr);

                if (shouldBeInline || inline) {
                  return (
                    <code className="bg-zinc-200 rounded px-1 py-0.5 text-sm">
                      {codeStr}
                    </code>
                  );
                }
                const language = className?.replace("language-", "") || "";
                return (
                  <CopyableCodeBlock
                    code={codeStr}
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