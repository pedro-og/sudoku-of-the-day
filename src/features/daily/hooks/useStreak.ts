import { useState, useEffect, useRef } from 'react';
import type { StreakData } from '@/types';
import { loadStreak, recordCompletion } from '../lib/streakTracker';
import { useAuth } from '@features/auth/context/AuthContext';

export function useStreak(
  isComplete?: boolean,
  puzzleDate?: string,
  autoSolved?: boolean,
  isGameOver?: boolean,
): StreakData {
  const { session, profile } = useAuth();
  const [localStreak, setLocalStreak] = useState<StreakData>(() => loadStreak());
  const recordedRef = useRef(false);
  // Whether the game had already ended (win or game over) when this mounted —
  // if so the streak was recorded in a previous session; don't record again.
  const wasEndedOnMountRef = useRef(Boolean(isComplete) || Boolean(isGameOver));

  useEffect(() => {
    // When logged in, the server (record_completion RPC) is the source of truth.
    // Skip local writes so anonymous-device localStorage doesn't override the account streak.
    if (session) return;

    const ended = Boolean(isComplete) || Boolean(isGameOver);
    if (
      ended &&
      puzzleDate &&
      !autoSolved &&
      !recordedRef.current &&
      !wasEndedOnMountRef.current
    ) {
      recordedRef.current = true;
      // 🔵 perfect streak only advances on a real solve; a game over still counts
      // toward the 🔥 participation streak but resets the perfect chain.
      const updated = recordCompletion(puzzleDate, Boolean(isComplete));
      setLocalStreak(updated);
    }
  }, [isComplete, isGameOver, puzzleDate, autoSolved, session]);

  if (session && profile) {
    return {
      currentStreak: profile.current_streak,
      longestStreak: profile.longest_streak,
      lastCompletedDate: profile.last_completed_date,
      perfectStreak: profile.perfect_streak,
      longestPerfectStreak: profile.longest_perfect_streak,
      lastPlayedDate: null,
    };
  }

  return localStreak;
}
