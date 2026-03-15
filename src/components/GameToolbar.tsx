import { useTranslation } from 'react-i18next';
import { PencilIcon, UndoIcon, EraseIcon, FastFillIcon, TipIcon } from './Icons';

interface GameToolbarProps {
  pencilMode: boolean;
  fastFillMode: boolean;
  tipMode?: boolean;
  onUndo: () => void;
  onErase: () => void;
  onTogglePencil: () => void;
  onToggleFastFill: () => void;
  onToggleTip?: () => void;
  disabled: boolean;
}

interface ToolButtonProps {
  label: string;
  icon: string | React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  isIconComponent?: boolean;
}

function ToolButton({ label, icon, onClick, active = false, disabled = false, isIconComponent = false }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--btn-bg-active)' : 'var(--btn-bg)',
        color: active ? 'var(--btn-text-active)' : 'var(--btn-text)',
        opacity: disabled ? 0.4 : 1,
        transition: 'background var(--transition), color var(--transition)',
        minWidth: '56px',
        flex: 1,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {isIconComponent ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '20px' }}>
          {icon}
        </span>
      ) : (
        <span style={{ fontSize: '20px', lineHeight: 1 }}>{icon}</span>
      )}
      <span style={{ fontSize: 'clamp(9px, 2.5vw, 11px)', fontWeight: 500 }}>{label}</span>
    </button>
  );
}

export function GameToolbar({ pencilMode, fastFillMode, tipMode, onUndo, onErase, onTogglePencil, onToggleFastFill, onToggleTip, disabled }: GameToolbarProps) {
  const { t } = useTranslation();

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      width: '100%',
      maxWidth: 'min(95vw, 480px)',
    }}>
      <ToolButton
        icon={<UndoIcon size={18} />}
        label={t('toolbar.undo')}
        onClick={onUndo}
        disabled={disabled}
        isIconComponent={true}
      />
      <ToolButton
        icon={<EraseIcon size={18} />}
        label={t('toolbar.erase')}
        onClick={onErase}
        disabled={disabled}
        isIconComponent={true}
      />
      <ToolButton
        icon={<PencilIcon size={18} />}
        label={t('toolbar.notes')}
        onClick={onTogglePencil}
        active={pencilMode}
        disabled={disabled}
        isIconComponent={true}
      />
      <ToolButton
        icon={<FastFillIcon size={18} />}
        label={t('toolbar.fastMode')}
        onClick={onToggleFastFill}
        active={fastFillMode}
        disabled={disabled}
        isIconComponent={true}
      />
      {onToggleTip && (
        <ToolButton
          icon={<TipIcon size={18} />}
          label={t('toolbar.tip')}
          onClick={onToggleTip}
          active={tipMode}
          disabled={disabled}
          isIconComponent={true}
        />
      )}
    </div>
  );
}
