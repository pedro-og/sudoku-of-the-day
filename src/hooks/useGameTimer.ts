import { useEffect, useRef } from 'react';

/**
 * Drives the elapsed time counter.
 * The timer increments every second while the game is active AND the tab is visible.
 * Pauses automatically when the tab loses focus, resumes when it regains it.
 * onTick receives the new elapsed time in seconds.
 *
 * The `resetKey` parameter forces the timer to restart when it changes (e.g. on mode switch).
 */
export function useGameTimer(
  isRunning: boolean,
  onTick: (elapsed: number) => void,
  initialElapsed: number,
  resetKey: string | number = '',
) {
  const elapsedRef = useRef(initialElapsed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    elapsedRef.current = initialElapsed;
  }, [initialElapsed]);

  useEffect(() => {
    function startInterval() {
      if (intervalRef.current !== null) return;
      const base = elapsedRef.current;
      startRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const secondsPassed = Math.floor((Date.now() - startRef.current!) / 1000);
        const newElapsed = base + secondsPassed;
        elapsedRef.current = newElapsed;
        onTick(newElapsed);
      }, 1000);
    }

    function stopInterval() {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        startRef.current = null;
      }
    }

    function handleVisibilityChange() {
      if (!isRunning) return;
      if (document.hidden) {
        stopInterval();
      } else {
        startInterval();
      }
    }

    if (isRunning && !document.hidden) {
      startInterval();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, resetKey]); // eslint-disable-line react-hooks/exhaustive-deps
}
