import { useEffect, useRef } from 'react';
import type { GameState } from '@/types';
import { saveGameState } from '@shared/lib/localGameStorage';
import { recordCompletion } from '../lib/streakTracker';
import { recordPuzzleSolved, recordPlayerStarted } from '../lib/statsApi';

export function useGamePersistence(state: GameState): void {
  const completionRecordedRef = useRef(false);

  // Save game state to localStorage on changes (daily mode only)
  useEffect(() => {
    if (state.gameMode !== 'practice') {
      saveGameState(state);
    }
  }, [state]);

  // Record streak completion and stats (once per completion)
  useEffect(() => {
    if (state.isComplete && state.gameMode !== 'practice' && !completionRecordedRef.current) {
      completionRecordedRef.current = true;
      recordCompletion(state.puzzleDate);
      recordPuzzleSolved(state.puzzleNumber, state.elapsedSeconds);
    }
  }, [state.isComplete, state.gameMode, state.puzzleDate, state.puzzleNumber, state.elapsedSeconds]);

  // Record player started (daily mode only)
  useEffect(() => {
    if (state.gameMode !== 'practice') {
      recordPlayerStarted(state.puzzleNumber);
    }
  }, [state.puzzleNumber, state.gameMode]);
}
