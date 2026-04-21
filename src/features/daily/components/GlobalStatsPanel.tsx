import { useEffect, useRef, useState } from 'react';
import { fetchPuzzleStats, fetchStreakLeaderboard, fetchSpeedLeaderboard, getCompletionPromise } from '../lib/statsApi';
import { getPlayerId } from '../lib/playerIdentity';
import type { PuzzleStatsResponse, StreakLeaderboardResponse, SpeedLeaderboardResponse } from '@/types';

export interface OverlayData {
  stats: PuzzleStatsResponse | null;
  streakData: StreakLeaderboardResponse | null;
  speedData: SpeedLeaderboardResponse | null;
}

export interface UseOverlayDataResult {
  data: OverlayData;
  loading: boolean;
}

export function useOverlayData(puzzleNumber: number, elapsedSeconds: number): UseOverlayDataResult {
  const [data, setData] = useState<OverlayData>({ stats: null, streakData: null, speedData: null });
  const [loading, setLoading] = useState(true);
  const elapsedRef = useRef(elapsedSeconds);
  const [playerId] = useState(() => getPlayerId());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Wait for recordCompletion's promise to register, then await it. The overlay
      // can mount before the completion-recording effect runs, so poll briefly.
      let completion = getCompletionPromise(puzzleNumber);
      const deadline = Date.now() + 3000;
      while (!completion && Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 100));
        if (cancelled) return;
        completion = getCompletionPromise(puzzleNumber);
      }
      if (completion) await completion;
      if (cancelled) return;
      try {
        const [stats, streakData, speedData] = await Promise.all([
          fetchPuzzleStats(puzzleNumber, elapsedRef.current),
          fetchStreakLeaderboard(playerId),
          fetchSpeedLeaderboard(playerId, puzzleNumber),
        ]);
        if (cancelled) return;
        setData({ stats, streakData, speedData });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [puzzleNumber, playerId]);

  return { data, loading };
}

// Keep the old hook exported so any other consumers don't break
export function useGlobalStats(puzzleNumber: number, elapsedSeconds: number) {
  const { data, loading } = useOverlayData(puzzleNumber, elapsedSeconds);
  return { stats: data.stats, loading };
}
