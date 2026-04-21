import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '@shared/components/Button/Button';
import css from './AccountPage.module.css';

interface AccountPageProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

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

export function AccountPage({ onBack, theme, onToggleTheme }: AccountPageProps) {
  const { t, i18n } = useTranslation();
  const { session, profile, loading, signInWithGoogle, updatePreferences } = useAuth();

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
    <div className={css.container}>
      <div className={css.header}>
        <button className={css.back} onClick={onBack} aria-label={t('account.back')}>
          ← {t('account.back')}
        </button>
        <h1 className={css.title}>{t('account.title')}</h1>
        <span />
      </div>

      {loading && <p className={css.notice}>…</p>}

      {!loading && !session && (
        <div className={css.notice}>
          <p>{t('account.signedOut')}</p>
          <Button variant="primary" onClick={() => signInWithGoogle()}>
            {t('menu.signInGoogle')}
          </Button>
        </div>
      )}

      {!loading && session && profile && (
        <>
          <div className={css.card}>
            <span className={css.label}>{t('account.username')}</span>
            <span className={css.value}>{profile.username}</span>
            <span className={css.label} style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {t('account.usernameLocked')}
            </span>
          </div>

          <div className={css.card}>
            <span className={css.label}>{t('account.email')}</span>
            <span className={css.value}>{session.user.email}</span>
          </div>

          <div className={css.card}>
            <div className={css.row}>
              <div>
                <div className={css.label}>{t('account.language')}</div>
                <div className={css.value}>{LANGUAGES.find(l => l.code === i18n.language)?.label ?? i18n.language}</div>
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
            <div className={css.row}>
              <div>
                <div className={css.label}>{t('account.theme')}</div>
                <div className={css.value}>
                  {theme === 'dark' ? t('account.themeDark') : t('account.themeLight')}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={handleThemeToggle}>
                {t('account.themeToggle')}
              </Button>
            </div>
          </div>

          <div className={css.card}>
            <span className={css.label}>{t('account.streak')}</span>
            <span className={css.value}>
              🔥 {profile.current_streak} · {t('account.longest')}: {profile.longest_streak}
            </span>
          </div>

          {profile.avg_solve_time_seconds != null && (
            <div className={css.card}>
              <span className={css.label}>{t('account.avgTime')}</span>
              <span className={css.value}>
                {String(Math.floor(profile.avg_solve_time_seconds / 60)).padStart(2, '0')}:{String(profile.avg_solve_time_seconds % 60).padStart(2, '0')}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
