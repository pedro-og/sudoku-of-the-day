import React, { useCallback } from 'react';
import { SudokuCell } from './SudokuCell';
import type { GameState, CellValue } from '../types';
import { getConflicts } from '../lib/sudokuValidator';

interface SudokuGridProps {
  state: GameState;
  onSelectCell: (row: number, col: number) => void;
  mistakeCell?: [number, number] | null;
  mistakeValue?: CellValue;
  onFastFill?: (row: number, col: number) => void;
  fastFillNumber?: CellValue | null;
}

export const SudokuGrid = React.memo(function SudokuGrid({ state, onSelectCell, mistakeCell, mistakeValue, onFastFill, fastFillNumber }: SudokuGridProps) {
  const { board, fixed, notes, selectedCell } = state;

  const conflicts = getConflicts(board);

  const selRow = selectedCell?.[0] ?? -1;
  const selCol = selectedCell?.[1] ?? -1;
  const selVal = selRow >= 0 ? board[selRow][selCol] : 0;
  const selBoxRow = selRow >= 0 ? Math.floor(selRow / 3) * 3 : -1;
  const selBoxCol = selCol >= 0 ? Math.floor(selCol / 3) * 3 : -1;

  const isFastFilling = onFastFill && fastFillNumber !== null;
  const highlightVal = isFastFilling ? fastFillNumber : selVal;

  const handleSelect = useCallback((r: number, c: number) => {
    if (onFastFill) {
      onFastFill(r, c);
    } else {
      onSelectCell(r, c);
    }
  }, [onSelectCell, onFastFill]);

  return (
    <div
      role="grid"
      aria-label="Sudoku grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(9, 1fr)',
        gridTemplateRows: 'repeat(9, 1fr)',
        width: '100%',
        maxWidth: 'min(95vw, 480px)',
        aspectRatio: '1',
        border: '2px solid var(--cell-border-box)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {board.map((row, r) =>
        row.map((val, c) => {
          const isSelected = !isFastFilling && r === selRow && c === selCol;
          const isHighlighted =
            !isFastFilling &&
            !isSelected &&
            (r === selRow ||
              c === selCol ||
              (r >= selBoxRow && r < selBoxRow + 3 && c >= selBoxCol && c < selBoxCol + 3));
          const isSameNumber = highlightVal !== 0 && val === highlightVal;
          const isConflict = conflicts.has(`${r},${c}`);

          const isMistakeCell = !!(mistakeCell && mistakeCell[0] === r && mistakeCell[1] === c);

          const isAnimating = state.animatingCells.has(`${r},${c}`);

          return (
            <SudokuCell
              key={`${r}-${c}`}
              value={val}
              notes={notes[r][c]}
              isFixed={fixed[r][c]}
              isSelected={isSelected}
              isHighlighted={isHighlighted}
              isSameNumber={isSameNumber}
              isConflict={isConflict}
              row={r}
              col={c}
              onSelect={handleSelect}
              isMistake={isMistakeCell}
              mistakeValue={isMistakeCell ? mistakeValue : 0}
              isAnimating={isAnimating}
            />
          );
        })
      )}
    </div>
  );
});
