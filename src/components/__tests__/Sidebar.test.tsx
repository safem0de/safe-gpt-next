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

const storeState = {
    chatId: 'chat-1',
    messages: [],
    chatHistory: mockChatHistory,
    setActiveChat: mockSetActiveChat,
    clearChat: mockClearChat,
    fetchChatHistory: mockFetchChatHistory,
};

const useChatStoreMock = (selector: any) => selector(storeState);
useChatStoreMock.getState = () => storeState;

jest.mock('@/store/chat-store', () => ({
    useChatStore: useChatStoreMock,
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

    it('แสดงรายการแชท', () => {
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

    it('กดปุ่ม "สร้างแชทใหม่" แล้วเรียก setActiveChat และ fetchChatHistory', async () => {
        render(<Sidebar />);
        fireEvent.click(screen.getByText('สร้างแชทใหม่'));
        await waitFor(() => {
            expect(mockSetActiveChat).toHaveBeenCalled();
            expect(mockFetchChatHistory).toHaveBeenCalledWith('user-123');
        });
    });

    it('กดปุ่ม "ลบแชท" แล้วเรียก fetchChatHistory และ setActiveChat', async () => {
        // mock confirm = true
        window.confirm = jest.fn(() => true);
        render(<Sidebar />);
        // กดปุ่มลบอันแรก
        const deleteButtons = screen.getAllByTitle('Delete chat');
        fireEvent.click(deleteButtons[0]);
        await waitFor(() => {
            expect(mockFetchChatHistory).toHaveBeenCalledWith('user-123');
            expect(mockSetActiveChat).toHaveBeenCalledWith(null, []);
        });
    });

    it('Sidebar โหมดย่อแล้ว ไม่มีข้อความเมนูหลัก', async () => {
        // จำลองขนาดหน้าจอเล็ก
        window.innerWidth = 500;
        render(<Sidebar />);
        // Trigger resize event
        window.dispatchEvent(new Event('resize'));

        // เช็คว่า **ไม่มี** ข้อความเหล่านี้
        await waitFor(() => {
            expect(screen.queryByText('ซ่อนแถบด้านข้าง')).not.toBeInTheDocument();
            expect(screen.queryByText('สร้างแชทใหม่')).not.toBeInTheDocument();
            expect(screen.queryByText('ประวัติแชท')).not.toBeInTheDocument();
        });
    });

    // it('กดปุ่มซ่อน/แสดง sidebar แล้ว sidebar กลับมาแสดง', async () => {
    //     // เริ่มต้น sidebar เปิด
    //     render(<Sidebar />);
    //     // กดปุ่มซ่อน (อันแรกใน DOM)
    //     const toggleBtn = screen.getByTestId("sidebar-toggle-hidden-show");
    //     fireEvent.click(toggleBtn);

    //     // ตอนนี้ควรจะเป็นโหมด "ย่อ" → ไม่เห็น "สร้างแชทใหม่"
    //     await waitFor(() => {
    //         expect(screen.queryByText('สร้างแชทใหม่')).not.toBeInTheDocument();
    //     });

    //     // กดปุ่มเดิมอีกรอบ เพื่อขยายกลับมา
    //     fireEvent.click(toggleBtn);

    //     // ตอนนี้ควรจะเห็น "สร้างแชทใหม่" อีกครั้ง
    //     await waitFor(() => {
    //         expect(screen.getByText('สร้างแชทใหม่')).toBeInTheDocument();
    //     });
    // });

});
