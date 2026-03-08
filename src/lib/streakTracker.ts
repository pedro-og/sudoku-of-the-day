import type { StreakData } from '../types';

const STREAK_KEY = 'daily-sudoku:streak';

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const dateA = Date.UTC(ay, am - 1, ad);
  const dateB = Date.UTC(by, bm - 1, bd);
  return Math.round((dateB - dateA) / 86_400_000);
}

export function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw) as StreakData;
  } catch { /* ignore */ }
  return { currentStreak: 0, lastCompletedDate: null, longestStreak: 0 };
}

function saveStreak(data: StreakData): void {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export function recordCompletion(todayStr: string): StreakData {
  const data = loadStreak();

  if (data.lastCompletedDate === todayStr) return data;

  let newStreak: number;

  if (data.lastCompletedDate === null) {
    // First ever completion
    newStreak = 1;
  } else {
    const gap = daysBetween(data.lastCompletedDate, todayStr);
    if (gap === 1) {
      // Consecutive day
      newStreak = data.currentStreak + 1;
    } else {
      // Missed one or more days → reset
      newStreak = 1;
    }
  }

  const updated: StreakData = {
    currentStreak: newStreak,
    lastCompletedDate: todayStr,
    longestStreak: Math.max(newStreak, data.longestStreak),
  };

  saveStreak(updated);
  return updated;
}
