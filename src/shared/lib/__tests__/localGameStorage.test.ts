import { saveGameState, loadGameState, buildInitialState, pruneOldGames, saveTheme, loadTheme } from '../localGameStorage';
import type { Board } from '@/types';

function createSolution(): Board {
  // Simple valid-ish board for testing
  const board = Array.from({ length: 9 }, () => Array(9).fill(0)) as Board;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      board[r][c] = ((r * 3 + Math.floor(r / 3) + c) % 9 + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    }
  }
  return board;
}

function createPuzzle(solution: Board): Board {
  const puzzle = solution.map(row => [...row]) as Board;
  // Remove some cells to create a puzzle
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 5; c++) {
      puzzle[r][c] = 0;
    }
  }
  return puzzle;
}

describe('buildInitialState', () => {
  it('creates a valid initial state', () => {
    const solution = createSolution();
    const puzzle = createPuzzle(solution);
    const state = buildInitialState(puzzle, solution, '2026-03-15', 74);

    expect(state.mistakes).toBe(0);
    expect(state.isComplete).toBe(false);
    expect(state.isGameOver).toBe(false);
    expect(state.elapsedSeconds).toBe(0);
    expect(state.puzzleDate).toBe('2026-03-15');
    expect(state.puzzleNumber).toBe(74);
    expect(state.selectedCell).toBeNull();
    expect(state.pencilMode).toBe(false);
    expect(state.gameMode).toBe('daily');
  });

  it('marks fixed cells correctly', () => {
    const solution = createSolution();
    const puzzle = createPuzzle(solution);
    const state = buildInitialState(puzzle, solution, '2026-03-15', 74);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(state.fixed[r][c]).toBe(puzzle[r][c] !== 0);
      }
    }
  });

  it('initializes empty notes', () => {
    const solution = createSolution();
    const puzzle = createPuzzle(solution);
    const state = buildInitialState(puzzle, solution, '2026-03-15', 74);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(state.notes[r][c].size).toBe(0);
      }
    }
  });
});

describe('saveGameState / loadGameState', () => {
  it('round-trips game state through localStorage', () => {
    const solution = createSolution();
    const puzzle = createPuzzle(solution);
    const state = buildInitialState(puzzle, solution, '2026-03-15', 74);

    saveGameState(state);
    const loaded = loadGameState('2026-03-15', solution, state.fixed, 74);

    expect(loaded).not.toBeNull();
    expect(loaded!.board).toEqual(state.board);
    expect(loaded!.mistakes).toBe(0);
    expect(loaded!.isComplete).toBe(false);
    expect(loaded!.puzzleDate).toBe('2026-03-15');
  });

  it('preserves notes through serialization', () => {
    const solution = createSolution();
    const puzzle = createPuzzle(solution);
    const state = buildInitialState(puzzle, solution, '2026-03-15', 74);

    // Add some notes
    state.notes[0][0].add(1);
    state.notes[0][0].add(5);
    state.notes[4][4].add(9);

    saveGameState(state);
    const loaded = loadGameState('2026-03-15', solution, state.fixed, 74);

    expect(loaded!.notes[0][0].has(1)).toBe(true);
    expect(loaded!.notes[0][0].has(5)).toBe(true);
    expect(loaded!.notes[4][4].has(9)).toBe(true);
    expect(loaded!.notes[0][0].size).toBe(2);
  });

  it('returns null when no saved game exists', () => {
    const solution = createSolution();
    const fixed = solution.map(row => row.map(() => true));
    const loaded = loadGameState('2026-12-25', solution, fixed, 999);
    expect(loaded).toBeNull();
  });
});

describe('pruneOldGames', () => {
  it('removes old game saves but keeps current', () => {
    localStorage.setItem('daily-sudoku:game:2026-03-13', '{}');
    localStorage.setItem('daily-sudoku:game:2026-03-14', '{}');
    localStorage.setItem('daily-sudoku:game:2026-03-15', '{}');

    pruneOldGames('2026-03-15');

    expect(localStorage.getItem('daily-sudoku:game:2026-03-13')).toBeNull();
    expect(localStorage.getItem('daily-sudoku:game:2026-03-14')).toBeNull();
    expect(localStorage.getItem('daily-sudoku:game:2026-03-15')).not.toBeNull();
  });

  it('does not remove unrelated keys', () => {
    localStorage.setItem('daily-sudoku:streak', '{}');
    localStorage.setItem('daily-sudoku:game:2026-03-14', '{}');

    pruneOldGames('2026-03-15');

    expect(localStorage.getItem('daily-sudoku:streak')).not.toBeNull();
  });
});

describe('theme storage', () => {
  it('saves and loads theme', () => {
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
  });

  it('returns null when no theme saved', () => {
    expect(loadTheme()).toBeNull();
  });

  it('overwrites previous theme', () => {
    saveTheme('dark');
    saveTheme('light');
    expect(loadTheme()).toBe('light');
  });
});
