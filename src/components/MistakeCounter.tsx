import { useTranslation } from 'react-i18next';

interface MistakeCounterProps {
  mistakes: number;
  maxMistakes: number;
}

export function MistakeCounter({ mistakes, maxMistakes }: MistakeCounterProps) {
  const { t } = useTranslation();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
        {t('mistakes.label')}:
      </span>
      <div style={{ display: 'flex', gap: '5px' }}>
        {Array.from({ length: maxMistakes }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: i < mistakes ? 'var(--mistake-color)' : 'var(--mistake-empty)',
              transition: 'background 200ms ease',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        {mistakes}/{maxMistakes}
      </span>
    </div>
  );
}
