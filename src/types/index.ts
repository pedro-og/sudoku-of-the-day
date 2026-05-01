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
  maxMistakes: number;
  extraChanceUsed: boolean;
  selectedCell: [number, number] | null;
  pencilMode: boolean;
  isComplete: boolean;
  isGameOver: boolean;
  elapsedSeconds: number;
  puzzleDate: string; // YYYY-MM-DD in Brazil timezone
  puzzleNumber: number;
  mistakeCell: [number, number] | null;
  mistakeValue: CellValue;
  animatingCells: Set<string>; // "row,col" format for cells being animated
  previousCompletions: CompletionState;
  gameMode: GameMode;
  autoSolved: boolean; // true when completed via dev Auto-Solve — excluded from stats
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
}

export interface PuzzleStatsResponse {
  total_solvers: number;
  total_failures: number;
  percentile: number;
  avg_solve_time_seconds: number;
  avg_fail_mistakes: number;
}

export interface StreakLeaderboardEntry {
  player_id: string;
  username: string | null;
  current_streak: number;
  longest_streak: number;
  rank: number;
}

export interface StreakLeaderboardResponse {
  player_rank: number;
  player_streak: number;
  total_players_with_streaks: number;
  leaderboard: StreakLeaderboardEntry[];
}

export interface SpeedLeaderboardEntry {
  player_id: string;
  username: string | null;
  elapsed_seconds: number;
  rank: number;
}

export interface SpeedLeaderboardResponse {
  player_rank: number | null;
  player_time: number | null;
  total_solvers: number;
  leaderboard: SpeedLeaderboardEntry[];
}
