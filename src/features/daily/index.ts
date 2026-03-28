// Components
export { GameOverlay } from './components/GameOverlay';
export { DailyStatsPanel } from './components/DailyStatsPanel';
export { useGlobalStats } from './components/GlobalStatsPanel';
export { StreakLeaderboard } from './components/StreakLeaderboard';
export { MistakeCounter } from './components/MistakeCounter';
export { ShareResultButton } from './components/ShareResultButton';
export { StreakDisplay } from './components/StreakDisplay';

// Hooks
export { useGamePersistence } from './hooks/useGamePersistence';
export { useStreak } from './hooks/useStreak';

// Lib
export { getDailyPuzzle, getPracticePuzzle, getBrazilDateString, getPuzzleNumber } from './lib/dailyPuzzle';
export { loadStreak, recordCompletion as recordStreakCompletion } from './lib/streakTracker';
export { getPlayerId } from './lib/playerIdentity';
export {
  fetchDailyStats,
  computeDisplayStats,
  recordPlayerStarted,
  ensurePlayer,
  recordCompletion,
  fetchPuzzleStats,
  fetchStreakLeaderboard,
  fetchSpeedLeaderboard,
} from './lib/statsApi';
export { buildShareText, copyShareText } from './lib/shareFormatter';
