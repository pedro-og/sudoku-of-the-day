import type { DailyStats, PuzzleStatsResponse, StreakLeaderboardResponse, SpeedLeaderboardResponse } from '@/types';

const TABLE = 'daily_stats';
const MIN_PLAY_TIME_SECONDS = 30;

function getUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL ?? '';
}

function getKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
}

function isConfigured(): boolean {
  return Boolean(getUrl() && getKey());
}

function headers() {
  const key = getKey();
  return {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'return=representation',
  };
}

export async function fetchDailyStats(puzzleNumber: number): Promise<DailyStats | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(
      `${getUrl()}/rest/v1/${TABLE}?puzzle_number=eq.${puzzleNumber}&select=*`,
      { headers: headers() }
    );
    if (!res.ok) return null;
    const rows: DailyStats[] = await res.json();
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function recordPlayerStarted(puzzleNumber: number): Promise<void> {
  if (!isConfigured()) return;
  const key = `daily-sudoku:started:${puzzleNumber}`;
  if (localStorage.getItem(key)) return;
  try {
    await fetch(`${getUrl()}/rest/v1/rpc/increment_player_started`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ p_puzzle_number: puzzleNumber }),
    });
    localStorage.setItem(key, '1');
  } catch {
    // NOP
  }
}


export async function ensurePlayer(playerId: string): Promise<void> {
  if (!isConfigured()) return;
  const key = `daily-sudoku:player-ensured`;
  if (localStorage.getItem(key)) return;
  try {
    await fetch(`${getUrl()}/rest/v1/rpc/ensure_player`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ p_id: playerId }),
    });
    localStorage.setItem(key, '1');
  } catch {
    // NOP
  }
}

export async function recordCompletion(
  playerId: string,
  puzzleNumber: number,
  elapsedSeconds: number,
  mistakes: number,
  solved: boolean,
  puzzleDate: string,
  cellIntervals: number[]
): Promise<void> {
  if (!isConfigured()) return;

  if (elapsedSeconds < MIN_PLAY_TIME_SECONDS) return;

  const key = `daily-sudoku:completion:${puzzleNumber}`;
  if (localStorage.getItem(key)) return;
  try {
    const res = await fetch(`${getUrl()}/rest/v1/rpc/record_completion`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        p_player_id: playerId,
        p_puzzle_number: puzzleNumber,
        p_elapsed_seconds: elapsedSeconds,
        p_mistakes: mistakes,
        p_solved: solved,
        p_puzzle_date: puzzleDate,
        p_cell_intervals: cellIntervals,
      }),
    });
    if (res.ok) {
      localStorage.setItem(key, '1');
    }
  } catch {
    // NOP
  }
}


export async function fetchPuzzleStats(
  puzzleNumber: number,
  elapsedSeconds: number
): Promise<PuzzleStatsResponse | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`${getUrl()}/rest/v1/rpc/get_puzzle_stats`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        p_puzzle_number: puzzleNumber,
        p_elapsed_seconds: elapsedSeconds,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchSpeedLeaderboard(
  playerId: string,
  puzzleNumber: number,
  limit: number = 5
): Promise<SpeedLeaderboardResponse | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`${getUrl()}/rest/v1/rpc/get_speed_leaderboard`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        p_player_id: playerId,
        p_puzzle_number: puzzleNumber,
        p_limit: limit,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchStreakLeaderboard(
  playerId: string,
  limit: number = 5
): Promise<StreakLeaderboardResponse | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`${getUrl()}/rest/v1/rpc/get_streak_leaderboard`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        p_player_id: playerId,
        p_limit: limit,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

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
