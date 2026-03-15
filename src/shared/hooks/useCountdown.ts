import { useState, useEffect } from 'react';

interface Countdown {
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateCountdown(timezone: string): Countdown {
  const now = new Date().toLocaleString('en-US', { timeZone: timezone });
  const localTime = new Date(now);

  const tomorrow = new Date(localTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - localTime.getTime();
  const totalSeconds = Math.max(0, Math.floor(diff / 1000));

  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function useCountdown(timezone: string): Countdown {
  const [countdown, setCountdown] = useState(() => calculateCountdown(timezone));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(timezone));
    }, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return countdown;
}
