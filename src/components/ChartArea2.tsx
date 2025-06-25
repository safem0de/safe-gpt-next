"use client";
import { useChat } from "@ai-sdk/react";
import ChatInput from "./ChatInput"; // <- ใช้อันข้างบน
import { useLang } from "@/contexts/LangContext";
import { TH, EN } from "@/constants/lang";

export default function ChatArea() {
  // ใช้ useChat แต่ไม่ใช้ handleSubmit ตรงๆ
  const { messages, append } = useChat({});
  const { lang } = useLang();
  const t = lang === "th" ? TH : EN;

  // ฟังก์ชันรับจาก ChatInput
  // const handleSend = async ({
  //   text,
  //   imageFile,
  // }: {
  //   text?: string;
  //   imageFile?: File;
  // }) => {
  //   // case 1: ข้อความล้วน
  //   if (text && !imageFile) {
  //     console.log("Text only:", text);
  //     await append({ role: "user", content: text });
  //     return;
  //   }

  //   // case 2: รูปอย่างเดียว หรือ รูป+ข้อความ
  //   if (imageFile) {
  //     const reader = new FileReader();
  //     reader.onload = async (e) => {
  //       const base64 = e.target?.result as string;
  //       // --- DEBUG ---
  //       console.log(
  //         "ChatArea: Base64 string generated:",
  //         base64.substring(0, 100) + "..."
  //       ); // แสดงแค่ส่วนหัวพอ
  //       // -------------

  //       // case 2.1: รูป + ข้อความ
  //       if (text) {
  //         console.log("Text:", text);
  //         console.log("Image file:", imageFile);
  //         console.log("Base64 string:", base64);
  //         // ส่งข้อความและรูปภาพ
  //         await append({
  //           role: "user",
  //           content: [
  //             { type: "text", text },
  //             { type: "image", image: base64, mimeType: imageFile.type },
  //           ] as any,
  //         });
  //       } else {
  //         // case 2.2: รูปอย่างเดียว
  //         console.log("Image file (Only):", imageFile);
  //         console.log("Base64 string:", base64);
  //         await append({
  //           role: "user",
  //           content: [
  //             { type: "image", image: base64, mimeType: imageFile.type },
  //           ] as any,
  //         });
  //       }

  //     };
  //     reader.readAsDataURL(imageFile);
  //   }
  // };
  const handleSend = async ({
    text,
    imageFile,
  }: {
    text?: string;
    imageFile?: File;
  }) => {
    // case 1: ข้อความล้วน (เหมือนเดิม)
    if (text && !imageFile) {
      await append({ role: "user", content: text });
      return;
    }

    // case 2: รูปอย่างเดียว หรือ รูป+ข้อความ
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;

        // --- จุดแก้ไขสำคัญ: เปลี่ยนมาใช้ Regex ---
        if (!dataUrl) {
          console.error("FileReader result is empty.");
          return; // หยุดทำงานถ้าไม่มีข้อมูล
        }

        // Regex สำหรับแยก Data URL
        const match = dataUrl.match(/^data:(.+);base64,(.+)$/);

        if (!match) {
          console.error("Invalid Data URL format. Could not parse.");
          return; // หยุดทำงานถ้าไม่ใช่รูปแบบที่ถูกต้อง
        }

        const mimeType = match[1]; // ส่วนที่ 1 คือ mimeType (เช่น "image/png")
        const base64Data = match[2]; // ส่วนที่ 2 คือข้อมูล base64 ดิบ
        // ------------------------------------------

        const content: Array<{
          type: string;
          text?: string;
          image?: string;
          mimeType?: string;
        }> = [];

        if (text) {
          content.push({ type: "text", text });
        }

        content.push({ type: "image", image: base64Data, mimeType: mimeType });

        await append({
          role: "user",
          content: content as any,
        });
      };

      // เพิ่มการจัดการ Error ของ FileReader
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
      };

      reader.readAsDataURL(imageFile);
    }
  };

  // renderContent เหมือนเดิม
  const renderContent = (content: any, idx: number): React.ReactNode => {
    if (typeof content === "string") return <div key={idx}>{content}</div>;
    if (Array.isArray(content))
      return content.map((c, i) => renderContent(c, i));
    if (content.type === "text") return <div key={idx}>{content.text}</div>;
    if (content.type === "image")
      return (
        <img key={idx} src={content.image} className="max-w-xs max-h-60 my-2" />
      );
    return null;
  };

  return (
    <div className="flex flex-col h-full relative bg-white">
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={msg.id ?? idx}
            className={`flex mb-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded px-4 py-2 ${
                msg.role === "user"
                  ? "bg-slate-900 text-white max-w-lg ml-auto text-right"
                  : "bg-slate-100 text-black w-full max-w-2xl text-left"
              }`}
            >
              {renderContent(msg.content, 0)}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute left-0 right-0 bottom-1 px-4 pb-2">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
