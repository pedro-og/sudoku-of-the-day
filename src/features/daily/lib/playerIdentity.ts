const ANON_ID_KEY = 'daily-sudoku:player-id';
const ANON_USERNAME_KEY = 'daily-sudoku:username';
const AUTH_ID_KEY = 'daily-sudoku:auth-player-id';
const AUTH_USERNAME_KEY = 'daily-sudoku:auth-username';

function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Anonymous player UUID. Generated and persisted on first call.
 * Used as the `players.id` for users who have never signed in, and as the
 * "anon id" passed to `link_anonymous_player` on first sign-in.
 */
export function getAnonymousPlayerId(): string {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

/**
 * Effective player id. If the user is signed in, returns the authenticated
 * players.id (set by `setAuthenticatedPlayer`). Otherwise, returns the anon id.
 */
export function getPlayerId(): string {
  const authed = localStorage.getItem(AUTH_ID_KEY);
  if (authed) return authed;
  return getAnonymousPlayerId();
}

/**
 * Display username. Prefers the authenticated username when signed in.
 * For anonymous users, returns whatever the server has stamped locally (we
 * stash it after `ensure_player` returns).
 */
export function getUsername(): string | null {
  const authed = localStorage.getItem(AUTH_USERNAME_KEY);
  if (authed) return authed;
  return localStorage.getItem(ANON_USERNAME_KEY);
}

export function setAnonymousUsername(username: string): void {
  localStorage.setItem(ANON_USERNAME_KEY, username);
}

/** Set after successful sign-in + link_anonymous_player RPC. */
export function setAuthenticatedPlayer(id: string, username: string): void {
  localStorage.setItem(AUTH_ID_KEY, id);
  localStorage.setItem(AUTH_USERNAME_KEY, username);
}

/** Clear on sign-out. Anonymous id is preserved so the user keeps their local progress. */
export function clearAuthenticatedPlayer(): void {
  localStorage.removeItem(AUTH_ID_KEY);
  localStorage.removeItem(AUTH_USERNAME_KEY);
}

export function isAuthenticatedLocally(): boolean {
  return Boolean(localStorage.getItem(AUTH_ID_KEY));
}
