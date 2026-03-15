import { useTranslation } from 'react-i18next';
import styles from './MistakeCounter.module.css';

interface MistakeCounterProps {
  mistakes: number;
  maxMistakes: number;
}

export function MistakeCounter({ mistakes, maxMistakes }: MistakeCounterProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <span className={styles.label}>{t('mistakes.label')}:</span>
      <div className={styles.dots}>
        {Array.from({ length: maxMistakes }).map((_, i) => (
          <div key={i} className={styles.dot} data-filled={i < mistakes || undefined} />
        ))}
      </div>
      <span className={styles.count}>{mistakes}/{maxMistakes}</span>
    </div>
  );
}
