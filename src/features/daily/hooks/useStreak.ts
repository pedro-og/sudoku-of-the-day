import { useState, useEffect, useRef } from 'react';
import type { StreakData } from '@/types';
import { loadStreak, recordCompletion } from '../lib/streakTracker';
import { useAuth } from '@features/auth/context/AuthContext';

export function useStreak(isComplete?: boolean, puzzleDate?: string, autoSolved?: boolean): StreakData {
  const { session, profile } = useAuth();
  const [localStreak, setLocalStreak] = useState<StreakData>(() => loadStreak());
  const recordedRef = useRef(false);
  const wasCompleteOnMountRef = useRef(isComplete);

  useEffect(() => {
    // When logged in, the server (record_completion RPC) is the source of truth.
    // Skip local writes so anonymous-device localStorage doesn't override the account streak.
    if (session) return;
    if (
      isComplete &&
      puzzleDate &&
      !autoSolved &&
      !recordedRef.current &&
      !wasCompleteOnMountRef.current
    ) {
      recordedRef.current = true;
      const updated = recordCompletion(puzzleDate);
      setLocalStreak(updated);
    }
  }, [isComplete, puzzleDate, autoSolved, session]);

  if (session && profile) {
    return {
      currentStreak: profile.current_streak,
      longestStreak: profile.longest_streak,
      lastCompletedDate: profile.last_completed_date,
    };
  }

  return localStreak;
}
