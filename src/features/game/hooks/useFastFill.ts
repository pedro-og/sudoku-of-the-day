import { useState, useCallback, useEffect } from 'react';
import type { Board, CellValue } from '@/types';
import { getNumberWithMostPlaced, countPlaced } from '../lib/boardUtils';

interface UseFastFillReturn {
  fastFillActive: boolean;
  fastFillNumber: CellValue | null;
  handleToggleFastFill: () => void;
  handleFastFill: (row: number, col: number) => void;
  handleNumberPad: (num: CellValue) => void;
  setFastFillNumber: (num: CellValue) => void;
  exitFastFill: () => void;
}

export function useFastFill(
  board: Board,
  selectCell: (row: number, col: number) => void,
  enterNumber: (num: CellValue) => void,
  isDisabled: boolean,
): UseFastFillReturn {
  const [fastFillActive, setFastFillActive] = useState(false);
  const [fastFillNumber, setFastFillNumber] = useState<CellValue | null>(null);

  const exitFastFill = useCallback(() => {
    setFastFillActive(false);
    setFastFillNumber(null);
  }, []);

  const handleToggleFastFill = useCallback(() => {
    if (!fastFillActive) {
      const numToSelect = getNumberWithMostPlaced(board);
      if (numToSelect !== null) {
        setFastFillActive(true);
        setFastFillNumber(numToSelect);
      }
    } else {
      exitFastFill();
    }
  }, [fastFillActive, board, exitFastFill]);

  const handleFastFill = useCallback((row: number, col: number) => {
    const clickedValue = board[row][col];
    if (clickedValue !== 0) {
      setFastFillNumber(clickedValue as CellValue);
    } else if (fastFillNumber !== null) {
      selectCell(row, col);
      enterNumber(fastFillNumber);
    }
  }, [board, fastFillNumber, selectCell, enterNumber]);

  const handleNumberPad = useCallback((num: CellValue) => {
    if (fastFillActive) {
      setFastFillNumber(num);
    } else {
      enterNumber(num);
    }
  }, [fastFillActive, enterNumber]);

  // Auto-advance to next number when current number is fully placed
  useEffect(() => {
    if (!fastFillActive || fastFillNumber === null) return;

    if (countPlaced(board, fastFillNumber) === 9) {
      for (let nextNum = fastFillNumber + 1; nextNum <= 9; nextNum++) {
        if (countPlaced(board, nextNum) < 9) {
          requestAnimationFrame(() => setFastFillNumber(nextNum as CellValue));
          return;
        }
      }
      for (let nextNum = 1; nextNum < fastFillNumber; nextNum++) {
        if (countPlaced(board, nextNum) < 9) {
          requestAnimationFrame(() => setFastFillNumber(nextNum as CellValue));
          return;
        }
      }
      requestAnimationFrame(() => exitFastFill());
    }
  }, [board, fastFillActive, fastFillNumber, exitFastFill]);

  // Exit fast-fill when game ends
  useEffect(() => {
    if (isDisabled) {
      requestAnimationFrame(() => {
        setFastFillActive(false);
        setFastFillNumber(null);
      });
    }
  }, [isDisabled]);

  return {
    fastFillActive,
    fastFillNumber,
    handleToggleFastFill,
    handleFastFill,
    handleNumberPad,
    setFastFillNumber,
    exitFastFill,
  };
}
