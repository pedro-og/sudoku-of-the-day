// Core game types used throughout the application

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Board = CellValue[][];
export type Notes = Set<number>[][];
export type FixedCells = boolean[][];

export interface CompletionState {
  completedRows: Set<number>;
  completedCols: Set<number>;
  completedBoxes: Set<number>;
  completedNumbers: Set<number>;
  isGridComplete: boolean;
}

export type GameMode = 'daily' | 'practice';

export interface GameState {
  board: Board;
  solution: Board;
  fixed: FixedCells;
  notes: Notes;
  mistakes: number;
  maxMistakes: 3;
  selectedCell: [number, number] | null;
  pencilMode: boolean;
  isComplete: boolean;
  isGameOver: boolean;
  elapsedSeconds: number;
  startTime: number | null;
  puzzleDate: string; // YYYY-MM-DD in Brazil timezone
  puzzleNumber: number;
  mistakeCell: [number, number] | null;
  mistakeValue: CellValue;
  animatingCells: Set<string>; // "row,col" format for cells being animated
  previousCompletions: CompletionState;
  gameMode: GameMode;
}

export interface DailyStats {
  puzzle_number: number;
  players_started: number;
  players_solved: number;
  total_completion_time: number; // seconds
}

export interface StreakData {
  currentStreak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  longestStreak: number;
}

export interface ShareData {
  puzzleNumber: number;
  mistakes: number;
  elapsedSeconds: number;
  streak: number;
  board: Board;
  solution: Board;
  fixed: FixedCells;
}
