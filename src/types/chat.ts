export type ChatContent =
  | { type: "text"; text: string }
  | { type: "image"; image: string; mimeType: string };

export type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: ChatContent[];
};

export type ChatHistory = {
  _id: string;
  title: string;
  updatedAt: string;
};
