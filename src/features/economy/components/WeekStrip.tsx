import { useTranslation } from 'react-i18next';
import type { WeekDayStatus } from '@/types';
import css from './WeekStrip.module.css';

interface WeekStripProps {
  statuses: WeekDayStatus[];
  /** Current total streak, shown alongside the strip. */
  streak: number;
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const ICON: Record<WeekDayStatus, string> = {
  done: '🔥',
  frozen: '🧊',
  missed: '❌',
  future: '·',
};

export function WeekStrip({ statuses, streak }: WeekStripProps) {
  const { t } = useTranslation();

  return (
    <div className={css.wrapper}>
      <div className={css.streakTotal}>🔥 {t('week.streakTotal', { count: streak })}</div>
      <div className={css.days}>
        {DAY_KEYS.map((dayKey, i) => {
          const status = statuses[i] ?? 'future';
          return (
            <div key={dayKey} className={css.day} data-status={status}>
              <span className={css.dayLabel}>{t(`week.${dayKey}`)}</span>
              <span className={css.dayIcon} aria-label={t(`week.status.${status}`)}>
                {ICON[status]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
