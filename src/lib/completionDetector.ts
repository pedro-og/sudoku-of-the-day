import type { Board, CompletionState } from '../types';

export type { CompletionState };

function getCompletedRows(board: Board): Set<number> {
  const completed = new Set<number>();
  for (let r = 0; r < 9; r++) {
    if (board[r].every(val => val !== 0)) {
      completed.add(r);
    }
  }
  return completed;
}

function getCompletedCols(board: Board): Set<number> {
  const completed = new Set<number>();
  for (let c = 0; c < 9; c++) {
    if (board.every(row => row[c] !== 0)) {
      completed.add(c);
    }
  }
  return completed;
}

function getCompletedBoxes(board: Board): Set<number> {
  const completed = new Set<number>();
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxIndex = boxRow * 3 + boxCol;
      let isFull = true;
      for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
        for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
          if (board[r][c] === 0) {
            isFull = false;
            break;
          }
        }
        if (!isFull) break;
      }
      if (isFull) {
        completed.add(boxIndex);
      }
    }
  }
  return completed;
}

function getCompletedNumbers(board: Board): Set<number> {
  const completed = new Set<number>();
  for (let num = 1; num <= 9; num++) {
    let count = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell === num) count++;
      }
    }
    if (count === 9) {
      completed.add(num);
    }
  }
  return completed;
}

export function detectCompletions(board: Board): CompletionState {
  const completedRows = getCompletedRows(board);
  const completedCols = getCompletedCols(board);
  const completedBoxes = getCompletedBoxes(board);
  const completedNumbers = getCompletedNumbers(board);
  const isGridComplete = completedRows.size === 9;

  return {
    completedRows,
    completedCols,
    completedBoxes,
    completedNumbers,
    isGridComplete,
  };
}

export function getCellsToAnimate(
  current: CompletionState,
  previous: CompletionState | null,
  board?: Board
): Set<string> {
  const toAnimate = new Set<string>();

  if (current.completedRows) {
    current.completedRows.forEach(row => {
      if (!previous?.completedRows.has(row)) {
        for (let c = 0; c < 9; c++) {
          toAnimate.add(`${row},${c}`);
        }
      }
    });
  }

  if (current.completedCols) {
    current.completedCols.forEach(col => {
      if (!previous?.completedCols.has(col)) {
        for (let r = 0; r < 9; r++) {
          toAnimate.add(`${r},${col}`);
        }
      }
    });
  }

  if (current.completedBoxes) {
    current.completedBoxes.forEach(boxIndex => {
      if (!previous?.completedBoxes.has(boxIndex)) {
        const boxRow = Math.floor(boxIndex / 3);
        const boxCol = boxIndex % 3;
        for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
          for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
            toAnimate.add(`${r},${c}`);
          }
        }
      }
    });
  }

  // New number completions
  if (current.completedNumbers && board) {
    current.completedNumbers.forEach(num => {
      if (!previous?.completedNumbers.has(num)) {
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (board[r][c] === num) {
              toAnimate.add(`${r},${c}`);
            }
          }
        }
      }
    });
  }

  // Grid complete animation (all cells)
  if (current.isGridComplete && !previous?.isGridComplete) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        toAnimate.add(`${r},${c}`);
      }
    }
  }

  return toAnimate;
}
