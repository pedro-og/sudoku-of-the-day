import React from 'react';
import type { CellValue, Board } from '@/types';
import { countPlaced } from '../lib/boardUtils';
import css from './NumberPad.module.css';

interface NumberPadProps {
  board: Board;
  onNumber: (num: CellValue) => void;
  disabled: boolean;
  completedNumbers?: Set<number>;
  fastFillNumber?: CellValue | null;
}

export const NumberPad = React.memo(function NumberPad({
  board, onNumber, disabled, completedNumbers, fastFillNumber,
}: NumberPadProps) {
  return (
    <div className={css.grid}>
      {([1, 2, 3, 4, 5, 6, 7, 8, 9] as CellValue[]).map(num => {
        const placed = countPlaced(board, num);
        const remaining = 9 - placed;
        const isDepleted = remaining <= 0;
        const isAnimating = completedNumbers?.has(num) ?? false;
        const isFastFill = fastFillNumber === num && !isDepleted;

        return (
          <button
            key={num}
            className={css.button}
            onClick={() => !isDepleted && !disabled && onNumber(num)}
            disabled={disabled || isDepleted}
            aria-label={`${num}, ${remaining} remaining`}
            data-depleted={isDepleted || undefined}
            data-fast-fill={isFastFill || undefined}
            data-animating={isAnimating || undefined}
          >
            <span className={css.number}>{num}</span>
            <span className={css.remaining}>{remaining}</span>
          </button>
        );
      })}
    </div>
  );
});
