// Components
export { DailySudoku } from './components/DailySudoku';
export { SudokuGrid } from './components/SudokuGrid';
export { SudokuCell } from './components/SudokuCell';
export { NumberPad } from './components/NumberPad';
export { GameToolbar } from './components/GameToolbar';
export { GameHeader } from './components/GameHeader';
export { GameTimer } from './components/GameTimer';

// Hooks
export { useGameState } from './hooks/useGameState';
export { useGameTimer } from './hooks/useGameTimer';
export { useKeyboardControls } from './hooks/useKeyboardControls';
export { useFastFill } from './hooks/useFastFill';

// Lib
export type { GeneratedPuzzle } from './lib/sudokuGenerator';
export { generatePuzzle } from './lib/sudokuGenerator';
export {
  isValidPlacement,
  getConflicts,
  isBoardComplete,
  cloneBoard,
} from './lib/sudokuValidator';
export type { CompletionState } from './lib/completionDetector';
export { detectCompletions, getCellsToAnimate } from './lib/completionDetector';
export {
  countPlaced,
  getNumberWithMostPlaced,
  areAllNumbersComplete,
} from './lib/boardUtils';
export {
  createDailyInitialState,
  createPracticeInitialState,
} from './lib/puzzleFactory';
