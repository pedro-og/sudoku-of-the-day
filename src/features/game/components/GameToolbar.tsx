import { useTranslation } from 'react-i18next';
import { PencilIcon, UndoIcon, EraseIcon, FastFillIcon, TipIcon } from '@shared/components/Icons';
import { IconButton } from '@shared/components/IconButton/IconButton';
import css from './GameToolbar.module.css';

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

export function GameToolbar({
  pencilMode, fastFillMode, tipMode,
  onUndo, onErase, onTogglePencil, onToggleFastFill, onToggleTip,
  disabled,
}: GameToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className={css.toolbar}>
      <IconButton icon={<UndoIcon size={18} />} label={t('toolbar.undo')} onClick={onUndo} disabled={disabled} />
      <IconButton icon={<EraseIcon size={18} />} label={t('toolbar.erase')} onClick={onErase} disabled={disabled} />
      <IconButton icon={<PencilIcon size={18} />} label={t('toolbar.notes')} onClick={onTogglePencil} active={pencilMode} disabled={disabled} />
      <IconButton icon={<FastFillIcon size={18} />} label={t('toolbar.fastMode')} onClick={onToggleFastFill} active={fastFillMode} disabled={disabled} />
      {onToggleTip && (
        <IconButton icon={<TipIcon size={18} />} label={t('toolbar.tip')} onClick={onToggleTip} active={tipMode} disabled={disabled} />
      )}
    </div>
  );
}
