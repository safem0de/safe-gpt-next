import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';

jest.mock('@/contexts/LangContext', () => ({
    useLang: () => ({ lang: 'th' }),
}));

const mockSetActiveChat = jest.fn();
const mockClearChat = jest.fn();
const mockFetchChatHistory = jest.fn();
const mockChatHistory = [
    { _id: 'chat-1', title: 'แชทที่ 1' },
    { _id: 'chat-2', title: 'แชทที่ 2' },
];

jest.mock('@/store/chat-store', () => ({
    useChatStore: (selector: any) => selector({
        chatId: 'chat-1',
        messages: [],
        chatHistory: mockChatHistory,
        setActiveChat: mockSetActiveChat,
        clearChat: mockClearChat,
        fetchChatHistory: mockFetchChatHistory,
        getState: () => ({
            chatId: 'chat-1',
            setActiveChat: mockSetActiveChat,
            clearChat: mockClearChat,
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
            expect(screen.getByText('ซ่อนแถบด้านข้าง')).toBeInTheDocument();
            expect(screen.getByText('สร้างแชทใหม่')).toBeInTheDocument();
            expect(screen.getByText('ประวัติแชท')).toBeInTheDocument();
        });
    });

    it('แสดงรายชื่อแชท', () => {
        render(<Sidebar />);
        expect(screen.getByText('แชทที่ 1')).toBeInTheDocument();
        expect(screen.getByText('แชทที่ 2')).toBeInTheDocument();
    });

    it('กดแชทแล้วเรียก setActiveChat', async () => {
        render(<Sidebar />);
        fireEvent.click(screen.getByText('แชทที่ 1'));
        await waitFor(() => {
            expect(mockSetActiveChat).toHaveBeenCalled();
        });
    });
});
