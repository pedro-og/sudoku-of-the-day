import { useEffect } from 'react';
import type { CellValue } from '@/types';

interface KeyboardControlsConfig {
  isDisabled: boolean;
  selectedCell: [number, number] | null;
  fastFillActive: boolean;
  enterNumber: (num: CellValue) => void;
  erase: () => void;
  undo: () => void;
  togglePencil: () => void;
  selectCell: (row: number, col: number) => void;
  setFastFillNumber: (num: CellValue) => void;
  exitFastFill: () => void;
}

export function useKeyboardControls({
  isDisabled,
  selectedCell,
  fastFillActive,
  enterNumber,
  erase,
  undo,
  togglePencil,
  selectCell,
  setFastFillNumber,
  exitFastFill,
}: KeyboardControlsConfig): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isDisabled) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        if (fastFillActive) {
          setFastFillNumber(num as CellValue);
        } else {
          enterNumber(num as CellValue);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          if (fastFillActive) exitFastFill();
          break;
        case 'Backspace':
        case 'Delete':
        case '0':
          erase();
          break;
        case 'z':
        case 'Z':
          if (e.metaKey || e.ctrlKey) undo();
          break;
        case 'p':
        case 'P':
          togglePencil();
          break;
        case 'ArrowUp':
          if (selectedCell) {
            e.preventDefault();
            selectCell(Math.max(0, selectedCell[0] - 1), selectedCell[1]);
          }
          break;
        case 'ArrowDown':
          if (selectedCell) {
            e.preventDefault();
            selectCell(Math.min(8, selectedCell[0] + 1), selectedCell[1]);
          }
          break;
        case 'ArrowLeft':
          if (selectedCell) {
            e.preventDefault();
            selectCell(selectedCell[0], Math.max(0, selectedCell[1] - 1));
          }
          break;
        case 'ArrowRight':
          if (selectedCell) {
            e.preventDefault();
            selectCell(selectedCell[0], Math.min(8, selectedCell[1] + 1));
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isDisabled, selectedCell, fastFillActive,
    enterNumber, erase, undo, togglePencil, selectCell,
    setFastFillNumber, exitFastFill,
  ]);
}
