import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { SideMenu, HamburgerButton } from '../SideMenu';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured: vi.fn() }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
const mockUseAuth = vi.mocked(useAuth);
const mockIsConfigured = vi.mocked(isSupabaseConfigured);

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

describe('SideMenu — closed', () => {
  it('renders nothing when open=false', () => {
    mockUseAuth.mockReturnValue(defaultAuth());
    mockIsConfigured.mockReturnValue(true);
    const { container } = render(
      <SideMenu open={false} onClose={vi.fn()} onNavigateAccount={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('SideMenu — not configured', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(defaultAuth());
    mockIsConfigured.mockReturnValue(false);
  });

  it('shows the unavailable message', () => {
    render(<SideMenu open onClose={vi.fn()} onNavigateAccount={vi.fn()} />);
    expect(screen.getByText('menu.authUnavailable')).toBeInTheDocument();
  });

  it('does not show the Google sign-in button', () => {
    render(<SideMenu open onClose={vi.fn()} onNavigateAccount={vi.fn()} />);
    expect(screen.queryByText('menu.signInGoogle')).not.toBeInTheDocument();
  });
});

describe('SideMenu — configured, not signed in', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(defaultAuth());
    mockIsConfigured.mockReturnValue(true);
  });

  it('shows the Google sign-in button', () => {
    render(<SideMenu open onClose={vi.fn()} onNavigateAccount={vi.fn()} />);
    expect(screen.getByText('menu.signInGoogle')).toBeInTheDocument();
  });

  it('calls signInWithGoogle when button clicked', () => {
    const auth = defaultAuth();
    mockUseAuth.mockReturnValue(auth);
    render(<SideMenu open onClose={vi.fn()} onNavigateAccount={vi.fn()} />);
    fireEvent.click(screen.getByText('menu.signInGoogle'));
    expect(auth.signInWithGoogle).toHaveBeenCalled();
  });
});

describe('SideMenu — signed in', () => {
  const profile = {
    id: 'p1',
    username: 'Storm Blade',
    current_streak: 5,
    longest_streak: 10,
    last_completed_date: null,
    preferences: {},
    auth_user_id: 'u1',
  };
  const session = { user: { id: 'u1', email: 'test@example.com' } };

  beforeEach(() => {
    mockUseAuth.mockReturnValue(defaultAuth({ session, profile }));
    mockIsConfigured.mockReturnValue(true);
  });

  it('shows the username', () => {
    render(<SideMenu open onClose={vi.fn()} onNavigateAccount={vi.fn()} />);
    expect(screen.getByText('Storm Blade')).toBeInTheDocument();
  });

  it('shows the email', () => {
    render(<SideMenu open onClose={vi.fn()} onNavigateAccount={vi.fn()} />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls onNavigateAccount and onClose when Account is clicked', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(<SideMenu open onClose={onClose} onNavigateAccount={onNavigate} />);
    // Button contains emoji + text node; use regex to match the text content.
    fireEvent.click(screen.getByText(/menu\.account/));
    expect(onNavigate).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('calls signOut when sign out is clicked', () => {
    const auth = defaultAuth({ session, profile });
    mockUseAuth.mockReturnValue(auth);
    render(<SideMenu open onClose={vi.fn()} onNavigateAccount={vi.fn()} />);
    fireEvent.click(screen.getByText(/menu\.signOut/));
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<SideMenu open onClose={onClose} onNavigateAccount={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('menu.close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<SideMenu open onClose={onClose} onNavigateAccount={vi.fn()} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<SideMenu open onClose={onClose} onNavigateAccount={vi.fn()} />);
    // The backdrop is the first child
    const backdrop = document.querySelector('[class*="backdrop"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('HamburgerButton', () => {
  it('calls onClick when clicked', () => {
    mockUseAuth.mockReturnValue(defaultAuth());
    const onClick = vi.fn();
    render(<HamburgerButton onClick={onClick} />);
    fireEvent.click(screen.getByLabelText('menu.open'));
    expect(onClick).toHaveBeenCalled();
  });
});
