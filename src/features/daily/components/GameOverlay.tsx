import { useTranslation } from 'react-i18next';
import { ShareResultButton } from './ShareResultButton';
import { DailyStatsPanel } from './DailyStatsPanel';
import { Modal } from '@shared/components/Modal/Modal';
import { Button } from '@shared/components/Button/Button';
import { StatCard } from '@shared/components/StatCard/StatCard';
import { formatTime } from '@shared/lib/formatTime';
import { useCountdown } from '@shared/hooks/useCountdown';
import type { GameState, StreakData } from '@/types';
import css from './GameOverlay.module.css';

interface GameOverlayProps {
  state: GameState;
  streak: StreakData;
  onDismiss: () => void;
  onBackToDaily?: () => void;
  onNewPractice?: () => void;
}

export function GameOverlay({ state, streak, onDismiss, onBackToDaily, onNewPractice }: GameOverlayProps) {
  const { t } = useTranslation();
  const countdown = useCountdown('America/Sao_Paulo');

  if (!state.isComplete && !state.isGameOver) return null;

  const isPractice = state.gameMode === 'practice';
  const isOver = state.isGameOver;

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
    <Modal open onClose={onDismiss} ariaLabel={isPractice ? t('practice.completeTitle') : isOver ? t('gameOver.title') : t('complete.title')}>
      <div style={{ textAlign: 'center' }}>
        <div className={css.icon}>{isPractice ? '🏋️' : isOver ? '😔' : '🎉'}</div>
        <h2 className={css.title}>
          {isPractice ? t('practice.completeTitle') : isOver ? t('gameOver.title') : t('complete.title')}
        </h2>
        <p className={css.subtitle}>
          {isPractice ? t('practice.completeSubtitle') : isOver ? t('gameOver.subtitle') : t('complete.subtitle')}
        </p>
      </div>

      {isPractice && state.isComplete && (
        <div className={`${css.statsGrid} ${css.statsGrid2}`}>
          <StatCard value={formatTime(state.elapsedSeconds)} label={t('complete.time')} />
          <StatCard value={`${state.mistakes}`} label={t('complete.mistakes')} />
        </div>
      )}

      {isPractice && state.isComplete && (
        <div className={css.actions}>
          <Button variant="primary" size="lg" fullWidth onClick={onBackToDaily}>
            {t('practice.backToChallenge')}
          </Button>
          <Button variant="secondary" fullWidth onClick={onNewPractice}>
            {t('practice.newPractice')}
          </Button>
        </div>
      )}

      {!isPractice && !isOver && (
        <div className={`${css.statsGrid} ${css.statsGrid3}`}>
          <StatCard value={formatTime(state.elapsedSeconds)} label={t('complete.time')} />
          <StatCard value={`${state.mistakes}/3`} label={t('complete.mistakes')} />
          <StatCard value={`🔥 ${streak.currentStreak}`} label={t('complete.streak')} />
        </div>
      )}

      {!isPractice && (
        <p className={css.puzzleNumber}>{t('gameOver.puzzleNumber', { number: state.puzzleNumber })}</p>
      )}

      {!isPractice && !isOver && <ShareResultButton shareData={shareData} />}

      {!isPractice && <DailyStatsPanel puzzleNumber={state.puzzleNumber} />}

      {!isPractice && (
        <div className={css.countdownBox}>
          <p className={css.countdownLabel}>{t('gameOver.nextPuzzleIn')}</p>
          <span className={css.countdownTime}>
            {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
          </span>
        </div>
      )}
    </Modal>
  );
}
