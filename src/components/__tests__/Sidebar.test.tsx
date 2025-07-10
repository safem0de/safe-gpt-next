import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Sidebar from '../Sidebar';

jest.mock('@/contexts/LangContext', () => ({
    useLang: () => ({ lang: 'th' }),
}));

const mockSetActiveChat = jest.fn();
const mockFetchChatHistory = jest.fn();
const mockChatHistory = [
    { _id: 'chat-1', title: 'แชทที่ 1' },
    { _id: 'chat-2', title: 'แชทที่ 2' },
];

jest.mock('@/store/chat-store', () => ({
    useChatStore: (selector: any) => selector({
        setActiveChat: mockSetActiveChat,
        fetchChatHistory: mockFetchChatHistory,
        chatHistory: mockChatHistory,
        chatId: 'chat-1',
        getState: () => ({
            chatId: 'chat-1',
            setActiveChat: mockSetActiveChat,
        }),
    }),
}));

beforeAll(() => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, chats: mockChatHistory, chat: { messages: ['msg'] } }),
        } as unknown as Response)
    );
});

afterAll(() => {
    delete (global as any).fetch;
});

describe('Sidebar', () => {
    it('renders Sidebar', async () => {
        render(<Sidebar />);
        await waitFor(() => {
            expect(screen.getByText('สร้างแชทใหม่')).toBeInTheDocument();
        });
    });
});
