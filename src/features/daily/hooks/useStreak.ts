import { useState } from 'react';
import type { StreakData } from '@/types';
import { loadStreak } from '../lib/streakTracker';

export function useStreak(): StreakData {
  const [streak] = useState<StreakData>(() => loadStreak());
  return streak;
}
