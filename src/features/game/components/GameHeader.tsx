import { useTranslation } from 'react-i18next';
import { StreakDisplay } from '@features/daily/components/StreakDisplay';
import { GameTimer } from './GameTimer';
import { ThemeToggle } from '@features/theme/components/ThemeToggle';
import { HamburgerButton } from '@features/auth';
import type { StreakData } from '@/types';
import css from './GameHeader.module.css';

interface GameHeaderProps {
  puzzleNumber: number;
  isPractice: boolean;
  elapsedSeconds: number;
  streak: StreakData;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenMenu?: () => void;
}

export function GameHeader({
  puzzleNumber, isPractice, elapsedSeconds, streak, theme, onToggleTheme, onOpenMenu,
}: GameHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className={css.header}>
      <div className={css.titleGroup}>
        <h1 className={css.title}>{t('app.title')}</h1>
        <span className={css.subtitle}>
          {isPractice ? t('practice.overlayTitle') : t('header.puzzle', { number: puzzleNumber })}
        </span>
      </div>
      <div className={css.controls}>
        {!isPractice && <StreakDisplay streak={streak} />}
        <GameTimer elapsedSeconds={elapsedSeconds} />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        {onOpenMenu && <HamburgerButton onClick={onOpenMenu} />}
      </div>
    </header>
  );
}
