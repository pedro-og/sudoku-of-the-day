import type { Board, FixedCells, GameState } from '../types';

const KEY_PREFIX = 'daily-sudoku:game:';

type SerializedNotes = number[][][];

interface PersistedGame {
  board: Board;
  notes: SerializedNotes;
  mistakes: number;
  isComplete: boolean;
  isGameOver: boolean;
  elapsedSeconds: number;
}

function storageKey(puzzleDate: string): string {
  return `${KEY_PREFIX}${puzzleDate}`;
}

function serializeNotes(notes: GameState['notes']): SerializedNotes {
  return notes.map(row => row.map(cell => Array.from(cell)));
}

function deserializeNotes(raw: SerializedNotes): GameState['notes'] {
  return raw.map(row => row.map(cell => new Set(cell)));
}

export function saveGameState(state: GameState): void {
  const payload: PersistedGame = {
    board: state.board,
    notes: serializeNotes(state.notes),
    mistakes: state.mistakes,
    isComplete: state.isComplete,
    isGameOver: state.isGameOver,
    elapsedSeconds: state.elapsedSeconds,
  };
  try {
    localStorage.setItem(storageKey(state.puzzleDate), JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function loadGameState(
  puzzleDate: string,
  solution: Board,
  fixed: FixedCells,
  puzzleNumber: number
): GameState | null {
  try {
    const raw = localStorage.getItem(storageKey(puzzleDate));
    if (!raw) return null;
    const parsed: PersistedGame = JSON.parse(raw);

    return {
      board: parsed.board as Board,
      solution,
      fixed,
      notes: deserializeNotes(parsed.notes),
      mistakes: parsed.mistakes,
      maxMistakes: 3,
      selectedCell: null,
      pencilMode: false,
      isComplete: parsed.isComplete,
      isGameOver: parsed.isGameOver,
      elapsedSeconds: parsed.elapsedSeconds,
      startTime: null,
      puzzleDate,
      puzzleNumber,
      mistakeCell: null,
      mistakeValue: 0,
      animatingCells: new Set(),
    };
  } catch {
    return null;
  }
}

export function buildInitialState(
  puzzle: Board,
  solution: Board,
  puzzleDate: string,
  puzzleNumber: number
): GameState {
  const fixed: FixedCells = puzzle.map(row => row.map(cell => cell !== 0));
  const notes: GameState['notes'] = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>())
  );

  return {
    board: puzzle.map(row => [...row]) as Board,
    solution,
    fixed,
    notes,
    mistakes: 0,
    maxMistakes: 3,
    selectedCell: null,
    pencilMode: false,
    isComplete: false,
    isGameOver: false,
    elapsedSeconds: 0,
    startTime: null,
    puzzleDate,
    puzzleNumber,
    mistakeCell: null,
    mistakeValue: 0,
    animatingCells: new Set(),
  };
}

export function pruneOldGames(currentDate: string): void {
  try {
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(KEY_PREFIX) && !key.endsWith(currentDate)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(k => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

const THEME_KEY = 'daily-sudoku:theme';

export function saveTheme(theme: 'light' | 'dark'): void {
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
}

export function loadTheme(): 'light' | 'dark' | null {
  try { return localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null; } catch { return null; }
}
