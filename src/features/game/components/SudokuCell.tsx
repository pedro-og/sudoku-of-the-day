import React from 'react';
import type { CellValue } from '@/types';
import css from './SudokuCell.module.css';

interface SudokuCellProps {
  value: CellValue;
  notes: Set<number>;
  isFixed: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isTipBlocked?: boolean;
  tipMode?: boolean;
  isSameNumber: boolean;
  isConflict: boolean;
  row: number;
  col: number;
  onSelect: (row: number, col: number) => void;
  isMistake?: boolean;
  mistakeValue?: CellValue;
  isAnimating?: boolean;
}

function NotesGrid({ notes, isSelected }: { notes: Set<number>; isSelected: boolean }) {
  return (
    <div className={css.notesGrid}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <span
          key={n}
          className={css.note}
          data-visible={notes.has(n) || undefined}
          data-selected={isSelected || undefined}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

export const SudokuCell = React.memo(function SudokuCell({
  value,
  notes,
  isFixed,
  isSelected,
  isHighlighted,
  isTipBlocked,
  tipMode,
  isSameNumber,
  isConflict,
  row,
  col,
  onSelect,
  isMistake,
  mistakeValue,
  isAnimating,
}: SudokuCellProps) {
  const hasNotes = value === 0 && notes.size > 0;
  const displayValue = isMistake ? mistakeValue : value;
  const animationDelay = isAnimating ? `${(row + col) * 20}ms` : undefined;

  return (
    <div
      role="gridcell"
      aria-selected={isSelected}
      aria-label={`Row ${row + 1}, column ${col + 1}${value ? `, value ${value}` : ''}`}
      className={css.cell}
      onClick={() => onSelect(row, col)}
      data-box-right={(col + 1) % 3 === 0 && col !== 8 || undefined}
      data-box-bottom={(row + 1) % 3 === 0 && row !== 8 || undefined}
      data-conflict={isConflict || undefined}
      data-selected={isSelected || undefined}
      data-same-number={isSameNumber && value !== 0 || undefined}
      data-highlighted={isHighlighted || undefined}
      data-tip-blocked={isTipBlocked || undefined}
      data-tip-mode={tipMode || undefined}
      data-fixed={isFixed || undefined}
      data-mistake={isMistake || undefined}
      data-animating={isAnimating || undefined}
      style={animationDelay ? { animationDelay } : undefined}
    >
      {hasNotes ? (
        <NotesGrid notes={notes} isSelected={isSelected} />
      ) : displayValue !== 0 ? (
        displayValue
      ) : null}
    </div>
  );
});
