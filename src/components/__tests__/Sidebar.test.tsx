import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
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

beforeEach(() => {
    window.innerWidth = 1200; // reset ทุก test
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
        render(<Sidebar />);

        // Trigger resize event
        // wrap ใน act
        await act(async () => {
            // จำลองขนาดหน้าจอเล็ก
            window.innerWidth = 500;
            window.dispatchEvent(new Event('resize'));
        });

        // เช็คว่า **ไม่มี** ข้อความเหล่านี้
        await waitFor(() => {
            expect(screen.queryByText('ซ่อนแถบด้านข้าง')).not.toBeInTheDocument();
            expect(screen.queryByText('สร้างแชทใหม่')).not.toBeInTheDocument();
            expect(screen.queryByText('ประวัติแชท')).not.toBeInTheDocument();
        });
    });

    it('กดปุ่มซ่อน/แสดง sidebar แล้ว sidebar กลับมาแสดง', async () => {
        // เริ่มต้น sidebar เปิด
        render(<Sidebar />);

        // ปุ่มซ่อน
        const toggleBtn = screen.getByTestId("sidebar-toggle-hidden-show");

        // กดปุ่มซ่อน
        fireEvent.click(toggleBtn);

        // ตอนนี้ควรจะเป็นโหมด "ย่อ" → ไม่เห็น "สร้างแชทใหม่"
        await waitFor(() => {
            expect(screen.queryByText('สร้างแชทใหม่')).not.toBeInTheDocument();
        });

        // กดปุ่มเดิมอีกรอบ เพื่อขยายกลับมา
        fireEvent.click(toggleBtn);

        // ตอนนี้ควรจะเห็น "สร้างแชทใหม่" อีกครั้ง
        await waitFor(() => {
            expect(screen.getByText('สร้างแชทใหม่')).toBeInTheDocument();
        });
    });

    it('กดปุ่มลบแชท แต่ API error แล้วแสดง alert', async () => {
        window.confirm = jest.fn(() => true);
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: false, error: 'ลบไม่สำเร็จ' }),
        });
        window.alert = jest.fn();

        render(<Sidebar />);
        const deleteButtons = screen.getAllByTitle('Delete chat');
        fireEvent.click(deleteButtons[0]);
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('ลบไม่สำเร็จ');
        });
    });

    it('กดลบแชทแต่ cancel ไม่ควรเรียก fetchChatHistory', async () => {
        window.confirm = jest.fn(() => false);

        render(<Sidebar />);
        mockFetchChatHistory.mockClear();

        const deleteButtons = screen.getAllByTestId("sidebar-delete-chat");

        fireEvent.click(deleteButtons[0]);
        await waitFor(() => {
            expect(mockFetchChatHistory).not.toHaveBeenCalled();
        });
    });

    it('handleSelectChat: กรณี data.success = false', async () => {
        // mock fetch ให้ return success = false
        global.fetch = jest.fn(() => Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: false }),
        })) as any;

        render(<Sidebar />);
        fireEvent.click(screen.getByText('แชทที่ 1'));
        // ไม่มี expect พิเศษเพราะ code ไม่ setActiveChat ในกรณีนี้
    });

    it('handleDeleteChat: ถ้า data.success = false จะ alert', async () => {
        window.confirm = jest.fn(() => true);
        global.fetch = jest.fn(() => Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: false, error: 'ลบไม่ได้' }),
        })) as any;

        window.alert = jest.fn();

        render(<Sidebar />);
        const deleteButtons = screen.getAllByTestId("sidebar-delete-chat");
        fireEvent.click(deleteButtons[0]);
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('ลบไม่ได้');
        });
    });

});
