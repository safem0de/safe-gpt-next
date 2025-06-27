export type ChatContent =
  | { type: "text"; text: string }
  | { type: "image"; image: string; mimeType: string };

export type ChatMessage = {
  role: "user" | "assistant";
  content: ChatContent[];
};
