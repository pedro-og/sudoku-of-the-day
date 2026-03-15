import { loadStreak, recordCompletion } from '../streakTracker';

describe('loadStreak', () => {
  it('returns default values when no data exists', () => {
    const streak = loadStreak();
    expect(streak).toEqual({
      currentStreak: 0,
      lastCompletedDate: null,
      longestStreak: 0,
    });
  });

  it('loads saved streak data', () => {
    const data = { currentStreak: 5, lastCompletedDate: '2026-03-14', longestStreak: 10 };
    localStorage.setItem('daily-sudoku:streak', JSON.stringify(data));
    expect(loadStreak()).toEqual(data);
  });
});

describe('recordCompletion', () => {
  it('starts a new streak from zero', () => {
    const result = recordCompletion('2026-03-15');
    expect(result.currentStreak).toBe(1);
    expect(result.lastCompletedDate).toBe('2026-03-15');
    expect(result.longestStreak).toBe(1);
  });

  it('increments streak for consecutive days', () => {
    recordCompletion('2026-03-14');
    const result = recordCompletion('2026-03-15');
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it('resets streak when there is a gap', () => {
    recordCompletion('2026-03-10');
    const result = recordCompletion('2026-03-15');
    expect(result.currentStreak).toBe(1);
  });

  it('does not change streak for same-day completion', () => {
    recordCompletion('2026-03-15');
    const result = recordCompletion('2026-03-15');
    expect(result.currentStreak).toBe(1);
  });

  it('tracks longest streak separately', () => {
    recordCompletion('2026-03-01');
    recordCompletion('2026-03-02');
    recordCompletion('2026-03-03'); // streak = 3
    recordCompletion('2026-03-10'); // gap, streak resets to 1
    const result = recordCompletion('2026-03-11'); // streak = 2
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(3);
  });

  it('persists to localStorage', () => {
    recordCompletion('2026-03-15');
    const raw = localStorage.getItem('daily-sudoku:streak');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.currentStreak).toBe(1);
  });
});
