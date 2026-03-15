import { detectCompletions, getCellsToAnimate } from '../completionDetector';
import type { Board, CompletionState } from '@/types';

function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0)) as Board;
}

function emptyCompletionState(): CompletionState {
  return {
    completedRows: new Set(),
    completedCols: new Set(),
    completedBoxes: new Set(),
    completedNumbers: new Set(),
    isGridComplete: false,
  };
}

describe('detectCompletions', () => {
  it('returns empty sets for an empty board', () => {
    const result = detectCompletions(emptyBoard());
    expect(result.completedRows.size).toBe(0);
    expect(result.completedCols.size).toBe(0);
    expect(result.completedBoxes.size).toBe(0);
    expect(result.completedNumbers.size).toBe(0);
    expect(result.isGridComplete).toBe(false);
  });

  it('detects a completed row', () => {
    const board = emptyBoard();
    for (let c = 0; c < 9; c++) board[0][c] = (c + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    const result = detectCompletions(board);
    expect(result.completedRows.has(0)).toBe(true);
    expect(result.completedRows.size).toBe(1);
  });

  it('detects a completed column', () => {
    const board = emptyBoard();
    for (let r = 0; r < 9; r++) board[r][0] = (r + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    const result = detectCompletions(board);
    expect(result.completedCols.has(0)).toBe(true);
    expect(result.completedCols.size).toBe(1);
  });

  it('detects a completed box', () => {
    const board = emptyBoard();
    let n = 1;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        board[r][c] = n++ as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
      }
    }
    const result = detectCompletions(board);
    expect(result.completedBoxes.has(0)).toBe(true);
  });

  it('detects a completed number', () => {
    const board = emptyBoard();
    // Place nine 1s in valid positions (one per row/col/box is not required for completion detection)
    // Just need 9 cells with value 1
    for (let r = 0; r < 9; r++) board[r][0] = 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    const result = detectCompletions(board);
    expect(result.completedNumbers.has(1)).toBe(true);
  });

  it('detects grid complete when all rows are filled', () => {
    const board = emptyBoard();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        board[r][c] = ((r * 3 + Math.floor(r / 3) + c) % 9 + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
      }
    }
    const result = detectCompletions(board);
    expect(result.isGridComplete).toBe(true);
    expect(result.completedRows.size).toBe(9);
  });
});

describe('getCellsToAnimate', () => {
  it('returns empty set when nothing new is completed', () => {
    const state = emptyCompletionState();
    const cells = getCellsToAnimate(state, state);
    expect(cells.size).toBe(0);
  });

  it('animates cells in a newly completed row', () => {
    const previous = emptyCompletionState();
    const current: CompletionState = {
      ...emptyCompletionState(),
      completedRows: new Set([0]),
    };
    const cells = getCellsToAnimate(current, previous);
    expect(cells.size).toBe(9);
    for (let c = 0; c < 9; c++) {
      expect(cells.has(`0,${c}`)).toBe(true);
    }
  });

  it('animates cells in a newly completed column', () => {
    const previous = emptyCompletionState();
    const current: CompletionState = {
      ...emptyCompletionState(),
      completedCols: new Set([3]),
    };
    const cells = getCellsToAnimate(current, previous);
    expect(cells.size).toBe(9);
    for (let r = 0; r < 9; r++) {
      expect(cells.has(`${r},3`)).toBe(true);
    }
  });

  it('animates cells in a newly completed box', () => {
    const previous = emptyCompletionState();
    const current: CompletionState = {
      ...emptyCompletionState(),
      completedBoxes: new Set([4]), // center box (row 1, col 1 of boxes)
    };
    const cells = getCellsToAnimate(current, previous);
    expect(cells.size).toBe(9);
    for (let r = 3; r < 6; r++) {
      for (let c = 3; c < 6; c++) {
        expect(cells.has(`${r},${c}`)).toBe(true);
      }
    }
  });

  it('animates cells for a newly completed number', () => {
    const board = emptyBoard();
    for (let r = 0; r < 9; r++) board[r][r] = 5 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

    const previous = emptyCompletionState();
    const current: CompletionState = {
      ...emptyCompletionState(),
      completedNumbers: new Set([5]),
    };
    const cells = getCellsToAnimate(current, previous, board);
    for (let r = 0; r < 9; r++) {
      expect(cells.has(`${r},${r}`)).toBe(true);
    }
  });

  it('animates all 81 cells on grid completion', () => {
    const previous = emptyCompletionState();
    const current: CompletionState = {
      ...emptyCompletionState(),
      isGridComplete: true,
    };
    const cells = getCellsToAnimate(current, previous);
    expect(cells.size).toBe(81);
  });

  it('does not re-animate previously completed regions', () => {
    const previous: CompletionState = {
      ...emptyCompletionState(),
      completedRows: new Set([0]),
    };
    const current: CompletionState = {
      ...emptyCompletionState(),
      completedRows: new Set([0, 1]),
    };
    const cells = getCellsToAnimate(current, previous);
    // Only row 1 cells should animate, not row 0
    for (let c = 0; c < 9; c++) {
      expect(cells.has(`0,${c}`)).toBe(false);
      expect(cells.has(`1,${c}`)).toBe(true);
    }
  });
});
