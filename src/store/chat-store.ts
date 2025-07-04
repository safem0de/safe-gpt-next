import { create } from "zustand";
import type { ChatMessage } from "@/types/chat";

interface ChatState {
    chatId: string | null;
    messages: ChatMessage[];
    setActiveChat: (id: string, messages: ChatMessage[]) => void;
    clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    chatId: null,
    messages: [],
    setActiveChat: (id, messages) => set({ chatId: id, messages }),
    clearChat: () => set({ chatId: null, messages: [] }),
}));
