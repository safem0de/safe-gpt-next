"use client";
import React, { useRef, useState } from "react";
import { TH, EN } from "@/constants/lang";
import { useLang } from "@/contexts/LangContext";

export default function ChatInput({
  onSend,
  placeholder,
}: {
  // รับทั้ง text, image, หรือ text+image ใน message เดียว
  onSend: (args: { text?: string; imageFile?: File }) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // รองรับ paste รูป
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          setImage(file);
          e.preventDefault();
        }
      }
    }
  };

  // รองรับเลือกไฟล์รูป
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
  };

  // ส่งข้อมูล
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() && !image) return;

    // --- DEBUG ---
    console.log("ChatInput: Submitting with value:", value);
    console.log("ChatInput: Submitting with image file:", image);
    // -------------

    onSend({ text: value.trim() || undefined, imageFile: image || undefined });
    setValue("");
    setImage(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const { lang } = useLang();
  const t = lang === "th" ? TH : EN;

  return (
    <form onSubmit={handleSubmit} method="POST" className="flex gap-2 w-full items-end">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder ?? t.askanything}
        rows={2}
        className="flex-1 px-4 py-2 rounded bg-black text-white resize-none border-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        className="px-2 py-2 rounded bg-gray-300 text-gray-700"
        onClick={() => fileInput.current?.click()}
        title="แนบรูป"
      >
        📎
      </button>
      <button
        type="submit"
        className="px-4 py-2 rounded bg-blue-600 text-white"
        disabled={!value.trim() && !image}
      >
        {t.submit}
      </button>
      {image && (
        <div className="flex flex-col items-center ml-2">
          <img
            src={URL.createObjectURL(image)}
            alt="preview"
            className="max-w-[60px] max-h-[60px] rounded border"
          />
          <button
            type="button"
            className="text-xs text-red-400 mt-1"
            onClick={() => setImage(null)}
          >
            {t.delete}
          </button>
        </div>
      )}
    </form>
  );
}
