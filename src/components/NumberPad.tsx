import React from 'react';
import type { CellValue, Board } from '../types';

interface NumberPadProps {
  board: Board;
  onNumber: (num: CellValue) => void;
  disabled: boolean;
  completedNumbers?: Set<number>;
  fastFillNumber?: CellValue | null;
}

function countPlaced(board: Board, num: number): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === num) count++;
    }
  }
  return count;
}

export const NumberPad = React.memo(function NumberPad({ board, onNumber, disabled, completedNumbers, fastFillNumber }: NumberPadProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(9, 1fr)',
      gap: '6px',
      width: '100%',
      maxWidth: 'min(95vw, 480px)',
    }}>
      {([1, 2, 3, 4, 5, 6, 7, 8, 9] as CellValue[]).map(num => {
        const placed = countPlaced(board, num);
        const remaining = 9 - placed;
        const isDepleted = remaining <= 0;
        const isAnimating = completedNumbers?.has(num) ?? false;
        const isFastFill = fastFillNumber === num;
        const shouldShowBorder = isFastFill && !isDepleted;

        return (
          <button
            key={num}
            onClick={() => !isDepleted && !disabled && onNumber(num)}
            disabled={disabled || isDepleted}
            aria-label={`${num}, ${remaining} remaining`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: isFastFill && isDepleted ? 'var(--numpad-bg)' : isDepleted ? 'transparent' : 'var(--numpad-bg)',
              color: isDepleted && !isFastFill ? 'var(--numpad-text-muted)' : 'var(--numpad-text)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 2px',
              gap: '2px',
              opacity: isDepleted && !isFastFill ? 0.35 : 1,
              transition: 'background var(--transition), opacity var(--transition), box-shadow var(--transition)',
              minHeight: '52px',
              cursor: isDepleted && !isFastFill ? 'default' : 'pointer',
              animation: isAnimating ? 'numberComplete 1000ms ease-out forwards' : 'none',
              border: shouldShowBorder ? '2px solid var(--accent)' : '2px solid transparent',
              boxShadow: shouldShowBorder ? `0 0 12px rgba(var(--accent-rgb), 0.4)` : 'none',
            }}
            onPointerDown={e => {
              if (!isDepleted) {
                e.currentTarget.style.background = 'var(--numpad-bg-hover)';
              }
            }}
            onPointerUp={e => {
              if (!isDepleted) {
                e.currentTarget.style.background = 'var(--numpad-bg)';
              }
            }}
            onPointerLeave={e => {
              if (!isDepleted) {
                e.currentTarget.style.background = 'var(--numpad-bg)';
              }
            }}
          >
            <span style={{ fontSize: 'clamp(18px, 5vw, 26px)', fontWeight: 700, lineHeight: 1 }}>
              {num}
            </span>
            <span style={{ fontSize: 'clamp(9px, 2.2vw, 11px)', color: 'var(--numpad-text-muted)', lineHeight: 1 }}>
              {remaining}
            </span>
          </button>
        );
      })}
    </div>
  );
});
