import type { StreakData } from '@/types';
import styles from './StreakDisplay.module.css';

interface StreakDisplayProps {
  streak: StreakData;
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
  if (streak.currentStreak === 0) return null;

  return (
    <div className={styles.streak}>
      🔥 {streak.currentStreak}
    </div>
  );
}
