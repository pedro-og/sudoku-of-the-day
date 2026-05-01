import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { copyShareText } from '../lib/shareFormatter';
import type { ShareData } from '@/types';
import css from './ShareResultButton.module.css';

interface ShareResultButtonProps {
  shareData: ShareData;
  variant?: 'primary' | 'muted';
}

export function ShareResultButton({ shareData, variant = 'primary' }: ShareResultButtonProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'copying' | 'copied' | 'failed'>('idle');

  const labels = {
    title: t('share.title'),
    mistake: t('share.mistake'),
    mistakes: t('share.mistakes'),
    time: t('share.time'),
    streak: t('share.streak'),
    domain: t('share.domain'),
  };

  async function handleShare() {
    if (status === 'copying') return;
    setStatus('copying');

    const success = await copyShareText(shareData, labels);
    setStatus(success ? 'copied' : 'failed');
    setTimeout(() => setStatus('idle'), 2500);
  }

  const label =
    status === 'copying' ? t('share.button') :
    status === 'copied' ? t('share.copied') :
    status === 'failed' ? t('share.failed') :
    t('share.button');

  return (
    <button
      className={css.button}
      onClick={handleShare}
      disabled={status === 'copying'}
      data-copied={status === 'copied' || undefined}
      data-muted={variant === 'muted' || undefined}
    >
      {status === 'idle' || status === 'copying' ? '📤 ' : status === 'copied' ? '✅ ' : '❌ '}
      {label}
    </button>
  );
}
