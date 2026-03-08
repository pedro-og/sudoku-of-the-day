import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShareResultButton } from './ShareResultButton';
import { DailyStatsPanel } from './DailyStatsPanel';
import type { GameState, StreakData } from '../types';

interface GameOverlayProps {
  state: GameState;
  streak: StreakData;
  onDismiss: () => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function calculateNextPuzzleCountdown(): { hours: number; minutes: number; seconds: number } {
  const now = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  const brasiliaTime = new Date(now);

  const tomorrow = new Date(brasiliaTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - brasiliaTime.getTime();
  const totalSeconds = Math.floor(diff / 1000);

  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function GameOverlay({ state, streak, onDismiss }: GameOverlayProps) {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(calculateNextPuzzleCountdown());

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateNextPuzzleCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!state.isComplete && !state.isGameOver) return null;

  const isOver = state.isGameOver;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onDismiss();
    }
  };

  const shareData = {
    puzzleNumber: state.puzzleNumber,
    mistakes: state.mistakes,
    elapsedSeconds: state.elapsedSeconds,
    streak: streak.currentStreak,
    board: state.board,
    solution: state.solution,
    fixed: state.fixed,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
        backdropFilter: 'blur(4px)',
        cursor: 'pointer',
      }}
    >
      <div style={{
        background: 'var(--modal-bg)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 24px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        cursor: 'default',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>
            {isOver ? '😔' : '🎉'}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {isOver ? t('gameOver.title') : t('complete.title')}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {isOver ? t('gameOver.subtitle') : t('complete.subtitle')}
          </p>
        </div>

        {!isOver && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            width: '100%',
          }}>
            {[
              { label: t('complete.time'), value: formatTime(state.elapsedSeconds) },
              { label: t('complete.mistakes'), value: `${state.mistakes}/3` },
              { label: t('complete.streak'), value: `🔥 ${streak.currentStreak}` },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--bg-surface-alt)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 4px',
              }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
                  {value}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {t('gameOver.puzzleNumber', { number: state.puzzleNumber })}
        </p>

        {!isOver && <ShareResultButton shareData={shareData} />}

        <DailyStatsPanel puzzleNumber={state.puzzleNumber} />

        <div style={{
          width: '100%',
          padding: '16px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface-alt)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('gameOver.nextPuzzleIn')}
          </p>
          <span style={{
            display: 'block',
            fontSize: '32px',
            fontWeight: 900,
            color: 'var(--text-primary)',
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
          }}>
            {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}
