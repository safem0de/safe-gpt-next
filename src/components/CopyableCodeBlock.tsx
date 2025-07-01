import React, { useState } from "react";

interface CopyableCodeBlockProps {
  code: string;
  language?: string;
}

const CopyableCodeBlock: React.FC<CopyableCodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      setCopied(false);
    }
  };

  return (
    <pre className="relative overflow-x-auto p-4 rounded-md text-sm bg-zinc-900 text-zinc-100 my-4">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-zinc-700 text-white opacity-80 hover:opacity-100 transition"
        aria-label="Copy code"
        type="button"
        style={{ zIndex: 1 }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <code className={`language-${language ?? ""}`}>{code}</code>
    </pre>
  );
};

export default CopyableCodeBlock;
