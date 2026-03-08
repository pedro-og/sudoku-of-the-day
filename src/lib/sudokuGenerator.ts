import type { Board, CellValue } from '../types';
import { isValidPlacement } from './sudokuValidator';
import { seededShuffle } from './seededRandom';

type Random = () => number;

function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0)) as Board;
}

function fillBox(board: Board, startRow: number, startCol: number, random: Random) {
  const nums = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random);
  let i = 0;
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      board[r][c] = nums[i++] as CellValue;
    }
  }
}

function solve(board: Board, random?: Random): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue;

      let candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      if (random) seededShuffle(candidates, random);

      for (const num of candidates) {
        if (isValidPlacement(board, r, c, num)) {
          board[r][c] = num as CellValue;
          if (solve(board, random)) return true;
          board[r][c] = 0;
        }
      }

      return false;
    }
  }
  return true;
}

function countSolutions(board: Board, limit = 2): number {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue;

      let count = 0;
      for (let num = 1; num <= 9; num++) {
        if (isValidPlacement(board, r, c, num)) {
          board[r][c] = num as CellValue;
          count += countSolutions(board, limit - count);
          board[r][c] = 0;
          if (count >= limit) return count;
        }
      }
      return count;
    }
  }
  return 1; // board is fully filled → one solution found
}

export interface GeneratedPuzzle {
  puzzle: Board;
  solution: Board;
}
export function generatePuzzle(random: Random, clues = 30): GeneratedPuzzle {
  const solution = emptyBoard();

  fillBox(solution, 0, 0, random);
  fillBox(solution, 3, 3, random);
  fillBox(solution, 6, 6, random);

  solve(solution, random);

  const puzzle = solution.map(row => [...row]) as Board;
  const positions = Array.from({ length: 81 }, (_, i) => i);
  seededShuffle(positions, random);

  let removed = 0;
  const target = 81 - clues;

  for (const pos of positions) {
    if (removed >= target) break;

    const r = Math.floor(pos / 9);
    const c = pos % 9;
    const backup = puzzle[r][c];

    puzzle[r][c] = 0;

    const testBoard = puzzle.map(row => [...row]) as Board;
    if (countSolutions(testBoard) === 1) {
      removed++;
    } else {
      puzzle[r][c] = backup;
    }
  }

  return { puzzle, solution };
}
