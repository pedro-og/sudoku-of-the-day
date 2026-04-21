import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { createDailyInitialState, createPracticeInitialState } from '../lib/puzzleFactory';
import { areAllNumbersComplete } from '../lib/boardUtils';

import { useGameState } from '../hooks/useGameState';
import { useGameTimer } from '../hooks/useGameTimer';
import { useGamePersistence } from '@features/daily/hooks/useGamePersistence';
import { useStreak } from '@features/daily/hooks/useStreak';
import { useAuth } from '@features/auth/context/AuthContext';
import { useFastFill } from '../hooks/useFastFill';
import { useKeyboardControls } from '../hooks/useKeyboardControls';

import { GameHeader } from './GameHeader';
import { SudokuGrid } from './SudokuGrid';
import { NumberPad } from './NumberPad';
import { GameToolbar } from './GameToolbar';
import { MistakeCounter } from '@features/daily/components/MistakeCounter';
import { GameOverlay } from '@features/daily/components/GameOverlay';
import { PracticeOverlay } from '@features/practice/components/PracticeOverlay';
import { Modal } from '@shared/components/Modal/Modal';
import { Button } from '@shared/components/Button/Button';

import css from './DailySudoku.module.css';

interface DailySudokuProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenMenu?: () => void;
}

export function DailySudoku({ theme, onToggleTheme, onOpenMenu }: DailySudokuProps) {
  const { t } = useTranslation();
  const { refreshProfile } = useAuth();
  const [showOverlay, setShowOverlay] = useState(true);
  const [showPracticeIntro, setShowPracticeIntro] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [tipActive, setTipActive] = useState(false);

  const [dailyState] = useState(() => createDailyInitialState());
  const { state, selectCell, enterNumber, erase, togglePencil, undo, tick, reset, autoSolve, cellIntervalsRef } = useGameState(dailyState);
  const streak = useStreak(state.isComplete, state.puzzleDate, state.autoSolved);

  const isPractice = state.gameMode === 'practice';
  const gameDisabled = state.isComplete || state.isGameOver;
  const [timerResetKey, setTimerResetKey] = useState(0);

  // Persistence (save to localStorage, record stats)
  useGamePersistence(state, cellIntervalsRef, refreshProfile);

  // Fast-fill mode
  const {
    fastFillActive, fastFillNumber,
    handleToggleFastFill, handleFastFill, handleNumberPad,
    setFastFillNumber, exitFastFill,
  } = useFastFill(state.board, selectCell, enterNumber, gameDisabled);

  // Keyboard controls
  useKeyboardControls({
    isDisabled: gameDisabled,
    selectedCell: state.selectedCell,
    fastFillActive,
    enterNumber, erase, undo, togglePencil, selectCell,
    setFastFillNumber, exitFastFill,
  });

  // Timer
  const bumpTimerReset = useCallback(() => setTimerResetKey(k => k + 1), []);
  const timerRunning = !state.isComplete && !state.isGameOver;
  useGameTimer(timerRunning, tick, state.elapsedSeconds, timerResetKey);

  // Visibility blur
  const [isHidden, setIsHidden] = useState(false);
  useEffect(() => {
    const handler = () => setIsHidden(document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Mode switching
  const resetUI = useCallback(() => {
    setShowOverlay(true);
    setTipActive(false);
    exitFastFill();
    bumpTimerReset();
  }, [exitFastFill, bumpTimerReset]);

  const handleStartPractice = useCallback(() => {
    setShowPracticeIntro(false);
    resetUI();
    reset(createPracticeInitialState());
  }, [reset, resetUI]);

  const handleBackToDaily = useCallback(() => {
    resetUI();
    reset(createDailyInitialState());
  }, [reset, resetUI]);

  const handleNewPractice = useCallback(() => {
    resetUI();
    reset(createPracticeInitialState());
  }, [reset, resetUI]);

  const numberPadDisabled = gameDisabled || (fastFillActive && areAllNumbersComplete(state.board));

  return (
    <div className={css.container}>
      <GameHeader
        puzzleNumber={state.puzzleNumber}
        isPractice={isPractice}
        elapsedSeconds={state.elapsedSeconds}
        streak={streak}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenMenu={onOpenMenu}
      />

      <div className={css.actionBar}>
        {!isPractice && (
          <Button variant="ghost" size="sm" onClick={() => setShowPracticeIntro(true)}>
            {t('practice.button')}
          </Button>
        )}
        {isPractice && !gameDisabled && (
          <Button variant="ghost" size="sm" onClick={() => setShowLeaveConfirm(true)}>
            {t('practice.backToChallenge')}
          </Button>
        )}
        {!isPractice && (
          <MistakeCounter mistakes={state.mistakes} maxMistakes={state.maxMistakes} />
        )}
        {import.meta.env.DEV && !gameDisabled && (
          <Button variant="ghost" size="sm" onClick={autoSolve}>
            Auto-Solve
          </Button>
        )}
      </div>

      <div className={css.gridWrapper}>
        <SudokuGrid
          state={state}
          onSelectCell={selectCell}
          onFastFill={fastFillActive ? handleFastFill : undefined}
          fastFillNumber={fastFillActive ? fastFillNumber : null}
          mistakeCell={state.mistakeCell}
          mistakeValue={state.mistakeValue}
          tipMode={tipActive}
        />
        {isHidden && !gameDisabled && (
          <div className={css.blurOverlay} />
        )}
      </div>

      <GameToolbar
        pencilMode={state.pencilMode}
        fastFillMode={fastFillActive}
        tipMode={tipActive}
        onUndo={undo}
        onErase={erase}
        onTogglePencil={togglePencil}
        onToggleFastFill={handleToggleFastFill}
        onToggleTip={isPractice ? () => setTipActive(prev => !prev) : undefined}
        disabled={gameDisabled}
      />

      <NumberPad
        board={state.board}
        onNumber={handleNumberPad}
        disabled={numberPadDisabled}
        completedNumbers={state.previousCompletions?.completedNumbers}
        fastFillNumber={fastFillActive ? fastFillNumber : null}
      />

      {showOverlay && (
        <GameOverlay
          state={state}
          streak={streak}
          onDismiss={() => setShowOverlay(false)}
          onBackToDaily={handleBackToDaily}
          onNewPractice={handleNewPractice}
        />
      )}

      {showPracticeIntro && (
        <PracticeOverlay
          onStart={handleStartPractice}
          onCancel={() => setShowPracticeIntro(false)}
        />
      )}

      <Modal
        open={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        ariaLabel={t('practice.leaveTitle')}
      >
        <div className={css.modalContent}>
          <div className={css.modalEmoji}>⚠️</div>
          <h2 className={css.modalTitle}>
            {t('practice.leaveTitle')}
          </h2>
          <p className={css.modalDescription}>
            {t('practice.leaveDescription')}
          </p>
        </div>
        <div className={css.modalActions}>
          <Button variant="primary" size="lg" fullWidth onClick={() => { setShowLeaveConfirm(false); handleBackToDaily(); }}>
            {t('practice.leaveConfirm')}
          </Button>
          <Button variant="secondary" size="md" fullWidth onClick={() => setShowLeaveConfirm(false)}>
            {t('practice.leaveCancel')}
          </Button>
        </div>
      </Modal>

      {!showOverlay && (state.isComplete || state.isGameOver) && (
        <Button
          variant="primary"
          onClick={() => setShowOverlay(true)}
          className={css.showResultsButton}
        >
          {isPractice ? '🏋️ ' : state.isComplete ? '🎉 ' : '😔 '} {t('complete.showResults')}
        </Button>
      )}
    </div>
  );
}
