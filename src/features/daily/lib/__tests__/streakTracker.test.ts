import { loadStreak, recordCompletion } from '../streakTracker';

describe('loadStreak', () => {
  it('returns default values when no data exists', () => {
    const streak = loadStreak();
    expect(streak).toEqual({
      currentStreak: 0,
      lastCompletedDate: null,
      longestStreak: 0,
      perfectStreak: 0,
      longestPerfectStreak: 0,
      lastPlayedDate: null,
    });
  });

  it('seeds the perfect streak from the legacy streak (solves-only history)', () => {
    const legacy = { currentStreak: 5, lastCompletedDate: '2026-03-14', longestStreak: 10 };
    localStorage.setItem('daily-sudoku:streak', JSON.stringify(legacy));
    expect(loadStreak()).toEqual({
      ...legacy,
      perfectStreak: 5,             // inherits currentStreak
      longestPerfectStreak: 10,     // inherits longestStreak
      lastPlayedDate: '2026-03-14', // inherits lastCompletedDate
    });
  });

  it('does not re-seed once perfect-streak fields are present', () => {
    const saved = {
      currentStreak: 8, lastCompletedDate: '2026-03-14', longestStreak: 10,
      perfectStreak: 2, longestPerfectStreak: 6, lastPlayedDate: '2026-03-15',
    };
    localStorage.setItem('daily-sudoku:streak', JSON.stringify(saved));
    expect(loadStreak()).toEqual(saved);
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

  describe('participation streak (🔥) vs perfect streak (🔵)', () => {
    it('advances participation streak on a loss but resets the perfect streak', () => {
      recordCompletion('2026-03-14', true);  // win
      const result = recordCompletion('2026-03-15', false); // loss
      expect(result.currentStreak).toBe(2);   // 🔥 participation keeps going
      expect(result.perfectStreak).toBe(0);   // 🔵 perfect resets
      expect(result.lastCompletedDate).toBe('2026-03-14'); // last *solved* unchanged
      expect(result.lastPlayedDate).toBe('2026-03-15');
    });

    it('keeps the perfect streak growing across consecutive wins', () => {
      recordCompletion('2026-03-13', true);
      recordCompletion('2026-03-14', true);
      const result = recordCompletion('2026-03-15', true);
      expect(result.currentStreak).toBe(3);
      expect(result.perfectStreak).toBe(3);
    });

    it('rebuilds the perfect streak after a loss', () => {
      recordCompletion('2026-03-13', true);  // 🔵 1
      recordCompletion('2026-03-14', false); // 🔵 reset to 0, 🔥 2
      const result = recordCompletion('2026-03-15', true); // 🔵 back to 1
      expect(result.currentStreak).toBe(3);
      expect(result.perfectStreak).toBe(1);
    });

    it('resets both streaks when a day is fully skipped', () => {
      recordCompletion('2026-03-10', true);
      const result = recordCompletion('2026-03-15', true); // gap
      expect(result.currentStreak).toBe(1);
      expect(result.perfectStreak).toBe(1);
    });

    it('tracks longest perfect streak separately', () => {
      recordCompletion('2026-03-01', true);
      recordCompletion('2026-03-02', true);
      recordCompletion('2026-03-03', true);  // 🔵 = 3
      recordCompletion('2026-03-04', false); // 🔵 reset
      const result = recordCompletion('2026-03-05', true); // 🔵 = 1
      expect(result.perfectStreak).toBe(1);
      expect(result.longestPerfectStreak).toBe(3);
      expect(result.currentStreak).toBe(5);  // 🔥 unbroken
    });
  });
});
