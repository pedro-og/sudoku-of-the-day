import {
  getPlayerId,
  getAnonymousPlayerId,
  getUsername,
  setAnonymousUsername,
  setAuthenticatedPlayer,
  clearAuthenticatedPlayer,
  isAuthenticatedLocally,
} from '../playerIdentity';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('getAnonymousPlayerId', () => {
  it('generates a UUID on first call', () => {
    expect(getAnonymousPlayerId()).toMatch(UUID_RE);
  });

  it('persists to localStorage under the anon key', () => {
    const id = getAnonymousPlayerId();
    expect(localStorage.getItem('daily-sudoku:player-id')).toBe(id);
  });

  it('returns the same UUID across calls', () => {
    expect(getAnonymousPlayerId()).toBe(getAnonymousPlayerId());
  });

  it('reads an existing id from localStorage', () => {
    const fake = '12345678-1234-1234-1234-123456789abc';
    localStorage.setItem('daily-sudoku:player-id', fake);
    expect(getAnonymousPlayerId()).toBe(fake);
  });
});

describe('getPlayerId (effective id)', () => {
  it('returns the anon id when not authenticated', () => {
    const anon = getAnonymousPlayerId();
    expect(getPlayerId()).toBe(anon);
  });

  it('returns the authed id when authenticated', () => {
    setAuthenticatedPlayer('authed-id-123', 'Swift Raven');
    expect(getPlayerId()).toBe('authed-id-123');
  });

  it('falls back to anon id after sign-out', () => {
    setAuthenticatedPlayer('authed-id-123', 'Swift Raven');
    clearAuthenticatedPlayer();
    expect(getPlayerId()).toBe(getAnonymousPlayerId());
  });
});

describe('getUsername', () => {
  it('returns null when nothing is set', () => {
    expect(getUsername()).toBeNull();
  });

  it('returns anon username when set', () => {
    setAnonymousUsername('Storm Blade');
    expect(getUsername()).toBe('Storm Blade');
  });

  it('prefers authed username over anon', () => {
    setAnonymousUsername('Storm Blade');
    setAuthenticatedPlayer('any-id', 'Frost Ember');
    expect(getUsername()).toBe('Frost Ember');
  });

  it('returns anon username after sign-out', () => {
    setAnonymousUsername('Storm Blade');
    setAuthenticatedPlayer('any-id', 'Frost Ember');
    clearAuthenticatedPlayer();
    expect(getUsername()).toBe('Storm Blade');
  });
});

describe('setAuthenticatedPlayer / clearAuthenticatedPlayer', () => {
  it('stores id and username in localStorage', () => {
    setAuthenticatedPlayer('auth-id', 'Noble Sharp');
    expect(localStorage.getItem('daily-sudoku:auth-player-id')).toBe('auth-id');
    expect(localStorage.getItem('daily-sudoku:auth-username')).toBe('Noble Sharp');
  });

  it('removes auth keys on clear', () => {
    setAuthenticatedPlayer('auth-id', 'Noble Sharp');
    clearAuthenticatedPlayer();
    expect(localStorage.getItem('daily-sudoku:auth-player-id')).toBeNull();
    expect(localStorage.getItem('daily-sudoku:auth-username')).toBeNull();
  });

  it('preserves the anon id on clear', () => {
    const anon = getAnonymousPlayerId();
    setAuthenticatedPlayer('auth-id', 'Noble Sharp');
    clearAuthenticatedPlayer();
    expect(localStorage.getItem('daily-sudoku:player-id')).toBe(anon);
  });
});

describe('isAuthenticatedLocally', () => {
  it('returns false when not signed in', () => {
    expect(isAuthenticatedLocally()).toBe(false);
  });

  it('returns true when authed player is set', () => {
    setAuthenticatedPlayer('auth-id', 'Noble Sharp');
    expect(isAuthenticatedLocally()).toBe(true);
  });

  it('returns false after sign-out', () => {
    setAuthenticatedPlayer('auth-id', 'Noble Sharp');
    clearAuthenticatedPlayer();
    expect(isAuthenticatedLocally()).toBe(false);
  });
});
