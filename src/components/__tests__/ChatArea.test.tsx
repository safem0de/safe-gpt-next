import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import ChatArea from '../ChatArea';
import { useSession } from 'next-auth/react';

const mockBuildUserMessage = jest.fn();
jest.mock('../../utils/messageBuilder', () => ({
  buildUserMessage: (...args: unknown[]) => mockBuildUserMessage(...args),
}));

const mockSendChat = jest.fn();
const mockAddOrUpdateChat = jest.fn();
jest.mock('@/services/chatService', () => ({
  sendChat: (...args: unknown[]) => mockSendChat(...args),
  addOrUpdateChat: (...args: unknown[]) => mockAddOrUpdateChat(...args),
}));

function MockChatInput({ onSend }: Readonly<{ onSend: (args: { text?: string }) => void }>) {
  return (
    <button data-testid="chat-input-send" onClick={() => onSend({ text: 'ขอคำตอบ' })}>
      ส่งข้อความ
    </button>
  );
}

function MockChatMessageRenderer({ content }: Readonly<{ content: any[] }>) {
  return (
    <div data-testid="chat-message">
      {Array.isArray(content)
        ? content.map((c) => (c.type === 'text' ? c.text : 'image')).join(' / ')
        : String(content)}
    </div>
  );
}

function MockChatWelcome() {
  return <div data-testid="chat-welcome">สวัสดี!</div>;
}

function MockAILoadingIndicator() {
  return <div data-testid="ai-loading-indicator">กำลังคิด...</div>;
}

jest.mock('../ChatInput', () => ({
  __esModule: true,
  default: MockChatInput,
}));

jest.mock('../ChatMessageRenderer', () => ({
  ChatMessageRenderer: MockChatMessageRenderer,
}));

jest.mock('../ChatWelcome', () => ({
  __esModule: true,
  default: MockChatWelcome,
}));

jest.mock('../AILoadingIndicator', () => ({
  __esModule: true,
  default: MockAILoadingIndicator,
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

beforeAll(() => {
  Object.defineProperty(globalThis.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: jest.fn(),
  });
});

const mockSetActiveChat = jest.fn();
const mockFetchChatHistory = jest.fn();

type StoreState = {
  chatId: string | null;
  messages: any[];
  ragEnabled: boolean;
  setActiveChat: typeof mockSetActiveChat;
  fetchChatHistory: typeof mockFetchChatHistory;
};

let storeState: StoreState;

const useChatStoreMock = (selector: (state: StoreState) => unknown) => selector(storeState);
useChatStoreMock.getState = () => storeState;

const createDeferredResponse = <T,>(value: T) => {
  let resolver: (() => void) | null = null;
  const promise = new Promise<T>((resolve) => {
    resolver = () => resolve(value);
  });
  return {
    promise,
    resolve: () => resolver?.(),
  };
};

jest.mock('@/store/chat-store', () => ({
  useChatStore: (selector: (state: StoreState) => unknown) => useChatStoreMock(selector),
}));

const setupStore = (overrides: Partial<StoreState> = {}) => {
  storeState = {
    chatId: null,
    messages: [],
    ragEnabled: true,
    setActiveChat: mockSetActiveChat,
    fetchChatHistory: mockFetchChatHistory,
    ...overrides,
  };
};

const mockUseSession = useSession as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  setupStore();
  mockUseSession.mockReturnValue({
    data: { user: { email: 'user@example.com' } },
    status: 'authenticated',
  });
});

describe('ChatArea', () => {
  it('แสดงหน้าต้อนรับเมื่อยังไม่มีข้อความ', () => {
    setupStore({ messages: [] });
    render(<ChatArea />);
    expect(screen.getByTestId('chat-welcome')).toBeInTheDocument();
  });

  it('แสดงข้อความทั้งหมดด้วย ChatMessageRenderer', () => {
    const initialMessages = [
      { id: '1', role: 'user', content: [{ type: 'text', text: 'ผู้ใช้ถามอะไรดี' }] },
      { id: '2', role: 'assistant', content: [{ type: 'text', text: 'AI ตอบ' }] },
    ];
    setupStore({ messages: initialMessages });
    render(<ChatArea />);
    expect(screen.queryByTestId('chat-welcome')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('chat-message')).toHaveLength(2);
    expect(screen.getByText('ผู้ใช้ถามอะไรดี')).toBeInTheDocument();
    expect(screen.getByText('AI ตอบ')).toBeInTheDocument();
  });

  it('handleSend จะสร้างข้อความใหม่เรียงลำดับและ sync backend เมื่อเป็นแชทใหม่', async () => {
    const userMessage = { id: 'msg-user', role: 'user', content: [{ type: 'text', text: 'ขอคำตอบ' }] };
    const assistantMessage = {
      id: 'msg-ai',
      role: 'assistant',
      content: [{ type: 'text', text: 'นี่คือคำตอบ' }],
    };

    mockBuildUserMessage.mockResolvedValueOnce(userMessage);
    mockSendChat.mockResolvedValueOnce(assistantMessage);
    mockAddOrUpdateChat.mockResolvedValueOnce({ success: true, chat: { _id: 'chat-new' } });

    render(<ChatArea />);
    fireEvent.click(screen.getByTestId('chat-input-send'));

    await waitFor(() => {
      expect(mockSendChat).toHaveBeenCalledTimes(1);
    });

    expect(mockBuildUserMessage).toHaveBeenCalledWith({ text: 'ขอคำตอบ', imageFile: undefined });

    const expectedNewMessages = [userMessage];
    const expectedAllMessages = [userMessage, assistantMessage];

    expect(mockSetActiveChat).toHaveBeenNthCalledWith(1, '', expectedNewMessages);
    expect(mockSetActiveChat).toHaveBeenNthCalledWith(2, '', expectedAllMessages);
    expect(mockSetActiveChat).toHaveBeenNthCalledWith(3, 'chat-new', expectedAllMessages);

    expect(mockSendChat).toHaveBeenCalledWith(expectedNewMessages, true);
    expect(mockAddOrUpdateChat).toHaveBeenCalledWith('user@example.com', expectedAllMessages, null);

    await waitFor(() => {
      expect(mockFetchChatHistory).toHaveBeenCalledWith('user@example.com');
    });
  });

  it('แสดงตัวบอกสถานะกำลังประมวลผลจนกว่าจะได้คำตอบ', async () => {
    setupStore({ chatId: 'existing-chat' });
    const userMessage = { id: 'msg-user', role: 'user', content: [{ type: 'text', text: 'ขอคำตอบ' }] };
    const assistantMessage = {
      id: 'msg-ai',
      role: 'assistant',
      content: [{ type: 'text', text: 'เรียบร้อย' }],
    };

    mockBuildUserMessage.mockResolvedValueOnce(userMessage);

    const deferredAssistant = createDeferredResponse(assistantMessage);
    mockSendChat.mockImplementationOnce(() => deferredAssistant.promise);
    mockAddOrUpdateChat.mockResolvedValueOnce({ success: true, chat: { _id: 'existing-chat' } });

    render(<ChatArea />);
    fireEvent.click(screen.getByTestId('chat-input-send'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-loading-indicator')).toBeInTheDocument();
    });

    act(() => {
      deferredAssistant.resolve();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('ai-loading-indicator')).not.toBeInTheDocument();
    });
  });
});
