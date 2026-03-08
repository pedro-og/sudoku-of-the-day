import React from 'react';
import type { CellValue } from '../types';

interface SudokuCellProps {
  value: CellValue;
  notes: Set<number>;
  isFixed: boolean;
  isSelected: boolean;
  isHighlighted: boolean;      // same row / col / box as selected
  isSameNumber: boolean;       // same digit as selected cell
  isConflict: boolean;
  row: number;
  col: number;
  onSelect: (row: number, col: number) => void;
  isMistake?: boolean;         // temporarily show wrong number
  mistakeValue?: CellValue;    // the wrong number that was entered
  isAnimating?: boolean;       // completion animation
}

// Thin right border → thick for box boundaries (cols 2, 5)
// Thin bottom border → thick for box boundaries (rows 2, 5)
function getCellStyle(row: number, col: number): React.CSSProperties {
  return {
    borderRight: (col + 1) % 3 === 0 && col !== 8 ? '2px solid var(--cell-border-box)' : '1px solid var(--cell-border)',
    borderBottom: (row + 1) % 3 === 0 && row !== 8 ? '2px solid var(--cell-border-box)' : '1px solid var(--cell-border)',
  };
}

function NotesGrid({ notes, isSelected }: { notes: Set<number>; isSelected: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      width: '100%',
      height: '100%',
      padding: '1px',
    }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <span key={n} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'clamp(7px, 1.4vw, 10px)',
          color: isSelected ? 'var(--cell-text-selected-vivid)' : 'var(--cell-text-notes)',
          lineHeight: 1,
          fontWeight: 500,
          opacity: notes.has(n) ? 1 : 0,
        }}>
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
  isSameNumber,
  isConflict,
  row,
  col,
  onSelect,
  isMistake,
  mistakeValue,
  isAnimating,
}: SudokuCellProps) {
  let bg = 'var(--cell-bg)';
  if (isConflict) bg = 'var(--cell-bg-conflict)';
  else if (isSelected) bg = 'var(--cell-bg-selected-vivid)';
  else if (isSameNumber && value !== 0) bg = 'var(--cell-bg-same-num)';
  else if (isHighlighted) bg = 'var(--cell-bg-highlight)';

  let textColor = isFixed ? 'var(--cell-text-fixed)' : 'var(--cell-text-user)';
  if (isSelected) textColor = 'var(--cell-text-selected-vivid)';
  else if (isConflict) textColor = 'var(--cell-text-error)';

  const hasNotes = value === 0 && notes.size > 0;
  const displayValue = isMistake ? mistakeValue : value;

  // Calculate stagger delay for completion animation (diagonal wave effect)
  const animationDelay = isAnimating ? `${(row + col) * 20}ms` : 'unset';

  return (
    <div
      role="gridcell"
      aria-selected={isSelected}
      aria-label={`Row ${row + 1}, column ${col + 1}${value ? `, value ${value}` : ''}`}
      onClick={() => onSelect(row, col)}
      style={{
        ...getCellStyle(row, col),
        background: bg,
        color: isMistake ? 'var(--cell-text-mistake)' : textColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 500,
        fontSize: hasNotes ? undefined : 'clamp(16px, 4.5vw, 28px)',
        cursor: 'pointer',
        transition: 'background 100ms ease',
        position: 'relative',
        aspectRatio: '1',
        opacity: isMistake ? 0.5 : 1,
        animation: isMistake ? 'shake 1000ms ease-out' : isAnimating ? 'completionFlash 1000ms ease-out forwards' : 'none',
        animationDelay,
      }}
    >
      {hasNotes ? (
        <NotesGrid notes={notes} isSelected={isSelected} />
      ) : displayValue !== 0 ? (
        displayValue
      ) : null}
    </div>
  );
});
