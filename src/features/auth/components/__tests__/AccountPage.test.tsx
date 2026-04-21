import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AccountPage } from '../AccountPage';

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { useAuth } from '../../context/AuthContext';
const mockUseAuth = vi.mocked(useAuth);

const profile = {
  id: 'p1',
  username: 'Frost Ember',
  current_streak: 7,
  longest_streak: 14,
  last_completed_date: '2026-04-20',
  preferences: { language: 'en', theme: 'light' as const },
  auth_user_id: 'u1',
};
const session = { user: { id: 'u1', email: 'user@example.com' } };

function defaultAuth(overrides = {}) {
  return {
    session: null,
    profile: null,
    loading: false,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    updatePreferences: vi.fn(),
    refreshProfile: vi.fn(),
    ...overrides,
  };
}

describe('AccountPage — loading', () => {
  it('shows a loading indicator', () => {
    mockUseAuth.mockReturnValue(defaultAuth({ loading: true }));
    render(<AccountPage onBack={vi.fn()} theme="light" onToggleTheme={vi.fn()} />);
    expect(screen.getByText('…')).toBeInTheDocument();
  });
});

describe('AccountPage — not signed in', () => {
  beforeEach(() => mockUseAuth.mockReturnValue(defaultAuth()));

  it('shows the signed-out message', () => {
    render(<AccountPage onBack={vi.fn()} theme="light" onToggleTheme={vi.fn()} />);
    expect(screen.getByText('account.signedOut')).toBeInTheDocument();
  });

  it('shows a sign-in button', () => {
    render(<AccountPage onBack={vi.fn()} theme="light" onToggleTheme={vi.fn()} />);
    expect(screen.getByText('menu.signInGoogle')).toBeInTheDocument();
  });
});

describe('AccountPage — signed in', () => {
  beforeEach(() => mockUseAuth.mockReturnValue(defaultAuth({ session, profile })));

  it('shows the username', () => {
    render(<AccountPage onBack={vi.fn()} theme="light" onToggleTheme={vi.fn()} />);
    expect(screen.getByText('Frost Ember')).toBeInTheDocument();
  });

  it('shows the email', () => {
    render(<AccountPage onBack={vi.fn()} theme="light" onToggleTheme={vi.fn()} />);
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('shows current and longest streak', () => {
    render(<AccountPage onBack={vi.fn()} theme="light" onToggleTheme={vi.fn()} />);
    expect(screen.getByText(/7/)).toBeInTheDocument();
    expect(screen.getByText(/14/)).toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', () => {
    const onBack = vi.fn();
    render(<AccountPage onBack={onBack} theme="light" onToggleTheme={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('account.back'));
    expect(onBack).toHaveBeenCalled();
  });

  it('calls onToggleTheme when theme button is clicked', () => {
    const onToggle = vi.fn();
    render(<AccountPage onBack={vi.fn()} theme="light" onToggleTheme={onToggle} />);
    fireEvent.click(screen.getByText('account.themeToggle'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('calls updatePreferences with new theme on theme toggle', async () => {
    const auth = defaultAuth({ session, profile });
    mockUseAuth.mockReturnValue(auth);
    render(<AccountPage onBack={vi.fn()} theme="light" onToggleTheme={vi.fn()} />);
    fireEvent.click(screen.getByText('account.themeToggle'));
    expect(auth.updatePreferences).toHaveBeenCalledWith({ theme: 'dark' });
  });

  it('calls updatePreferences with language on language change', async () => {
    const auth = defaultAuth({ session, profile });
    mockUseAuth.mockReturnValue(auth);
    render(<AccountPage onBack={vi.fn()} theme="light" onToggleTheme={vi.fn()} />);
    const select = screen.getByRole('combobox', { name: 'account.language' });
    fireEvent.change(select, { target: { value: 'pt' } });
    await waitFor(() => {
      expect(auth.updatePreferences).toHaveBeenCalledWith({ language: 'pt' });
    });
  });

  it('shows the "username locked" message', () => {
    render(<AccountPage onBack={vi.fn()} theme="light" onToggleTheme={vi.fn()} />);
    expect(screen.getByText('account.usernameLocked')).toBeInTheDocument();
  });

  it('shows all 8 language options in the selector', () => {
    render(<AccountPage onBack={vi.fn()} theme="light" onToggleTheme={vi.fn()} />);
    const select = screen.getByRole('combobox', { name: 'account.language' });
    expect(select.querySelectorAll('option')).toHaveLength(8);
  });
});
