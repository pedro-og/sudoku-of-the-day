import { buildShareText } from '../shareFormatter';
import type { ShareData } from '@/types';

function createShareData(overrides: Partial<ShareData> = {}): ShareData {
  return {
    puzzleNumber: 42,
    mistakes: 0,
    elapsedSeconds: 125,
    streak: 5,
    ...overrides,
  };
}

const labels = {
  title: 'Daily Sudoku',
  mistake: 'Mistake',
  mistakes: 'Mistakes',
  time: 'Time',
  streak: 'Streak',
  percentile: 'Faster than {{percent}}% of players',
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
    expect(text).toContain('Mistakes: 2/3');
  });

  it('includes streak', () => {
    const text = buildShareText(createShareData({ streak: 5 }), labels);
    expect(text).toContain('Streak: 5');
  });

  it('includes domain', () => {
    const text = buildShareText(createShareData(), labels);
    expect(text).toContain('sudoku-of-the-day.com');
  });

  it('includes percentile when provided', () => {
    const text = buildShareText(createShareData({ percentile: 85 }), labels);
    expect(text).toContain('Faster than 85% of players');
  });

  it('omits percentile when not provided', () => {
    const text = buildShareText(createShareData(), labels);
    expect(text).not.toContain('Faster than');
  });
});
