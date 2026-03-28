import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { copyShareText } from '../lib/shareFormatter';
import type { ShareData } from '@/types';
import css from './ShareResultButton.module.css';

interface ShareResultButtonProps {
  shareData: ShareData;
}

export function ShareResultButton({ shareData }: ShareResultButtonProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const labels = {
    title: t('share.title'),
    mistake: t('share.mistake'),
    mistakes: t('share.mistakes'),
    time: t('share.time'),
    domain: t('share.domain'),
  };

  async function handleShare() {
    const success = await copyShareText(shareData, labels);
    setStatus(success ? 'copied' : 'failed');
    setTimeout(() => setStatus('idle'), 2500);
  }

  const label =
    status === 'copied' ? t('share.copied') :
    status === 'failed' ? t('share.failed') :
    t('share.button');

  return (
    <button
      className={css.button}
      onClick={handleShare}
      data-copied={status === 'copied' || undefined}
    >
      {status === 'idle' ? '📤 ' : status === 'copied' ? '✅ ' : '❌ '}
      {label}
    </button>
  );
}
