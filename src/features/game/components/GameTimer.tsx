import { formatTime } from '@shared/lib/formatTime';
import styles from './GameTimer.module.css';

interface GameTimerProps {
  elapsedSeconds: number;
}

export function GameTimer({ elapsedSeconds }: GameTimerProps) {
  return <div className={styles.timer}>{formatTime(elapsedSeconds)}</div>;
}
