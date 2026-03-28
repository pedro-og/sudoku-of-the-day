import { useState, useEffect, useRef } from 'react';
import type { StreakData } from '@/types';
import { loadStreak, recordCompletion } from '../lib/streakTracker';

export function useStreak(isComplete?: boolean, puzzleDate?: string, autoSolved?: boolean): StreakData {
  const [streak, setStreak] = useState<StreakData>(() => loadStreak());
  const recordedRef = useRef(false);
  const wasCompleteOnMountRef = useRef(isComplete);

  useEffect(() => {
    if (
      isComplete &&
      puzzleDate &&
      !autoSolved &&
      !recordedRef.current &&
      !wasCompleteOnMountRef.current
    ) {
      recordedRef.current = true;
      const updated = recordCompletion(puzzleDate);
      setStreak(updated);
    }
  }, [isComplete, puzzleDate, autoSolved]);

  return streak;
}
