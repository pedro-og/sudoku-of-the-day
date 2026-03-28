import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPlayerId } from '../lib/playerIdentity';
import { formatTime } from '@shared/lib/formatTime';
import type { StreakLeaderboardResponse, SpeedLeaderboardResponse } from '@/types';
import css from './StreakLeaderboard.module.css';

type Tab = 'speed' | 'streak';

interface LeaderboardProps {
  streakData: StreakLeaderboardResponse | null;
  speedData: SpeedLeaderboardResponse | null;
  loading: boolean;
}

export function StreakLeaderboard({ streakData, speedData, loading }: LeaderboardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('speed');
  const [playerId] = useState(() => getPlayerId());

  if (loading) return <p className={css.message}>{t('stats.loading')}</p>;

  const hasStreakData = streakData && streakData.leaderboard.length > 0;
  const hasSpeedData = speedData && speedData.leaderboard.length > 0;

  if (!hasStreakData && !hasSpeedData) return <p className={css.empty}>{t('globalStats.noStreaks')}</p>;

  return (
    <div className={css.container}>
      <div className={css.tabs}>
        <button
          className={`${css.tab} ${activeTab === 'speed' ? css.tabActive : ''}`}
          onClick={() => setActiveTab('speed')}
        >
          {t('leaderboard.speedTab')}
        </button>
        <button
          className={`${css.tab} ${activeTab === 'streak' ? css.tabActive : ''}`}
          onClick={() => setActiveTab('streak')}
        >
          {t('leaderboard.streakTab')}
        </button>
      </div>

      {activeTab === 'speed' && <SpeedTab data={speedData} playerId={playerId} />}
      {activeTab === 'streak' && <StreakTab data={streakData} playerId={playerId} />}
    </div>
  );
}

function SpeedTab({ data, playerId }: { data: SpeedLeaderboardResponse | null; playerId: string }) {
  const { t } = useTranslation();

  if (!data || data.leaderboard.length === 0) {
    return <p className={css.empty}>{t('leaderboard.noSpeed')}</p>;
  }

  const isPlayerInTop = data.leaderboard.some(e => e.player_id === playerId);

  return (
    <div>
      <ol className={css.list}>
        {data.leaderboard.map(entry => {
          const isMe = entry.player_id === playerId;
          return (
            <li key={entry.player_id} className={isMe ? css.rowHighlight : css.row}>
              <span className={isMe ? css.rankHighlight : css.rank}>#{entry.rank}</span>
              <span className={css.value}>{formatTime(entry.elapsed_seconds)}</span>
              {isMe && <span className={css.youBadge}>{t('globalStats.you')}</span>}
            </li>
          );
        })}
      </ol>

      {!isPlayerInTop && data.player_rank != null && data.player_time != null && (
        <div className={css.playerRank}>
          {t('leaderboard.speedRank', { rank: data.player_rank })} — {formatTime(data.player_time)}
        </div>
      )}
    </div>
  );
}

function StreakTab({ data, playerId }: { data: StreakLeaderboardResponse | null; playerId: string }) {
  const { t } = useTranslation();

  if (!data || data.leaderboard.length === 0) {
    return <p className={css.empty}>{t('globalStats.noStreaks')}</p>;
  }

  const isPlayerInTop = data.leaderboard.some(e => e.player_id === playerId);

  return (
    <div>
      <ol className={css.list}>
        {data.leaderboard.map(entry => {
          const isMe = entry.player_id === playerId;
          return (
            <li key={entry.player_id} className={isMe ? css.rowHighlight : css.row}>
              <span className={isMe ? css.rankHighlight : css.rank}>#{entry.rank}</span>
              <span className={css.value}>
                {t('globalStats.streakOf', { count: entry.current_streak })}
              </span>
              {isMe && <span className={css.youBadge}>{t('globalStats.you')}</span>}
            </li>
          );
        })}
      </ol>

      {!isPlayerInTop && data.player_streak > 0 && (
        <div className={css.playerRank}>
          {t('globalStats.streakRank', { rank: data.player_rank })} — {t('globalStats.streakOf', { count: data.player_streak })}
        </div>
      )}
    </div>
  );
}
