// components/ChatMessageRenderer.tsx

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { ChatMessage } from "../types/chat";
import CopyableCodeBlock from "./CopyableCodeBlock";
import { nanoid } from "nanoid";

export function ChatMessageRenderer({
  content,
}: {
  content: ChatMessage["content"];
}) {
  if (!Array.isArray(content)) return <div>{content}</div>;

  return (
    <>
      {content.map((c) =>
        c.type === "text" ? (
          <ReactMarkdown
            key={nanoid()}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              // p: ({ children }) => <p className="mb-2">{children}</p>, // ใช้แล้ว Error
              ul: ({ children }) => (
                <ul className="list-disc ml-6">{children}</ul>
              ),
              strong: ({ children }) => (
                <strong className="font-bold">{children}</strong>
              ),
              table: ({ children }) => (
                <table className="min-w-full border text-sm my-2">{children}</table>
              ),
              thead: ({ children }) => (
                <thead className="bg-slate-100 border-b">{children}</thead>
              ),
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => <tr className="border-b">{children}</tr>,
              th: ({ children }) => (
                <th className="px-3 py-1 font-bold text-left border-r last:border-r-0">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-3 py-1 border-r last:border-r-0">{children}</td>
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
            key={nanoid()}
            src={c.image}
            alt="uploaded"
            className="max-w-xs max-h-60 my-2"
          />
        )
      )}
    </>
  );
}