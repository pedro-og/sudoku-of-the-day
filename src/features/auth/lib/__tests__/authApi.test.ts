import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  signOut,
  getSession,
  getUser,
  linkAnonymousPlayer,
  getMe,
  setPreferences,
} from '../authApi';

// Mock supabaseClient so tests don't need real credentials.
vi.mock('../supabaseClient', () => ({
  getSupabase: vi.fn(),
  isSupabaseConfigured: vi.fn(() => false),
}));

import { getSupabase } from '../supabaseClient';

const mockGetSupabase = vi.mocked(getSupabase);

describe('authApi — when Supabase is not configured (null client)', () => {
  beforeEach(() => mockGetSupabase.mockReturnValue(null));
  afterEach(() => vi.clearAllMocks());

  it('getSession returns null', async () => {
    expect(await getSession()).toBeNull();
  });

  it('getUser returns null', async () => {
    expect(await getUser()).toBeNull();
  });

  it('linkAnonymousPlayer returns null', async () => {
    expect(await linkAnonymousPlayer('any-uuid')).toBeNull();
  });

  it('getMe returns null', async () => {
    expect(await getMe()).toBeNull();
  });

  it('setPreferences resolves without throwing', async () => {
    await expect(setPreferences({ theme: 'dark' })).resolves.toBeUndefined();
  });

  it('signOut resolves without throwing', async () => {
    await expect(signOut()).resolves.toBeUndefined();
  });
});

describe('authApi — with a mocked Supabase client', () => {
  afterEach(() => vi.clearAllMocks());

  function makeClient(overrides: object = {}) {
    return {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        signOut: vi.fn().mockResolvedValue({}),
        signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      },
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      ...overrides,
    };
  }

  it('getSession returns the session from auth.getSession', async () => {
    const fakeSession = { user: { id: 'u1' } };
    const client = makeClient();
    (client.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: fakeSession },
    });
    mockGetSupabase.mockReturnValue(client as never);

    const result = await getSession();
    expect(result).toBe(fakeSession);
  });

  it('getUser returns the user from auth.getUser', async () => {
    const fakeUser = { id: 'u1', email: 'test@example.com' };
    const client = makeClient();
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: fakeUser },
    });
    mockGetSupabase.mockReturnValue(client as never);

    const result = await getUser();
    expect(result).toBe(fakeUser);
  });

  it('linkAnonymousPlayer calls rpc with correct args and returns data', async () => {
    const profile = { id: 'p1', username: 'Storm Blade', current_streak: 3 };
    const client = makeClient();
    (client.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: profile, error: null });
    mockGetSupabase.mockReturnValue(client as never);

    const result = await linkAnonymousPlayer('anon-uuid');
    expect(client.rpc).toHaveBeenCalledWith('link_anonymous_player', { p_anon_id: 'anon-uuid' });
    expect(result).toEqual(profile);
  });

  it('linkAnonymousPlayer returns null on RPC error', async () => {
    const client = makeClient();
    (client.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });
    mockGetSupabase.mockReturnValue(client as never);

    expect(await linkAnonymousPlayer('anon-uuid')).toBeNull();
  });

  it('getMe calls rpc get_me and returns profile', async () => {
    const profile = { id: 'p1', username: 'Frost Ember', current_streak: 7 };
    const client = makeClient();
    (client.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: profile, error: null });
    mockGetSupabase.mockReturnValue(client as never);

    const result = await getMe();
    expect(client.rpc).toHaveBeenCalledWith('get_me');
    expect(result).toEqual(profile);
  });

  it('setPreferences calls rpc set_preferences with the patch', async () => {
    const client = makeClient();
    (client.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {}, error: null });
    mockGetSupabase.mockReturnValue(client as never);

    await setPreferences({ language: 'pt', theme: 'dark' });
    expect(client.rpc).toHaveBeenCalledWith('set_preferences', {
      p_prefs: { language: 'pt', theme: 'dark' },
    });
  });

  it('signOut calls auth.signOut', async () => {
    const client = makeClient();
    mockGetSupabase.mockReturnValue(client as never);

    await signOut();
    expect(client.auth.signOut).toHaveBeenCalled();
  });
});
