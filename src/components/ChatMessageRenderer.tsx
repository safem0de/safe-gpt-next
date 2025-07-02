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
              // p: ({ children }) => <p className="mb-2">{children}</p>, // ใช้แล้ว Error
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

                const shouldBeInline =
                  inline ||
                  (
                    !inline &&
                    !codeStr.includes('\n') &&
                    (
                      // html tag/single tag
                      /^<!DOCTYPE html>$/i.test(codeStr) ||
                      /^<([a-zA-Z][\w-]*)(\s+[^<>]*)?\/?>$/.test(codeStr) ||
                      /^<([a-zA-Z][\w-]*)(\s+[^<>]*)?>.*<\/\1>$/.test(codeStr) ||
                      // identifier, path, assignment, class, function, statement
                      /^[a-zA-Z0-9_.$:[\](){}"'=, \-\+\/\\<>;|*&!?%^`~]+$/.test(codeStr)
                    )
                  );


                if (shouldBeInline) {
                  return (
                    <code className="bg-zinc-200 rounded px-1 py-0.5 text-sm">
                      {codeStr}
                    </code>
                  );
                }

                const language = className?.replace("language-", "") || "";
                return (
                  <pre className="overflow-x-auto p-4 rounded-md text-sm bg-zinc-900 text-zinc-100 my-4 relative">
                    <CopyableCodeBlock code={codeStr} language={language} />
                  </pre>
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