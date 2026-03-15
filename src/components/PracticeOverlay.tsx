import { useTranslation } from 'react-i18next';

interface PracticeOverlayProps {
  onStart: () => void;
  onCancel: () => void;
}

export function PracticeOverlay({ onStart, onCancel }: PracticeOverlayProps) {
  const { t } = useTranslation();

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
        backdropFilter: 'blur(4px)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          background: 'var(--modal-bg)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 24px',
          width: '100%',
          maxWidth: '380px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          cursor: 'default',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏋️</div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '6px',
          }}>
            {t('practice.overlayTitle')}
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}>
            {t('practice.overlayDescription')}
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%',
        }}>
          <button
            onClick={onStart}
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('practice.start')}
          </button>
          <button
            onClick={onCancel}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: `1px solid var(--cell-border)`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('practice.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
