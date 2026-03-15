import { useTranslation } from 'react-i18next';
import { Modal } from '@shared/components/Modal/Modal';
import { Button } from '@shared/components/Button/Button';

interface PracticeOverlayProps {
  onStart: () => void;
  onCancel: () => void;
}

export function PracticeOverlay({ onStart, onCancel }: PracticeOverlayProps) {
  const { t } = useTranslation();

  return (
    <Modal open onClose={onCancel} ariaLabel={t('practice.overlayTitle')}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏋️</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
          {t('practice.overlayTitle')}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {t('practice.overlayDescription')}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        <Button variant="primary" size="lg" fullWidth onClick={onStart}>
          {t('practice.start')}
        </Button>
        <Button variant="secondary" fullWidth onClick={onCancel}>
          {t('practice.cancel')}
        </Button>
      </div>
    </Modal>
  );
}
