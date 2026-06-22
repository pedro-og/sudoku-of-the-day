import type { StreakData } from '@/types';

const STREAK_KEY = 'daily-sudoku:streak';

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const dateA = Date.UTC(ay, am - 1, ad);
  const dateB = Date.UTC(by, bm - 1, bd);
  return Math.round((dateB - dateA) / 86_400_000);
}

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  lastCompletedDate: null,
  longestStreak: 0,
  perfectStreak: 0,
  longestPerfectStreak: 0,
  lastPlayedDate: null,
};

export function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<StreakData>;
      const merged = { ...DEFAULT_STREAK, ...saved };
      // One-shot seed for legacy rows (saved before the perfect-streak fields):
      // the old streak only ever counted solves, so it *is* the perfect streak.
      // Mirrors the server-side backfill in migration 015.
      if (saved.perfectStreak === undefined) {
        merged.perfectStreak = merged.currentStreak;
        merged.longestPerfectStreak = Math.max(merged.longestPerfectStreak, merged.longestStreak);
        merged.lastPlayedDate = merged.lastPlayedDate ?? merged.lastCompletedDate;
      }
      return merged;
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_STREAK };
}

function saveStreak(data: StreakData): void {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

/**
 * Records a day's outcome and recomputes both streaks (anonymous/localStorage path).
 * Mirrors record_completion() in supabase/migrations/015_*.sql.
 *
 * - 🔥 currentStreak (participation): advances on win OR loss; driven by lastPlayedDate.
 *   A fully-skipped day resets it.
 * - 🔵 perfectStreak (unbeaten wins): advances only on a solve; resets on a loss
 *   or a skipped day. (Streak freezes are server-side only, so anonymous players
 *   can't bridge a skip here.)
 *
 * @param solved true if the puzzle was solved, false on game over (3 mistakes).
 */
export function recordCompletion(todayStr: string, solved: boolean = true): StreakData {
  const data = loadStreak();

  // ---- 🔥 Participation streak (win or loss) ----
  let newStreak: number;
  if (data.lastPlayedDate === todayStr) {
    newStreak = data.currentStreak;            // already counted today
  } else if (data.lastPlayedDate === null) {
    newStreak = 1;
  } else {
    newStreak = daysBetween(data.lastPlayedDate, todayStr) === 1
      ? data.currentStreak + 1
      : 1;
  }

  // ---- 🔵 Perfect streak (unbeaten wins) ----
  let newPerfect: number;
  if (!solved) {
    newPerfect = 0;                            // a loss resets the perfect chain
  } else if (data.lastCompletedDate === todayStr) {
    newPerfect = data.perfectStreak;           // already counted today
  } else if (data.lastCompletedDate === null) {
    newPerfect = 1;
  } else {
    newPerfect = daysBetween(data.lastCompletedDate, todayStr) === 1
      ? data.perfectStreak + 1
      : 1;
  }

  const updated: StreakData = {
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, data.longestStreak),
    lastPlayedDate: todayStr,
    perfectStreak: newPerfect,
    longestPerfectStreak: Math.max(newPerfect, data.longestPerfectStreak),
    // last *solved* day only advances on a win.
    lastCompletedDate: solved ? todayStr : data.lastCompletedDate,
  };

  saveStreak(updated);
  return updated;
}
