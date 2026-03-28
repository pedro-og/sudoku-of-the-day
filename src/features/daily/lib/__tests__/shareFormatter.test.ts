import { buildShareText } from '../shareFormatter';
import type { Board, FixedCells, ShareData } from '@/types';

function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0)) as Board;
}

function createShareData(overrides: Partial<ShareData> = {}): ShareData {
  const solution = emptyBoard();
  // Fill solution with valid values for test
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      solution[r][c] = ((r * 3 + Math.floor(r / 3) + c) % 9 + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    }
  }
  const board = solution.map(row => [...row]) as Board;
  const fixed: FixedCells = board.map(row => row.map(() => true));

  return {
    puzzleNumber: 42,
    mistakes: 0,
    elapsedSeconds: 125,
    streak: 5,
    board,
    solution,
    fixed,
    ...overrides,
  };
}

const labels = {
  title: 'Daily Sudoku',
  mistake: 'Mistake',
  mistakes: 'Mistakes',
  time: 'Time',
  domain: 'sudoku-of-the-day.com',
};

describe('buildShareText', () => {
  it('includes the puzzle number', () => {
    const text = buildShareText(createShareData(), labels);
    expect(text).toContain('#42');
  });

  it('includes the title', () => {
    const text = buildShareText(createShareData(), labels);
    expect(text).toContain('Daily Sudoku');
  });

  it('formats time as MM:SS', () => {
    const text = buildShareText(createShareData({ elapsedSeconds: 125 }), labels);
    expect(text).toContain('02:05');
  });

  it('uses singular "Mistake" for 1 mistake', () => {
    const text = buildShareText(createShareData({ mistakes: 1 }), labels);
    expect(text).toContain('Mistake: 1');
  });

  it('uses plural "Mistakes" for multiple mistakes', () => {
    const text = buildShareText(createShareData({ mistakes: 2 }), labels);
    expect(text).toContain('Mistakes: 2');
  });

  it('includes streak', () => {
    const text = buildShareText(createShareData({ streak: 5 }), labels);
    expect(text).toContain('Streak: 5');
  });

  it('includes domain', () => {
    const text = buildShareText(createShareData(), labels);
    expect(text).toContain('sudoku-of-the-day.com');
  });

  it('uses green emoji for correct cells', () => {
    const data = createShareData();
    const text = buildShareText(data, labels);
    expect(text).toContain('🟩');
  });

  it('uses white emoji for empty cells', () => {
    const data = createShareData();
    // Make some cells empty
    data.board[0][0] = 0;
    const text = buildShareText(data, labels);
    expect(text).toContain('⬜');
  });
});
