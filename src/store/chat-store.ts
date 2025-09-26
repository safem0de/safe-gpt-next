// store/chat-store.ts

import { create } from "zustand";
import type { ChatHistory, ChatMessage } from "@/types/chat";

interface ChatState {
    chatId: string | null;
    messages: ChatMessage[];
    chatHistory: ChatHistory[];
    ragEnabled: boolean;
    setActiveChat: (id: string | null, messages: ChatMessage[]) => void;
    clearChat: () => void;
    fetchChatHistory: (userId: string) => Promise<void>;
    toggleRag: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    chatId: null,
    messages: [],
    chatHistory: [],
    ragEnabled: true,
    setActiveChat: (id, messages) => set({ chatId: id, messages }),
    clearChat: () => set({ chatId: null, messages: [] }),
    fetchChatHistory: async (userId) => {
        const res = await fetch(`/api/chats?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
            set({ chatHistory: data.chats });
        }
    },
    toggleRag: () => set((s) => ({ ragEnabled: !s.ragEnabled })),
}));