// import { google } from "@ai-sdk/google";
// import { streamText } from "ai";

// // Allow streaming responses up to 30 seconds
// export const maxDuration = 30;

// export async function POST(req: Request) {
//   // --- DEBUG ---
//   // Clone request เพื่อให้สามารถอ่าน body ได้ 2 ครั้ง
//   const reqClone = req.clone();
//   try {
//     const bodyForLog = await reqClone.json();
//     console.log(
//       "API Route Received Body:",
//       JSON.stringify(bodyForLog, null, 2)
//     );
//   } catch (e) {
//     console.error("Error reading body for logging:", e);
//   }
//   // -------------
//   const { messages } = await req.json();

//   const result = streamText({
//     model: google("gemini-1.5-flash-latest"),
//     system: "You are a helpful assistant.",
//     messages,
//   });

//   return result.toDataStreamResponse();
// }

import { google } from "@ai-sdk/google";
import { streamText, type CoreMessage } from "ai"; // <-- 1. import CoreMessage

export const maxDuration = 30;

export async function POST(req: Request) {
  // 2. ระบุ Type ให้ messages เป็น CoreMessage[]
  const { messages }: { messages: CoreMessage[] } = await req.json();

  // 3. --- ส่วนที่เพิ่มเข้ามา: แปลง Base64 String เป็น Buffer ---
  const processedMessages = messages.map((msg) => {
    // ตรวจสอบว่าเป็นข้อความจาก user และ content เป็น array (สำหรับ multimodal)
    if (msg.role === "user" && Array.isArray(msg.content)) {
      return {
        ...msg,
        content: msg.content.map((part) => {
          // ถ้า content part เป็นรูปภาพ และข้อมูล image เป็น string
          if (part.type === "image" && typeof part.image === "string") {
            // นี่คือหัวใจสำคัญ: แปลง string base64 เป็น Buffer
            return {
              ...part,
              image: Buffer.from(part.image, "base64"),
            };
          }
          return part;
        }),
      };
    }
    return msg;
  });
  // -------------------------------------------------------------

  const result = await streamText({
    model: google("gemini-1.5-flash-latest"),
    system: "You are a helpful assistant.",
    messages: processedMessages, // <-- 4. ใช้ messages ที่ผ่านการแปลงแล้ว
  });

  return result.toDataStreamResponse();
}