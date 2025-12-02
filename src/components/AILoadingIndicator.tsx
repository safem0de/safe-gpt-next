// components/AILoadingIndicator.tsx

"use client";

interface AILoadingIndicatorProps {
  message?: string;
}

export default function AILoadingIndicator({
  message = "AI กำลังคิดคำตอบ..."
}: AILoadingIndicatorProps) {
  return (
    <div className="flex mb-3 justify-start">
      <div className="rounded px-4 py-3 bg-slate-100 text-black w-full max-w-2xl text-left">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <span className="text-sm text-slate-500">{message}</span>
        </div>
      </div>
    </div>
  );
}
