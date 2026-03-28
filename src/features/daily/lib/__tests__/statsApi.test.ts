import { computeDisplayStats } from '../statsApi';
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
