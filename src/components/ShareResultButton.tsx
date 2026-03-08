import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { copyShareText } from '../lib/shareFormatter';
import type { ShareData } from '../types';

interface ShareResultButtonProps {
  shareData: ShareData;
}

export function ShareResultButton({ shareData }: ShareResultButtonProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function handleShare() {
    const labels = {
      title: t('share.title'),
      mistake: t('share.mistake'),
      mistakes: t('share.mistakes'),
      time: t('share.time'),
      domain: t('share.domain'),
    };
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
      onClick={handleShare}
      style={{
        padding: '12px 24px',
        borderRadius: 'var(--radius-md)',
        background: status === 'copied' ? '#22c55e' : 'var(--accent)',
        color: '#fff',
        fontWeight: 700,
        fontSize: '15px',
        transition: 'background 300ms ease',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {status === 'idle' ? '📤 ' : status === 'copied' ? '✅ ' : '❌ '}
      {label}
    </button>
  );
}
