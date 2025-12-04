import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import Sidebar from '../Sidebar';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

const getWindow = () => globalThis as unknown as Window & typeof globalThis;

jest.mock('@/contexts/LangContext', () => ({
    useLang: () => ({ lang: 'th' }),
}));

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

type AppSession = Session & { idToken?: string | null };

const defaultSession: AppSession = {
    user: { email: 'user-123' },
    expires: new Date(Date.now() + 60_000).toISOString(),
};

const createSessionValue = (overrides?: Partial<ReturnType<typeof useSession>>) =>
    ({
        data: defaultSession,
        status: 'authenticated',
        update: jest.fn(),
        ...overrides,
    }) as ReturnType<typeof useSession>;

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

let fetchMock: jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();

    fetchMock = jest.fn(() =>
        Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, chats: mockChatHistory, chat: { messages: ['msg'] } }),
        } as unknown as Response)
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    getWindow().innerWidth = 1200; // reset ทุก test

    mockUseSession.mockReturnValue(createSessionValue());
});

afterAll(() => {
    delete (globalThis as any).fetch;
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

    it('แสดงข้อความสถานะโหลดเมื่อ session ยังไม่เสร็จ', () => {
    mockUseSession.mockReturnValue(createSessionValue({
        data: null,
        status: 'loading',
    }));

        render(<Sidebar />);
        expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();
        expect(screen.queryByText('สร้างแชทใหม่')).not.toBeInTheDocument();
    });

    it('แสดงข้อความให้เข้าสู่ระบบเมื่อไม่ authenticated', () => {
    mockUseSession.mockReturnValue(createSessionValue({
        data: null,
        status: 'unauthenticated',
    }));

        render(<Sidebar />);
        expect(screen.getByText('กรุณาเข้าสู่ระบบ')).toBeInTheDocument();
        expect(screen.queryByText('สร้างแชทใหม่')).not.toBeInTheDocument();
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
        (globalThis as any).confirm = jest.fn(() => true);
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
            getWindow().innerWidth = 500;
            getWindow().dispatchEvent(new Event('resize'));
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
        (globalThis as any).confirm = jest.fn(() => true);
        (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: false, error: 'ลบไม่สำเร็จ' }),
        });
        (globalThis as any).alert = jest.fn();

        render(<Sidebar />);
        const deleteButtons = screen.getAllByTitle('Delete chat');
        fireEvent.click(deleteButtons[0]);
        await waitFor(() => {
            expect(globalThis.alert).toHaveBeenCalledWith('ลบไม่สำเร็จ');
        });
    });

    it('กดลบแชทแต่ cancel ไม่ควรเรียก fetchChatHistory', async () => {
        (globalThis as any).confirm = jest.fn(() => false);

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
        (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ success: false }),
        });

        render(<Sidebar />);
        fireEvent.click(screen.getByText('แชทที่ 1'));
        // ไม่มี expect พิเศษเพราะ code ไม่ setActiveChat ในกรณีนี้
    });

    it('handleDeleteChat: ถ้า data.success = false จะ alert', async () => {
        (globalThis as any).confirm = jest.fn(() => true);
        (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ success: false, error: 'ลบไม่ได้' }),
        });

        (globalThis as any).alert = jest.fn();

        render(<Sidebar />);
        const deleteButtons = screen.getAllByTestId("sidebar-delete-chat");
        fireEvent.click(deleteButtons[0]);
        await waitFor(() => {
            expect(globalThis.alert).toHaveBeenCalledWith('ลบไม่ได้');
        });
    });

});
