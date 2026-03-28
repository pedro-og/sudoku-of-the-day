import { generatePuzzle } from '../sudokuGenerator';
import { createSeededRandom } from '@shared/lib/seededRandom';
import { isValidPlacement } from '../sudokuValidator';
import type { Board } from '@/types';

function isValidSolution(board: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val < 1 || val > 9) return false;
      board[r][c] = 0;
      const valid = isValidPlacement(board as Board, r, c, val);
      board[r][c] = val;
      if (!valid) return false;
    }
  }
  return true;
}

describe('generatePuzzle', () => {
  it('generates a valid solution', () => {
    const rng = createSeededRandom('test-puzzle');
    const { solution } = generatePuzzle(rng, 30);
    const solutionCopy = solution.map(row => [...row]);
    expect(isValidSolution(solutionCopy)).toBe(true);
  });

  it('puzzle has the correct number of clues', () => {
    const rng = createSeededRandom('clue-count');
    const { puzzle } = generatePuzzle(rng, 30);
    let clueCount = 0;
    for (const row of puzzle) {
      for (const cell of row) {
        if (cell !== 0) clueCount++;
      }
    }
    expect(clueCount).toBe(30);
  });

  it('puzzle clues match the solution', () => {
    const rng = createSeededRandom('match-test');
    const { puzzle, solution } = generatePuzzle(rng, 30);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] !== 0) {
          expect(puzzle[r][c]).toBe(solution[r][c]);
        }
      }
    }
  });

  it('produces deterministic puzzles from the same seed', () => {
    const a = generatePuzzle(createSeededRandom('deterministic'), 30);
    const b = generatePuzzle(createSeededRandom('deterministic'), 30);
    expect(a.puzzle).toEqual(b.puzzle);
    expect(a.solution).toEqual(b.solution);
  });

  it('produces different puzzles from different seeds', () => {
    const a = generatePuzzle(createSeededRandom('seed-1'), 30);
    const b = generatePuzzle(createSeededRandom('seed-2'), 30);
    expect(a.solution).not.toEqual(b.solution);
  });

  it('respects different clue counts', () => {
    const rng = createSeededRandom('clue-40');
    const { puzzle } = generatePuzzle(rng, 40);
    let clueCount = 0;
    for (const row of puzzle) {
      for (const cell of row) {
        if (cell !== 0) clueCount++;
      }
    }
    expect(clueCount).toBe(40);
  });
}, 30_000);
