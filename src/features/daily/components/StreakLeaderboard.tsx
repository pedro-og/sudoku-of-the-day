import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPlayerId } from '../lib/playerIdentity';
import { formatTime } from '@shared/lib/formatTime';
import type { StreakLeaderboardResponse, SpeedLeaderboardResponse } from '@/types';
import css from './StreakLeaderboard.module.css';

type Tab = 'speed' | 'streak';

const DISPLAY_LIMIT = 5;
const MEDALS = ['🥇', '🥈', '🥉'];

interface LeaderboardProps {
  streakData: StreakLeaderboardResponse | null;
  speedData: SpeedLeaderboardResponse | null;
  loading: boolean;
  localStreak?: number;
  localElapsedSeconds?: number;
}

function reconcileStreakData(
  data: StreakLeaderboardResponse | null,
  playerId: string,
  localStreak: number | undefined
): StreakLeaderboardResponse | null {
  if (!data || localStreak == null) return data;

  const leaderboard = data.leaderboard.map(e =>
    e.player_id === playerId && e.current_streak < localStreak
      ? { ...e, current_streak: localStreak, longest_streak: Math.max(e.longest_streak, localStreak) }
      : e
  );
  const playerStreak = Math.max(data.player_streak, localStreak);
  return { ...data, leaderboard, player_streak: playerStreak };
}

function reconcileSpeedData(
  data: SpeedLeaderboardResponse | null,
  playerId: string,
  localElapsed: number | undefined
): SpeedLeaderboardResponse | null {
  if (!data || localElapsed == null) return data;

  const hasPlayer = data.leaderboard.some(e => e.player_id === playerId);
  if (hasPlayer) return data;
  if (data.player_time != null) return data;

  return { ...data, player_time: localElapsed };
}

export function StreakLeaderboard({ streakData, speedData, loading, localStreak, localElapsedSeconds }: LeaderboardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('speed');
  const [playerId] = useState(() => getPlayerId());

  if (loading) return <p className={css.message}>{t('stats.loading')}</p>;

  const reconciledStreak = reconcileStreakData(streakData, playerId, localStreak);
  const reconciledSpeed = reconcileSpeedData(speedData, playerId, localElapsedSeconds);

  const hasStreakData = reconciledStreak && reconciledStreak.leaderboard.length > 0;
  const hasSpeedData = reconciledSpeed && reconciledSpeed.leaderboard.length > 0;

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

      {activeTab === 'speed' && <SpeedTab data={reconciledSpeed} playerId={playerId} />}
      {activeTab === 'streak' && <StreakTab data={reconciledStreak} playerId={playerId} />}
    </div>
  );
}

function PlayerName({ isMe, username, rank, t }: { isMe: boolean; username: string | null; rank: number; t: (key: string) => string }) {
  const displayName = username || `${t('leaderboard.player')} ${rank}`;
  if (isMe) {
    return (
      <>
        {displayName} <span className={css.youTag}>({t('globalStats.you')})</span>
      </>
    );
  }
  return <>{displayName}</>;
}

function SpeedTab({ data, playerId }: { data: SpeedLeaderboardResponse | null; playerId: string }) {
  const { t } = useTranslation();

  if (!data || data.leaderboard.length === 0) {
    return <p className={css.empty}>{t('leaderboard.noSpeed')}</p>;
  }

  const top = data.leaderboard.slice(0, DISPLAY_LIMIT);
  const isPlayerInTop = top.some(e => e.player_id === playerId);

  return (
    <div>
      <ol className={css.list}>
        {top.map(entry => {
          const isMe = entry.player_id === playerId;
          const medal = MEDALS[entry.rank - 1];
          return (
            <li key={entry.player_id} className={isMe ? css.rowHighlight : css.row}>
              <span className={css.rankCol}>
                {medal ? (
                  <span className={css.medal}>{medal}</span>
                ) : (
                  <span className={css.rankNumber}>{entry.rank}</span>
                )}
              </span>
              <div className={css.info}>
                <span className={css.name}>
                  <PlayerName isMe={isMe} username={entry.username} rank={entry.rank} t={t} />
                </span>
              </div>
              <span className={css.time}>{formatTime(entry.elapsed_seconds)}</span>
            </li>
          );
        })}
      </ol>

      {!isPlayerInTop && data.player_rank != null && data.player_time != null && (
        <>
          <div className={css.separator}>···</div>
          <ol className={css.list}>
            <li className={css.rowHighlight}>
              <span className={css.rankCol}>
                <span className={css.rankNumber}>{data.player_rank}</span>
              </span>
              <div className={css.info}>
                <span className={css.name}>{t('globalStats.you')}</span>
              </div>
              <span className={css.time}>{formatTime(data.player_time)}</span>
            </li>
          </ol>
        </>
      )}
    </div>
  );
}

function StreakTab({ data, playerId }: { data: StreakLeaderboardResponse | null; playerId: string }) {
  const { t } = useTranslation();

  if (!data || data.leaderboard.length === 0) {
    return <p className={css.empty}>{t('globalStats.noStreaks')}</p>;
  }

  const top = data.leaderboard.slice(0, DISPLAY_LIMIT);
  const isPlayerInTop = top.some(e => e.player_id === playerId);

  return (
    <div>
      <ol className={css.list}>
        {top.map(entry => {
          const isMe = entry.player_id === playerId;
          const medal = MEDALS[entry.rank - 1];
          return (
            <li key={entry.player_id} className={isMe ? css.rowHighlight : css.row}>
              <span className={css.rankCol}>
                {medal ? (
                  <span className={css.medal}>{medal}</span>
                ) : (
                  <span className={css.rankNumber}>{entry.rank}</span>
                )}
              </span>
              <div className={css.info}>
                <span className={css.name}>
                  <PlayerName isMe={isMe} username={entry.username} rank={entry.rank} t={t} />
                </span>
              </div>
              <span className={css.time}>
                {t('globalStats.streakOf', { count: entry.current_streak })}
              </span>
            </li>
          );
        })}
      </ol>

      {!isPlayerInTop && data.player_streak > 0 && (
        <>
          <div className={css.separator}>···</div>
          <ol className={css.list}>
            <li className={css.rowHighlight}>
              <span className={css.rankCol}>
                <span className={css.rankNumber}>{data.player_rank}</span>
              </span>
              <div className={css.info}>
                <span className={css.name}>{t('globalStats.you')}</span>
              </div>
              <span className={css.time}>
                {t('globalStats.streakOf', { count: data.player_streak })}
              </span>
            </li>
          </ol>
        </>
      )}
    </div>
  );
}
