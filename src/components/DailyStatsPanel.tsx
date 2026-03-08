import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchDailyStats, computeDisplayStats } from '../lib/statsApi';
import type { DailyStats } from '../types';

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

  if (loading) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
        {t('stats.loading')}
      </p>
    );
  }

  if (!stats) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
        {t('stats.unavailable')}
      </p>
    );
  }

  const display = computeDisplayStats(stats);

  return (
    <div style={{ width: '100%' }}>
      <h3 style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '12px',
        textAlign: 'center',
      }}>
        {t('stats.title')}
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
      }}>
        {[
          { label: t('stats.players'), value: display.playersToday },
          { label: t('stats.solved'), value: display.solvedPercent },
          { label: t('stats.avgTime'), value: display.averageTime },
        ].map(({ label, value }) => (
          <div key={label} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--bg-surface-alt)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 6px',
          }}>
            <span style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 700, color: 'var(--accent)' }}>
              {value}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
