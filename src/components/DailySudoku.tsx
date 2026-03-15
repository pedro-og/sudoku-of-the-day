import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getDailyPuzzle, getPracticePuzzle } from '../lib/dailyPuzzle';
import { loadGameState, buildInitialState, pruneOldGames } from '../lib/localGameStorage';
import { loadStreak, recordCompletion } from '../lib/streakTracker';
import { recordPlayerStarted } from '../lib/statsApi';
import { detectCompletions } from '../lib/completionDetector';

import { useGameState } from '../hooks/useGameState';
import { useGameTimer } from '../hooks/useGameTimer';

import { SudokuGrid } from './SudokuGrid';
import { NumberPad } from './NumberPad';
import { GameToolbar } from './GameToolbar';
import { MistakeCounter } from './MistakeCounter';
import { StreakDisplay } from './StreakDisplay';
import { ThemeToggle } from './ThemeToggle';
import { GameTimer } from './GameTimer';
import { GameOverlay } from './GameOverlay';
import { PracticeOverlay } from './PracticeOverlay';

import type { CellValue, GameState, StreakData } from '../types';
interface DailySudokuProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

function createDailyInitialState(): GameState {
  const { puzzle, solution, dateStr, puzzleNumber } = getDailyPuzzle();
  pruneOldGames(dateStr);

  const fixed = puzzle.map(row => row.map(cell => cell !== 0));
  const saved = loadGameState(dateStr, solution, fixed, puzzleNumber);
  return saved ?? buildInitialState(puzzle, solution, dateStr, puzzleNumber);
}

