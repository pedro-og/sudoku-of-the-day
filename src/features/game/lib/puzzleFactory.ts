import type { GameState } from '@/types';
import { getDailyPuzzle, getPracticePuzzle } from '@features/daily/lib/dailyPuzzle';
import { loadGameState, buildInitialState, pruneOldGames } from '@shared/lib/localGameStorage';
import { detectCompletions } from './completionDetector';

export function createDailyInitialState(): GameState {
  const { puzzle, solution, dateStr, puzzleNumber } = getDailyPuzzle();
  pruneOldGames(dateStr);

  const fixed = puzzle.map(row => row.map(cell => cell !== 0));
  const saved = loadGameState(dateStr, solution, fixed, puzzleNumber);
  return saved ?? buildInitialState(puzzle, solution, dateStr, puzzleNumber);
}

export function createPracticeInitialState(): GameState {
  const { puzzle, solution } = getPracticePuzzle();
  const fixed = puzzle.map(row => row.map(cell => cell !== 0));
  const notes: GameState['notes'] = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>())
  );
  const board = puzzle.map(row => [...row]) as GameState['board'];
  return {
    board,
    solution,
    fixed,
    notes,
    mistakes: 0,
    maxMistakes: 3,
    selectedCell: null,
    pencilMode: false,
    isComplete: false,
    isGameOver: false,
    elapsedSeconds: 0,
    startTime: null,
    puzzleDate: 'practice',
    puzzleNumber: 0,
    mistakeCell: null,
    mistakeValue: 0,
    animatingCells: new Set(),
    previousCompletions: detectCompletions(board),
    gameMode: 'practice',
  };
}
