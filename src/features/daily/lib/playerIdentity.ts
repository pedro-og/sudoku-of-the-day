const STORAGE_KEY = 'daily-sudoku:player-id';

function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Returns the anonymous player UUID.
 * Creates and persists one on first call.
 *
 * When auth is added later, swap this to return
 * the authenticated user's UUID instead.
 */
export function getPlayerId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
