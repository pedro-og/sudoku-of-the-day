import { generateUsername } from './usernameGenerator';

const STORAGE_KEY = 'daily-sudoku:player-id';
const USERNAME_KEY = 'daily-sudoku:username';

function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Returns the anonymous player UUID.
 * Creates and persists one on first call.
 */
export function getPlayerId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

/**
 * Returns the player's display username.
 * Generates and persists one on first call.
 */
export function getUsername(): string {
  let name = localStorage.getItem(USERNAME_KEY);
  if (!name) {
    name = generateUsername();
    localStorage.setItem(USERNAME_KEY, name);
  }
  return name;
}
