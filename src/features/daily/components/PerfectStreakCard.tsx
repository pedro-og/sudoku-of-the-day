import { useTranslation } from 'react-i18next';
import { BlueFireIcon } from './BlueFireIcon';
import css from './PerfectStreakCard.module.css';

interface PerfectStreakCardProps {
  /** Current perfect (unbeaten) streak. */
  perfectStreak: number;
  /** Best perfect streak ever — shown as a subtle record line when > current. */
  longestPerfectStreak?: number;
}

/**
 * Blue-fire perfect-streak card. Results screen only — counts consecutive
 * unbeaten wins (resets on a loss).
 */
export function PerfectStreakCard({ perfectStreak, longestPerfectStreak }: PerfectStreakCardProps) {
  const { t } = useTranslation();

  return (
    <div className={css.card}>
      <BlueFireIcon size={36} className={css.flame} />
      <div className={css.info}>
        <span className={css.value}>{perfectStreak}</span>
        <span className={css.label}>{t('perfectStreak.label')}</span>
        {longestPerfectStreak != null && longestPerfectStreak > perfectStreak && (
          <span className={css.record}>
            {t('perfectStreak.best', { count: longestPerfectStreak })}
          </span>
        )}
      </div>
    </div>
  );
}
