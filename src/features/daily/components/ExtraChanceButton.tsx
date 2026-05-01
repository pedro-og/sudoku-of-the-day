import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showRewardedAd } from '@shared/lib/adsService';
import css from './ExtraChanceButton.module.css';

interface ExtraChanceButtonProps {
  onRewarded: () => void;
}

export function ExtraChanceButton({ onRewarded }: ExtraChanceButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const result = await showRewardedAd('extra-chance');
      if (result === 'rewarded') {
        onRewarded();
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={css.button}
      onClick={handleClick}
      disabled={loading}
      aria-label={t('extraChance.button')}
    >
      {loading ? (
        <>
          <span className={css.spinner} aria-hidden="true" />
          <span>{t('extraChance.loading')}</span>
        </>
      ) : (
        <>
          <span aria-hidden="true">▶️</span>
          <span>{t('extraChance.button')}</span>
          <span className={css.adBadge}>{t('extraChance.adBadge')}</span>
        </>
      )}
    </button>
  );
}