function createPracticeInitialState(): GameState {
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

export function DailySudoku({ theme, onToggleTheme }: DailySudokuProps) {
  const { t } = useTranslation();
  const [showOverlay, setShowOverlay] = useState(true);
  const [showPracticeIntro, setShowPracticeIntro] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const dailyState = useMemo(() => createDailyInitialState(), []);

  const { state, selectCell, enterNumber, erase, togglePencil, undo, tick, reset } = useGameState(dailyState);
  const [streak, setStreak] = useState<StreakData>(() => loadStreak());
  const [fastFillActive, setFastFillActive] = useState(false);
  const [fastFillNumber, setFastFillNumber] = useState<CellValue | null>(null);
  const [tipActive, setTipActive] = useState(false);

  const isPractice = state.gameMode === 'practice';
  const [timerResetKey, setTimerResetKey] = useState(0);

  const bumpTimerReset = useCallback(() => {
    setTimerResetKey(k => k + 1);
  }, []);

  const handleStartPractice = useCallback(() => {
    setShowPracticeIntro(false);
    setShowOverlay(true);
    setFastFillActive(false);
    setFastFillNumber(null);
    setTipActive(false);
    reset(createPracticeInitialState());
    bumpTimerReset();
  }, [reset, bumpTimerReset]);

  const handleBackToDaily = useCallback(() => {
    setShowOverlay(true);
    setFastFillActive(false);
    setFastFillNumber(null);
    setTipActive(false);
    reset(createDailyInitialState());
    bumpTimerReset();
  }, [reset, bumpTimerReset]);

  const handleNewPractice = useCallback(() => {
    setShowOverlay(true);
    setFastFillActive(false);
    setFastFillNumber(null);
    setTipActive(false);
    reset(createPracticeInitialState());
    bumpTimerReset();
  }, [reset, bumpTimerReset]);

  useEffect(() => {
    if (state.isComplete && state.gameMode !== 'practice') {
      recordCompletion(state.puzzleDate);
    }
  }, [state.isComplete, state.puzzleDate, state.gameMode]);

  useEffect(() => {
    if (state.isComplete && state.gameMode !== 'practice') {
      setStreak(loadStreak());
    }
  }, [state.isComplete, state.gameMode]);

  useEffect(() => {
    if (state.gameMode !== 'practice') {
      recordPlayerStarted(state.puzzleNumber);
    }
  }, [state.puzzleNumber, state.gameMode]);

  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    function handleVisibility() {
      setIsHidden(document.hidden);
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const timerRunning = !state.isComplete && !state.isGameOver;
  useGameTimer(timerRunning, tick, state.elapsedSeconds, timerResetKey);

  const getNumberWithMostPlaced = () => {
    const counts: Record<number, number> = {};
    for (let num = 1; num <= 9; num++) {
      counts[num] = 0;
    }
    for (const row of state.board) {
      for (const cell of row) {
        if (cell >= 1 && cell <= 9) {
          counts[cell]++;
        }
      }
    }
    let maxNum: CellValue | null = null;
    let maxCount = -1;
    for (let num = 1; num <= 9; num++) {
      if (counts[num] < 9 && counts[num] > maxCount) {
        maxCount = counts[num];
        maxNum = num as CellValue;
      }
    }
    return maxNum;
  };

  const handleNumberPad = (num: CellValue) => {
    if (fastFillActive) {
      setFastFillNumber(num);
    } else {
      enterNumber(num);
    }
  };

  const handleToggleFastFill = () => {
    if (!fastFillActive) {
      const numToSelect = getNumberWithMostPlaced();
      if (numToSelect !== null) {
        setFastFillActive(true);
        setFastFillNumber(numToSelect);
      }
    } else {
      setFastFillActive(false);
      setFastFillNumber(null);
    }
  };

  const handleFastFill = (row: number, col: number) => {
    const clickedValue = state.board[row][col];

    if (clickedValue !== 0) {
      setFastFillNumber(clickedValue as CellValue);
    } else if (fastFillNumber !== null) {
      selectCell(row, col);
      enterNumber(fastFillNumber);
    }
  };

  useEffect(() => {
    if (!fastFillActive || fastFillNumber === null) return;

    const counts: Record<number, number> = {};
    for (let num = 1; num <= 9; num++) {
      counts[num] = 0;
    }
    for (const row of state.board) {
      for (const cell of row) {
        if (cell >= 1 && cell <= 9) {
          counts[cell]++;
        }
      }
    }

    if (counts[fastFillNumber] === 9) {
      for (let nextNum = fastFillNumber + 1; nextNum <= 9; nextNum++) {
        if (counts[nextNum] < 9) {
          setFastFillNumber(nextNum as CellValue);
          return;
        }
      }
      for (let nextNum = 1; nextNum < fastFillNumber; nextNum++) {
        if (counts[nextNum] < 9) {
          setFastFillNumber(nextNum as CellValue);
          return;
        }
      }
      setFastFillActive(false);
      setFastFillNumber(null);
    }
  }, [state.board, fastFillActive, fastFillNumber]);

  useEffect(() => {
    if (state.isComplete || state.isGameOver) {
      setFastFillActive(false);
      setFastFillNumber(null);
      setTipActive(false);
    }
  }, [state.isComplete, state.isGameOver]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (state.isComplete || state.isGameOver) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        if (fastFillActive) {
          setFastFillNumber(num as CellValue);
        } else {
          enterNumber(num as CellValue);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          if (fastFillActive) {
            setFastFillActive(false);
            setFastFillNumber(null);
          }
          break;
        case 'Backspace':
        case 'Delete':
        case '0':
          erase();
          break;
        case 'z':
        case 'Z':
          if (e.metaKey || e.ctrlKey) undo();
          break;
        case 'p':
        case 'P':
          togglePencil();
          break;
        case 'ArrowUp':
          if (state.selectedCell) {
            e.preventDefault();
            const [r, c] = state.selectedCell;
            selectCell(Math.max(0, r - 1), c);
          }
          break;
        case 'ArrowDown':
          if (state.selectedCell) {
            e.preventDefault();
            const [r, c] = state.selectedCell;
            selectCell(Math.min(8, r + 1), c);
          }
          break;
        case 'ArrowLeft':
          if (state.selectedCell) {
            e.preventDefault();
            const [r, c] = state.selectedCell;
            selectCell(r, Math.max(0, c - 1));
          }
          break;
        case 'ArrowRight':
          if (state.selectedCell) {
            e.preventDefault();
            const [r, c] = state.selectedCell;
            selectCell(r, Math.min(8, c + 1));
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedCell, state.isComplete, state.isGameOver, enterNumber, erase, undo, togglePencil, selectCell, fastFillActive, fastFillNumber]);

  const gameDisabled = state.isComplete || state.isGameOver;
  const allNumbersFound = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as CellValue[]).every(num => {
    let count = 0;
    for (const row of state.board) {
      for (const cell of row) {
        if (cell === num) count++;
      }
    }
    return count === 9;
  });
  const numberPadDisabled = gameDisabled || (fastFillActive && allNumbersFound);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      maxWidth: '520px',
      margin: '0 auto',
      padding: '12px 12px 24px',
      minHeight: '100dvh',
    }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 'min(95vw, 480px)',
        padding: '4px 0',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}>
            {t('app.title')}
          </h1>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
            {isPractice ? t('practice.overlayTitle') : t('header.puzzle', { number: state.puzzleNumber })}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isPractice && <StreakDisplay streak={streak} />}
          <GameTimer elapsedSeconds={state.elapsedSeconds} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </header>

      <div style={{
        width: '100%',
        maxWidth: 'min(95vw, 480px)',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '12px',
      }}>
        {!isPractice && (
          <button
            onClick={() => setShowPracticeIntro(true)}
            style={{
              padding: '5px 12px',
              background: 'var(--btn-bg)',
              color: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background var(--transition)',
            }}
          >
            {t('practice.button')}
          </button>
        )}
        {isPractice && !gameDisabled && (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            style={{
              padding: '5px 12px',
              background: 'var(--btn-bg)',
              color: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background var(--transition)',
            }}
          >
            {t('practice.backToChallenge')}
          </button>
        )}
        {!isPractice && (
          <MistakeCounter mistakes={state.mistakes} maxMistakes={state.maxMistakes} />
        )}
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 'min(95vw, 480px)' }}>
        <SudokuGrid state={state} onSelectCell={selectCell} onFastFill={fastFillActive ? handleFastFill : undefined} fastFillNumber={fastFillActive ? fastFillNumber : null} mistakeCell={state.mistakeCell} mistakeValue={state.mistakeValue} tipMode={tipActive} />
        {isHidden && !gameDisabled && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '8px',
            zIndex: 10,
          }} />
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
        onToggleTip={isPractice ? () => setTipActive(t => !t) : undefined}
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

      {showLeaveConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLeaveConfirm(false); }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--overlay-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
            backdropFilter: 'blur(4px)',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              background: 'var(--modal-bg)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 24px',
              width: '100%',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              cursor: 'default',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>⚠️</div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('practice.leaveTitle')}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {t('practice.leaveDescription')}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button
                onClick={() => { setShowLeaveConfirm(false); handleBackToDaily(); }}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {t('practice.leaveConfirm')}
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--cell-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('practice.leaveCancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {!showOverlay && (state.isComplete || state.isGameOver) && (
        <button
          onClick={() => setShowOverlay(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 16px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            zIndex: 50,
          }}
        >
          {isPractice ? '🏋️ ' : state.isComplete ? '🎉 ' : '😔 '} {t('complete.showResults')}
        </button>
      )}
    </div>
  );
}
