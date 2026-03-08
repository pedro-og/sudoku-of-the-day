import type { DailyStats } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const TABLE = 'daily_stats';

function isConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function headers() {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
    Prefer: 'return=representation',
  };
}

/** Fetch current stats for a puzzle. Returns null if backend is unavailable. */
export async function fetchDailyStats(puzzleNumber: number): Promise<DailyStats | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?puzzle_number=eq.${puzzleNumber}&select=*`,
      { headers: headers() }
    );
    if (!res.ok) return null;
    const rows: DailyStats[] = await res.json();
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Upsert a "player started" event.
 * Called once when the user first loads today's puzzle.
 * We guard with localStorage to avoid double-counting on page refresh.
 */
export async function recordPlayerStarted(puzzleNumber: number): Promise<void> {
  if (!isConfigured()) return;
  const key = `daily-sudoku:started:${puzzleNumber}`;
  if (localStorage.getItem(key)) return; // already recorded
  try {
    // Upsert: increment players_started. Uses Postgres RPC or a plain upsert.
    await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        puzzle_number: puzzleNumber,
        players_started: 1,
        players_solved: 0,
        total_completion_time: 0,
      }),
    });
    // NOTE: For proper atomic increments you'd use a Postgres function (RPC).
    // This simplified version inserts a row; in production use an RPC like:
    //   supabase.rpc('increment_started', { p_puzzle: puzzleNumber })
    localStorage.setItem(key, '1');
  } catch {
    // Fail silently — stats are best-effort
  }
}

/**
 * Record that this user solved the puzzle.
 * Called once upon successful completion.
 */
export async function recordPuzzleSolved(
  puzzleNumber: number,
  elapsedSeconds: number
): Promise<void> {
  if (!isConfigured()) return;
  const key = `daily-sudoku:solved:${puzzleNumber}`;
  if (localStorage.getItem(key)) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        puzzle_number: puzzleNumber,
        players_started: 0,
        players_solved: 1,
        total_completion_time: elapsedSeconds,
      }),
    });
    localStorage.setItem(key, '1');
  } catch {
    // Fail silently
  }
}

/** Derive human-readable stats from raw DB row. */
export function computeDisplayStats(stats: DailyStats): {
  playersToday: string;
  solvedPercent: string;
  averageTime: string;
} {
  const playersToday = stats.players_started.toLocaleString();
  const pct =
    stats.players_started > 0
      ? Math.round((stats.players_solved / stats.players_started) * 100)
      : 0;
  const solvedPercent = `${pct}%`;
  const avgSec =
    stats.players_solved > 0
      ? Math.round(stats.total_completion_time / stats.players_solved)
      : 0;
  const m = Math.floor(avgSec / 60).toString().padStart(2, '0');
  const s = (avgSec % 60).toString().padStart(2, '0');
  const averageTime = `${m}:${s}`;
  return { playersToday, solvedPercent, averageTime };
}
