interface GameTimerProps {
  elapsedSeconds: number;
}

export function GameTimer({ elapsedSeconds }: GameTimerProps) {
  const m = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
  const s = (elapsedSeconds % 60).toString().padStart(2, '0');

  return (
    <div style={{
      fontVariantNumeric: 'tabular-nums',
      fontSize: '14px',
      fontWeight: 600,
      color: 'var(--text-secondary)',
      letterSpacing: '0.04em',
    }}>
      {m}:{s}
    </div>
  );
}
