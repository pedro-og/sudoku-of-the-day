import { useEffect, useRef } from 'react';

/**
 * Drives the elapsed time counter.
 * The timer increments every second while the game is active.
 * onTick receives the new elapsed time in seconds.
 */
export function useGameTimer(
  isRunning: boolean,
  onTick: (elapsed: number) => void,
  initialElapsed: number
) {
  const startRef = useRef<number | null>(null);
  const elapsedRef = useRef(initialElapsed);

  useEffect(() => {
    elapsedRef.current = initialElapsed;
  }, [initialElapsed]);

  useEffect(() => {
    if (!isRunning) {
      startRef.current = null;
      return;
    }

    // Record when this run started so we can measure exact elapsed time
    const base = elapsedRef.current;
    startRef.current = Date.now();

    const interval = setInterval(() => {
      const secondsPassed = Math.floor((Date.now() - startRef.current!) / 1000);
      const newElapsed = base + secondsPassed;
      elapsedRef.current = newElapsed;
      onTick(newElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]); // eslint-disable-line react-hooks/exhaustive-deps
}
