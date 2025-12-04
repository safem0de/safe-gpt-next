import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navbar from '../Navbar';
import { useLang } from '@/contexts/LangContext';
import { useSession, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import { redirectTo } from '@/utils/navigation';

jest.mock('@/contexts/LangContext', () => ({
  useLang: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/utils/navigation', () => ({
  redirectTo: jest.fn(),
}));

const mockUseLang = useLang as jest.MockedFunction<typeof useLang>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockRedirectTo = redirectTo as jest.Mock;

const mockToggleRag = jest.fn();
const chatStoreState = {
  ragEnabled: true,
  toggleRag: mockToggleRag,
};

const useChatStoreMock = (selector: (state: typeof chatStoreState) => unknown) => selector(chatStoreState);

jest.mock('@/store/chat-store', () => ({
  useChatStore: (selector: (state: typeof chatStoreState) => unknown) => useChatStoreMock(selector),
}));

jest.mock('@/components/AvatarDropdown', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="avatar-dropdown">
      <button data-testid="trigger-logout" onClick={() => props.onLogout?.()}>
        logout
      </button>
    </div>
  ),
}));

const mockSetLang = jest.fn();

type AppSession = Session & { idToken?: string | null };

const defaultSessionData: AppSession = {
  user: { name: 'Tester', email: 'tester@example.com' },
  expires: new Date(Date.now() + 60_000).toISOString(),
  idToken: 'token-abc',
};

type SessionValue = ReturnType<typeof useSession>;

const createSessionValue = (overrides?: Partial<SessionValue>): SessionValue =>
  ({
    data: defaultSessionData,
    status: 'authenticated',
    update: jest.fn(),
    ...overrides,
  }) as SessionValue;

let consoleSpy: jest.SpyInstance | null = null;

afterEach(() => {
  consoleSpy?.mockRestore();
  consoleSpy = null;
});

beforeEach(() => {
  jest.clearAllMocks();
  chatStoreState.ragEnabled = true;
  chatStoreState.toggleRag = mockToggleRag;

  consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

  mockUseLang.mockReturnValue({
    lang: 'th',
    setLang: mockSetLang,
  } as any);

  mockUseSession.mockReturnValue(createSessionValue());

  mockSignOut.mockResolvedValue(undefined as unknown as Awaited<ReturnType<typeof signOut>>);
});

describe('Navbar', () => {
  it('renders title and toggles RAG mode', () => {
    render(<Navbar />);

    expect(screen.getByText('Safem0de-GPT')).toBeInTheDocument();
    const ragButton = screen.getByRole('button', { name: /RAG Mode/i });
    fireEvent.click(ragButton);
    expect(mockToggleRag).toHaveBeenCalled();
    expect(screen.getByTestId('avatar-dropdown')).toBeInTheDocument();
  });

  it('toggles language via switch', () => {
    render(<Navbar />);

    const langSwitch = screen.getByRole('checkbox');
    fireEvent.click(langSwitch);

    expect(mockSetLang).toHaveBeenCalledWith('en');
  });

  it('shows sign-in button when unauthenticated and navigates when clicked', () => {
    mockUseSession.mockReturnValue(createSessionValue({
      data: null,
      status: 'unauthenticated',
    }));

    render(<Navbar />);

    const signInButton = screen.getByRole('button', { name: 'เข้าสู่ระบบ' });
    fireEvent.click(signInButton);

    expect(mockRedirectTo).toHaveBeenCalledWith('/api/auth/signin');
  });

  it('calls signOut and redirects when Avatar logout is triggered', async () => {
    render(<Navbar />);

    fireEvent.click(screen.getByTestId('trigger-logout'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
    });

    const redirectUrl = mockRedirectTo.mock.calls[0][0] as string;
    expect(redirectUrl).toContain('protocol/openid-connect/logout');
    expect(redirectUrl).toContain('post_logout_redirect_uri=');
    expect(redirectUrl).toContain('id_token_hint=token-abc');
  });
});
