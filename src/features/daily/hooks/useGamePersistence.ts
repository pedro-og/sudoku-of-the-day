import { useEffect, useRef, type RefObject } from 'react';
import type { GameState } from '@/types';
import { saveGameState } from '@shared/lib/localGameStorage';
import {
  recordPlayerStarted,
  recordCompletion,
  ensurePlayer,
} from '../lib/statsApi';
import { getPlayerId } from '../lib/playerIdentity';

export function useGamePersistence(
  state: GameState,
  cellIntervalsRef: RefObject<number[]>,
  onRecordedCompletion?: () => void
): void {
  const completionRecordedRef = useRef(false);
  const gameOverRecordedRef = useRef(false);

  // Track whether the game was already complete when this hook first mounted.
  // If so, streak was already recorded in a previous session — don't record again.
  const wasAlreadyCompleteOnMountRef = useRef(state.isComplete);

  // Keep a ref to the latest state so completion effects always read fresh values,
  // without triggering re-runs on every state change.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Ensure anonymous player exists in DB (once ever)
  useEffect(() => {
    ensurePlayer(getPlayerId());
  }, []);

  // Save game state to localStorage on changes (daily mode only)
  useEffect(() => {
    if (state.gameMode !== 'practice') {
      saveGameState(state);
    }
  }, [state]);

  // Record streak completion and stats (once per completion)
  useEffect(() => {
    const s = stateRef.current;
    // Skip if game was already complete when the component mounted (previous session).
    // Streak was already recorded then — calling again risks resetting it if streak
    // localStorage was cleared between sessions.
    if (s.isComplete && s.gameMode !== 'practice' && !s.autoSolved && !completionRecordedRef.current && !wasAlreadyCompleteOnMountRef.current) {
      completionRecordedRef.current = true;
      recordCompletion(
        getPlayerId(),
        s.puzzleNumber,
        s.elapsedSeconds,
        s.mistakes,
        true,
        s.puzzleDate,
        cellIntervalsRef.current ?? []
      ).then(() => onRecordedCompletion?.());
    }
  }, [state.isComplete, state.gameMode, state.puzzleDate, state.puzzleNumber, cellIntervalsRef, onRecordedCompletion]);

  // Record game over (failure) stats
  useEffect(() => {
    const s = stateRef.current;
    if (s.isGameOver && !s.isComplete && s.gameMode !== 'practice' && !gameOverRecordedRef.current) {
      gameOverRecordedRef.current = true;
      recordCompletion(
        getPlayerId(),
        s.puzzleNumber,
        s.elapsedSeconds,
        s.mistakes,
        false,
        s.puzzleDate,
        cellIntervalsRef.current ?? []
      );
    }
  }, [state.isGameOver, state.isComplete, state.gameMode, state.puzzleDate, state.puzzleNumber, cellIntervalsRef]);

  // Record player started (daily mode only)
  useEffect(() => {
    if (state.gameMode !== 'practice') {
      recordPlayerStarted(state.puzzleNumber);
    }
  }, [state.puzzleNumber, state.gameMode]);
}
