import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchDailyStats, computeDisplayStats } from '../lib/statsApi';
import { StatCard } from '@shared/components/StatCard/StatCard';
import type { DailyStats } from '@/types';
import css from './DailyStatsPanel.module.css';

interface DailyStatsPanelProps {
  puzzleNumber: number;
}

export function DailyStatsPanel({ puzzleNumber }: DailyStatsPanelProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyStats(puzzleNumber).then(data => {
      setStats(data);
      setLoading(false);
    });
  }, [puzzleNumber]);

  if (loading) return <p className={css.message}>{t('stats.loading')}</p>;
  if (!stats) return <p className={css.message}>{t('stats.unavailable')}</p>;

  const display = computeDisplayStats(stats);

  return (
    <div className={css.container}>
      <h3 className={css.title}>{t('stats.title')}</h3>
      <div className={css.grid}>
        <StatCard value={display.playersToday} label={t('stats.players')} />
        <StatCard value={display.solvedPercent} label={t('stats.solved')} />
        <StatCard value={display.averageTime} label={t('stats.avgTime')} />
      </div>
    </div>
  );
}
