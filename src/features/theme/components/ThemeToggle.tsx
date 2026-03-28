import { useTranslation } from 'react-i18next';
import { SunIcon, MoonIcon } from '@shared/components/Icons';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      className={styles.button}
      aria-label={isDark ? t('theme.toggleLight') : t('theme.toggleDark')}
      title={isDark ? t('theme.toggleLight') : t('theme.toggleDark')}
    >
      {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
    </button>
  );
}
