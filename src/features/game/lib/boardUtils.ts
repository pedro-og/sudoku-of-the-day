import type { Board, CellValue } from '@/types';

export function countPlaced(board: Board, num: number): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === num) count++;
    }
  }
  return count;
}

export function getNumberWithMostPlaced(board: Board): CellValue | null {
  let maxNum: CellValue | null = null;
  let maxCount = -1;
  for (let num = 1; num <= 9; num++) {
    const count = countPlaced(board, num);
    if (count < 9 && count > maxCount) {
      maxCount = count;
      maxNum = num as CellValue;
    }
  }
  return maxNum;
}

export function areAllNumbersComplete(board: Board): boolean {
  for (let num = 1; num <= 9; num++) {
    if (countPlaced(board, num) < 9) return false;
  }
  return true;
}
