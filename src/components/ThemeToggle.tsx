import { useTranslation } from 'react-i18next';
import { SunIcon, MoonIcon } from './Icons';

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
      aria-label={isDark ? t('theme.toggleLight') : t('theme.toggleDark')}
      title={isDark ? t('theme.toggleLight') : t('theme.toggleDark')}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'var(--btn-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--btn-text)',
        transition: 'background var(--transition)',
        flexShrink: 0,
        padding: 0,
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
    </button>
  );
}
