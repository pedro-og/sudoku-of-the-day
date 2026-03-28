// Components
export { GameOverlay } from './components/GameOverlay';
export { DailyStatsPanel } from './components/DailyStatsPanel';
export { MistakeCounter } from './components/MistakeCounter';
export { ShareResultButton } from './components/ShareResultButton';
export { StreakDisplay } from './components/StreakDisplay';

// Hooks
export { useGamePersistence } from './hooks/useGamePersistence';

// Lib
export { getDailyPuzzle, getPracticePuzzle, getBrazilDateString, getPuzzleNumber } from './lib/dailyPuzzle';
export { loadStreak, recordCompletion } from './lib/streakTracker';
export { fetchDailyStats, computeDisplayStats, recordPlayerStarted, recordPuzzleSolved } from './lib/statsApi';
export { buildShareText, copyShareText } from './lib/shareFormatter';
