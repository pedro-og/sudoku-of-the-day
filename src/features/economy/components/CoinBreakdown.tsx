import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RewardBreakdown } from '@/types';
import { CoinIcon } from './CoinIcon';
import css from './CoinBreakdown.module.css';

interface CoinBreakdownProps {
  breakdown: RewardBreakdown;
}

const LINE_DELAY_MS = 600;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animated reward panel: reveals each breakdown line in sequence while a
 * running total counts up. Respects prefers-reduced-motion (shows everything
 * at once). Pure presentational — the coins were already credited upstream.
 */
export function CoinBreakdown({ breakdown }: CoinBreakdownProps) {
  const { t } = useTranslation();
  const reduced = prefersReducedMotion();
  const [visibleCount, setVisibleCount] = useState(reduced ? breakdown.lines.length : 0);

  useEffect(() => {
    if (reduced) {
      setVisibleCount(breakdown.lines.length);
      return;
    }
    setVisibleCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    breakdown.lines.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), LINE_DELAY_MS * (i + 1)));
    });
    return () => timers.forEach(clearTimeout);
  }, [breakdown, reduced]);

  const runningTotal = breakdown.lines
    .slice(0, visibleCount)
    .reduce((sum, l) => sum + l.amount, 0);

  function labelFor(key: string, meta?: { streak?: number }): string {
    if ((key === 'streakMilestone5' || key === 'streakMilestone10') && meta?.streak != null) {
      return t('coins.streakMilestone', { count: meta.streak });
    }
    return t(`coins.${key}`);
  }

  return (
    <div className={css.panel}>
      <div className={css.total}>
        <CoinIcon size={26} className={css.coin} />
        <span className={css.totalValue}>+{runningTotal}</span>
        <span className={css.totalLabel}>{t('coins.title')}</span>
      </div>

      <ul className={css.lines}>
        {breakdown.lines.map((line, i) => (
          <li
            key={line.key}
            className={css.line}
            data-visible={i < visibleCount}
          >
            <span className={css.lineAmount}>+{line.amount}</span>
            <span className={css.lineLabel}>{labelFor(line.key, line.meta)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
