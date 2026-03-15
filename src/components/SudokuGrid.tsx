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
  tipMode?: boolean;
}

export const SudokuGrid = React.memo(function SudokuGrid({ state, onSelectCell, mistakeCell, mistakeValue, onFastFill, fastFillNumber, tipMode }: SudokuGridProps) {
  const { board, fixed, notes, selectedCell } = state;

  const conflicts = getConflicts(board);

  const selRow = selectedCell?.[0] ?? -1;
  const selCol = selectedCell?.[1] ?? -1;
  const selVal = selRow >= 0 ? board[selRow][selCol] : 0;
  const selBoxRow = selRow >= 0 ? Math.floor(selRow / 3) * 3 : -1;
  const selBoxCol = selCol >= 0 ? Math.floor(selCol / 3) * 3 : -1;

  const isFastFilling = onFastFill && fastFillNumber !== null;
  const highlightVal = isFastFilling ? fastFillNumber : selVal;

  // Tip mode: compute all cells blocked by every instance of highlightVal
  const tipBlockedCells = React.useMemo(() => {
    if (!tipMode || !highlightVal) return null;
    const blocked = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === highlightVal) {
          // Mark entire row, col, and box
          const boxR = Math.floor(r / 3) * 3;
          const boxC = Math.floor(c / 3) * 3;
          for (let i = 0; i < 9; i++) {
            blocked.add(`${r},${i}`); // row
            blocked.add(`${i},${c}`); // col
          }
          for (let br = boxR; br < boxR + 3; br++) {
            for (let bc = boxC; bc < boxC + 3; bc++) {
              blocked.add(`${br},${bc}`); // box
            }
          }
        }
      }
    }
    return blocked;
  }, [tipMode, highlightVal, board]);

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
          const isTipBlocked = !!(tipBlockedCells && !isSameNumber && tipBlockedCells.has(`${r},${c}`));
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
              isTipBlocked={isTipBlocked}
              tipMode={!!tipBlockedCells}
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
