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
      console.log(`CopyableCodeBlock Error: ${err}`);
    }
  };

  return (
    <div className="relative my-4">
      <button
        onClick={handleCopy}
        className="absolute top-0 right-2 px-2 py-1 text-xs rounded bg-zinc-700 text-white opacity-80 hover:opacity-100 transition"
        aria-label="Copy code"
        type="button"
        style={{ zIndex: 1 }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="overflow-x-auto rounded-md text-sm bg-zinc-900 text-zinc-100">
        <code className={`language-${language ?? ""}`}>{code}</code>
      </pre>
    </div>
  );

};

export default CopyableCodeBlock;
