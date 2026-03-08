import React from 'react';
import type { CellValue, Board } from '../types';

interface NumberPadProps {
  board: Board;
  onNumber: (num: CellValue) => void;
  disabled: boolean;
  completedNumbers?: Set<number>;
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

export const NumberPad = React.memo(function NumberPad({ board, onNumber, disabled, completedNumbers }: NumberPadProps) {
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
              background: isDepleted ? 'transparent' : 'var(--numpad-bg)',
              color: isDepleted ? 'var(--numpad-text-muted)' : 'var(--numpad-text)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 2px',
              gap: '2px',
              opacity: isDepleted ? 0.35 : 1,
              transition: 'background var(--transition), opacity var(--transition)',
              minHeight: '52px',
              cursor: isDepleted || disabled ? 'default' : 'pointer',
              animation: isAnimating ? 'numberComplete 1000ms ease-out forwards' : 'none',
            }}
            onPointerDown={e => e.currentTarget.style.background = isDepleted ? 'transparent' : 'var(--numpad-bg-hover)'}
            onPointerUp={e => e.currentTarget.style.background = isDepleted ? 'transparent' : 'var(--numpad-bg)'}
            onPointerLeave={e => e.currentTarget.style.background = isDepleted ? 'transparent' : 'var(--numpad-bg)'}
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
