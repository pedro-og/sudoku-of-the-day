import { isValidPlacement, getConflicts, isBoardComplete, cloneBoard } from '../sudokuValidator';
import type { Board } from '@/types';

function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0)) as Board;
}

describe('isValidPlacement', () => {
  it('returns true for valid placement on empty board', () => {
    const board = emptyBoard();
    expect(isValidPlacement(board, 0, 0, 5)).toBe(true);
  });

  it('returns false when number exists in the same row', () => {
    const board = emptyBoard();
    board[0][3] = 5;
    expect(isValidPlacement(board, 0, 0, 5)).toBe(false);
  });

  it('returns false when number exists in the same column', () => {
    const board = emptyBoard();
    board[5][0] = 7;
    expect(isValidPlacement(board, 0, 0, 7)).toBe(false);
  });

  it('returns false when number exists in the same 3x3 box', () => {
    const board = emptyBoard();
    board[1][1] = 3;
    expect(isValidPlacement(board, 2, 2, 3)).toBe(false);
  });

  it('returns true when number is in a different box', () => {
    const board = emptyBoard();
    board[0][0] = 3;
    expect(isValidPlacement(board, 3, 3, 3)).toBe(true);
  });
});

describe('getConflicts', () => {
  it('returns empty set for board with no conflicts', () => {
    const board = emptyBoard();
    board[0][0] = 1;
    board[1][1] = 2;
    expect(getConflicts(board).size).toBe(0);
  });

  it('detects row conflicts', () => {
    const board = emptyBoard();
    board[0][0] = 5;
    board[0][4] = 5;
    const conflicts = getConflicts(board);
    expect(conflicts.has('0,0')).toBe(true);
    expect(conflicts.has('0,4')).toBe(true);
  });

  it('detects column conflicts', () => {
    const board = emptyBoard();
    board[0][0] = 3;
    board[7][0] = 3;
    const conflicts = getConflicts(board);
    expect(conflicts.has('0,0')).toBe(true);
    expect(conflicts.has('7,0')).toBe(true);
  });

  it('detects box conflicts', () => {
    const board = emptyBoard();
    board[0][0] = 9;
    board[2][2] = 9;
    const conflicts = getConflicts(board);
    expect(conflicts.has('0,0')).toBe(true);
    expect(conflicts.has('2,2')).toBe(true);
  });

  it('ignores zeros', () => {
    const board = emptyBoard();
    expect(getConflicts(board).size).toBe(0);
  });
});

describe('isBoardComplete', () => {
  it('returns true when board matches solution', () => {
    const solution = emptyBoard();
    solution[0][0] = 1;
    solution[0][1] = 2;
    const board = cloneBoard(solution);
    expect(isBoardComplete(board, solution)).toBe(true);
  });

  it('returns false when any cell differs', () => {
    const solution = emptyBoard();
    solution[0][0] = 1;
    const board = cloneBoard(solution);
    board[0][0] = 2;
    expect(isBoardComplete(board, solution)).toBe(false);
  });

  it('returns false when board has unfilled cells', () => {
    const solution = emptyBoard();
    solution[0][0] = 1;
    const board = emptyBoard();
    expect(isBoardComplete(board, solution)).toBe(false);
  });
});

describe('cloneBoard', () => {
  it('creates a deep copy', () => {
    const board = emptyBoard();
    board[0][0] = 5;
    const clone = cloneBoard(board);
    expect(clone).toEqual(board);
    expect(clone).not.toBe(board);
    expect(clone[0]).not.toBe(board[0]);
  });

  it('does not affect original when clone is modified', () => {
    const board = emptyBoard();
    board[0][0] = 5;
    const clone = cloneBoard(board);
    clone[0][0] = 9;
    expect(board[0][0]).toBe(5);
  });
});
