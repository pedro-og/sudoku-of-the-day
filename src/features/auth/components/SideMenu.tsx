import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { GoogleIcon } from './GoogleIcon';
import css from './SideMenu.module.css';

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  onNavigateAccount: () => void;
}

export function SideMenu({ open, onClose, onNavigateAccount }: SideMenuProps) {
  const { t } = useTranslation();
  const { session, profile, signInWithGoogle, signOut } = useAuth();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const configured = isSupabaseConfigured();

  return (
    <>
      <div className={css.backdrop} onClick={onClose} />
      <aside className={css.panel} role="dialog" aria-label={t('menu.title')}>
        <div className={css.header}>
          <h2 className={css.title}>{t('menu.title')}</h2>
          <button className={css.close} onClick={onClose} aria-label={t('menu.close')}>✕</button>
        </div>

        <div className={css.body}>
          {!configured && (
            <p className={css.hint}>{t('menu.authUnavailable')}</p>
          )}

          {configured && !session && (
            <>
              <button className={css.signInButton} onClick={() => signInWithGoogle()}>
                <GoogleIcon />
                {t('menu.signInGoogle')}
              </button>
              <p className={css.hint}>{t('menu.signInHint')}</p>
            </>
          )}

          {configured && session && profile && (
            <>
              <div className={css.profile}>
                <span className={css.profileName}>{profile.username}</span>
                <span className={css.profileEmail}>{session.user.email}</span>
              </div>
              <button
                className={css.menuItem}
                onClick={() => { onNavigateAccount(); onClose(); }}
              >
                ⚙️ {t('menu.account')}
              </button>
              <button className={css.menuItem} onClick={() => signOut()}>
                ↪ {t('menu.signOut')}
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

export function HamburgerButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      className={css.hamburger}
      onClick={onClick}
      aria-label={t('menu.open')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}
