import { nanoid } from "nanoid";
import { ChatContent, ChatMessage } from "../types/chat";
import { toBase64 } from "./file";

export async function buildUserMessage({
  text,
  imageFile,
}: {
  text?: string;
  imageFile?: File;
}): Promise<ChatMessage> {
  const content = [];

  if (text) {
    const textContent: ChatContent = { type: "text", text };
    content.push(textContent);
  }

  if (imageFile) {
    const base64 = await toBase64(imageFile);
    const imageContent: ChatContent = {
      type: "image",
      image: base64,
      mimeType: imageFile.type,
    };
    content.push(imageContent);
  }

  return {
    id: nanoid(),
    role: "user",
    content,
  };
}
