import { useState, useEffect } from 'react';
import type { StreakData } from '@/types';
import { loadStreak } from '../lib/streakTracker';

export function useStreak(isComplete?: boolean): StreakData {
  const [streak, setStreak] = useState<StreakData>(() => loadStreak());

  useEffect(() => {
    if (isComplete) {
      // Defer to next microtask so useGamePersistence's effect (which writes
      // the streak to localStorage) runs first before we read it back.
      const id = setTimeout(() => setStreak(loadStreak()), 0);
      return () => clearTimeout(id);
    }
  }, [isComplete]);

  return streak;
}
