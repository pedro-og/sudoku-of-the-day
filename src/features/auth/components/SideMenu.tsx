import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { GoogleIcon } from './GoogleIcon';
import css from './SideMenu.module.css';

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'tr', label: 'Türkçe' },
];

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function SideMenu({ open, onClose, theme, onToggleTheme }: SideMenuProps) {
  const { t, i18n } = useTranslation();
  const { session, profile, loading, signInWithGoogle, signOut, updatePreferences, refreshProfile } = useAuth();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && session) refreshProfile();
  }, [open, session, refreshProfile]);

  if (!open) return null;

  const configured = isSupabaseConfigured();

  const handleLanguageChange = async (code: string) => {
    await i18n.changeLanguage(code);
    if (session) await updatePreferences({ language: code });
  };

  const handleThemeToggle = async () => {
    const next: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';
    onToggleTheme();
    if (session) await updatePreferences({ theme: next });
  };

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

          {configured && loading && (
            <p className={css.hint}>…</p>
          )}

          {configured && !loading && !session && (
            <>
              <button className={css.signInButton} onClick={() => signInWithGoogle()}>
                <GoogleIcon />
                {t('menu.signInGoogle')}
              </button>
              <p className={css.hint}>{t('menu.signInHint')}</p>
            </>
          )}

          {configured && !loading && session && (
            <>
              <div className={css.profile}>
                <span className={css.profileName}>{profile?.username ?? session.user.email}</span>
                <span className={css.profileEmail}>{session.user.email}</span>
              </div>

              {profile && (
                <>
                  <div className={css.card}>
                    <span className={css.cardLabel}>{t('account.streak')}</span>
                    <span className={css.cardValue}>
                      🔥 {profile.current_streak}
                    </span>
                  </div>
                  <div className={css.card}>
                    <span className={css.cardLabel}>{t('account.longest')}</span>
                    <span className={css.cardValue}>
                      {profile.longest_streak}
                    </span>
                  </div>
                </>
              )}

              {profile?.avg_solve_time_seconds != null && (
                <div className={css.card}>
                  <span className={css.cardLabel}>{t('account.avgTime')}</span>
                  <span className={css.cardValue}>
                    {String(Math.floor(profile.avg_solve_time_seconds / 60)).padStart(2, '0')}:{String(profile.avg_solve_time_seconds % 60).padStart(2, '0')}
                  </span>
                </div>
              )}

              <div className={css.card}>
                <div className={css.cardRow}>
                  <div>
                    <div className={css.cardLabel}>{t('account.language')}</div>
                    <div className={css.cardValue}>{LANGUAGES.find(l => l.code === i18n.language)?.label ?? i18n.language}</div>
                  </div>
                  <select
                    className={css.select}
                    value={i18n.language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    aria-label={t('account.language')}
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={css.card}>
                <div className={css.cardRow}>
                  <div>
                    <div className={css.cardLabel}>{t('account.theme')}</div>
                    <div className={css.cardValue}>
                      {theme === 'dark' ? t('account.themeDark') : t('account.themeLight')}
                    </div>
                  </div>
                  <button className={css.themeToggle} onClick={handleThemeToggle}>
                    {theme === 'dark' ? '☀️' : '🌙'}
                  </button>
                </div>
              </div>

              <button className={css.signOutButton} onClick={() => { signOut(); onClose(); }}>
                ↪ {t('menu.signOut')}
              </button>
            </>
          )}

          {/* Language & theme for non-logged-in users */}
          {(!configured || (!loading && !session)) && (
            <>
              <div className={css.card}>
                <div className={css.cardRow}>
                  <div>
                    <div className={css.cardLabel}>{t('account.language')}</div>
                    <div className={css.cardValue}>{LANGUAGES.find(l => l.code === i18n.language)?.label ?? i18n.language}</div>
                  </div>
                  <select
                    className={css.select}
                    value={i18n.language}
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    aria-label={t('account.language')}
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={css.card}>
                <div className={css.cardRow}>
                  <div>
                    <div className={css.cardLabel}>{t('account.theme')}</div>
                    <div className={css.cardValue}>
                      {theme === 'dark' ? t('account.themeDark') : t('account.themeLight')}
                    </div>
                  </div>
                  <button className={css.themeToggle} onClick={onToggleTheme}>
                    {theme === 'dark' ? '☀️' : '🌙'}
                  </button>
                </div>
              </div>
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
