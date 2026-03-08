import type { StreakData } from '../types';

interface StreakDisplayProps {
  streak: StreakData;
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
  if (streak.currentStreak === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '14px',
      fontWeight: 600,
      color: 'var(--accent)',
    }}>
      🔥 {streak.currentStreak}
    </div>
  );
}
