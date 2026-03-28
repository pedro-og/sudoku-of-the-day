import { useTranslation } from 'react-i18next';
import { ShareResultButton } from './ShareResultButton';
import { useOverlayData } from './GlobalStatsPanel';
import { StreakLeaderboard } from './StreakLeaderboard';
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
  const { data, loading: statsLoading } = useOverlayData(state.puzzleNumber, state.elapsedSeconds);
  const stats = data.stats;

  if (!state.isComplete && !state.isGameOver) return null;

  const isPractice = state.gameMode === 'practice';
  const isOver = state.isGameOver;

  const content = isPractice
    ? { icon: '🏋️', title: t('practice.completeTitle'), subtitle: t('practice.completeSubtitle') }
    : isOver
    ? { icon: '😔', title: t('gameOver.title'), subtitle: t('gameOver.subtitle') }
    : { icon: '🎉', title: t('complete.title'), subtitle: t('complete.subtitle') };

  const totalPlayers = (stats?.total_solvers ?? 0) + (stats?.total_failures ?? 0);
  const solveRate = totalPlayers > 0
    ? `${Math.round(((stats?.total_solvers ?? 0) / totalPlayers) * 100)}%`
    : '—';
  const hasPercentile = state.isComplete && (stats?.total_solvers ?? 0) > 0;

  const currentStreak = data.streakData?.player_streak ?? streak.currentStreak;

  const shareData = {
    puzzleNumber: state.puzzleNumber,
    mistakes: state.mistakes,
    elapsedSeconds: state.elapsedSeconds,
    streak: currentStreak,
    ...(hasPercentile && stats ? { percentile: stats.percentile } : {}),
  };

  return (
    <Modal open onClose={onDismiss} ariaLabel={content.title}>
      {/* Header */}
      <div className={css.header}>
        <div className={css.icon}>{content.icon}</div>
        <h2 className={css.title}>
          {content.title}
        </h2>
        <p className={css.subtitle}>
          {content.subtitle}
        </p>
        {!isPractice && (
          <p className={css.puzzleNumber}>{t('gameOver.puzzleNumber', { number: state.puzzleNumber })}</p>
        )}
      </div>

      {/* Practice: simple stats + actions */}
      {isPractice && state.isComplete && (
        <>
          <div className={`${css.statsGrid} ${css.statsGrid2}`}>
            <StatCard value={formatTime(state.elapsedSeconds)} label={t('complete.time')} />
            <StatCard value={`${state.mistakes}`} label={t('complete.mistakes')} />
          </div>
          <div className={css.actions}>
            <Button variant="primary" size="lg" fullWidth onClick={onBackToDaily}>
              {t('practice.backToChallenge')}
            </Button>
            <Button variant="secondary" fullWidth onClick={onNewPractice}>
              {t('practice.newPractice')}
            </Button>
          </div>
        </>
      )}

      {/* Daily: comparison stats */}
      {!isPractice && !isOver && (
        <>
          <div className={`${css.statsGrid} ${css.statsGrid2}`}>
            <StatCard value={formatTime(state.elapsedSeconds)} label={t('complete.time')} />
            {statsLoading ? (
              <StatCard value="..." label={t('complete.avgTime')} />
            ) : stats && stats.total_solvers > 0 ? (
              <StatCard value={formatTime(stats.avg_solve_time_seconds)} label={t('complete.avgTime')} />
            ) : (
              <StatCard value="—" label={t('complete.avgTime')} />
            )}
          </div>

          <div className={`${css.statsGrid} ${css.statsGrid2}`}>
            <StatCard value={`${state.mistakes}/3`} label={t('complete.mistakes')} />
            {statsLoading ? (
              <StatCard value="..." label={t('complete.solveRate')} />
            ) : (
              <StatCard value={solveRate} label={t('complete.solveRate')} />
            )}
          </div>

          <div className={`${css.statsGrid} ${css.statsGrid1}`}>
            <StatCard value={`🔥 ${currentStreak}`} label={t('complete.streak')} />
          </div>

          {hasPercentile && stats && stats.percentile === 100 && stats.total_solvers > 1 && state.elapsedSeconds >= 30 && (
            <p className={css.fastestMessage}>
              {t('leaderboard.fastestToday', { number: state.puzzleNumber })}
            </p>
          )}

          {hasPercentile && stats && (stats.percentile < 100 || stats.total_solvers <= 1) && (
            <p className={css.percentileMessage}>
              {t('globalStats.percentile', { percent: stats.percentile })}
            </p>
          )}

          <ShareResultButton shareData={shareData} />
        </>
      )}

      {/* Daily game over: just show share */}
      {!isPractice && isOver && (
        <ShareResultButton shareData={shareData} />
      )}

      {/* Leaderboard */}
      {!isPractice && (
        <StreakLeaderboard
          streakData={data.streakData}
          speedData={data.speedData}
          loading={statsLoading}
        />
      )}

      {/* Countdown */}
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
