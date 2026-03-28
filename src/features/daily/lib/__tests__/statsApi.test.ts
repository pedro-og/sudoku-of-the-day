import {
  computeDisplayStats,
  ensurePlayer,
  recordCompletion,
  fetchPuzzleStats,
  fetchStreakLeaderboard,
} from '../statsApi';
import type { DailyStats } from '@/types';

describe('computeDisplayStats', () => {
  it('formats players count with locale string', () => {
    const stats: DailyStats = {
      puzzle_number: 1,
      players_started: 1500,
      players_solved: 750,
      total_completion_time: 75000,
    };
    const result = computeDisplayStats(stats);
    expect(result.playersToday).toBe('1,500');
  });

  it('calculates solved percentage correctly', () => {
    const stats: DailyStats = {
      puzzle_number: 1,
      players_started: 200,
      players_solved: 150,
      total_completion_time: 15000,
    };
    const result = computeDisplayStats(stats);
    expect(result.solvedPercent).toBe('75%');
  });

  it('returns 0% when no players started', () => {
    const stats: DailyStats = {
      puzzle_number: 1,
      players_started: 0,
      players_solved: 0,
      total_completion_time: 0,
    };
    const result = computeDisplayStats(stats);
    expect(result.solvedPercent).toBe('0%');
  });

  it('calculates average time as MM:SS', () => {
    const stats: DailyStats = {
      puzzle_number: 1,
      players_started: 10,
      players_solved: 5,
      total_completion_time: 625, // 125 avg => 02:05
    };
    const result = computeDisplayStats(stats);
    expect(result.averageTime).toBe('02:05');
  });

  it('returns 00:00 when no players solved', () => {
    const stats: DailyStats = {
      puzzle_number: 1,
      players_started: 10,
      players_solved: 0,
      total_completion_time: 0,
    };
    const result = computeDisplayStats(stats);
    expect(result.averageTime).toBe('00:00');
  });

  it('rounds percentage correctly', () => {
    const stats: DailyStats = {
      puzzle_number: 1,
      players_started: 3,
      players_solved: 1,
      total_completion_time: 300,
    };
    const result = computeDisplayStats(stats);
    expect(result.solvedPercent).toBe('33%');
  });
});

// V2 API — graceful degradation when Supabase is not configured
describe('V2 API graceful degradation', () => {
  const origUrl = import.meta.env.VITE_SUPABASE_URL;
  const origKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  beforeEach(() => {
    import.meta.env.VITE_SUPABASE_URL = '';
    import.meta.env.VITE_SUPABASE_ANON_KEY = '';
  });

  afterAll(() => {
    import.meta.env.VITE_SUPABASE_URL = origUrl;
    import.meta.env.VITE_SUPABASE_ANON_KEY = origKey;
  });

  it('ensurePlayer returns void when not configured', async () => {
    await expect(ensurePlayer('test-uuid')).resolves.toBeUndefined();
  });

  it('recordCompletion returns void when not configured', async () => {
    await expect(
      recordCompletion('test-uuid', 1, 300, 1, true, '2026-03-15')
    ).resolves.toBeUndefined();
  });

  it('fetchPuzzleStats returns null when not configured', async () => {
    const result = await fetchPuzzleStats(1, 300);
    expect(result).toBeNull();
  });

  it('fetchStreakLeaderboard returns null when not configured', async () => {
    const result = await fetchStreakLeaderboard('test-uuid');
    expect(result).toBeNull();
  });
});
