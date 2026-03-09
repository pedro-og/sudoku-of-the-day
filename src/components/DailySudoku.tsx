import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getDailyPuzzle } from '../lib/dailyPuzzle';
import { loadGameState, buildInitialState, pruneOldGames } from '../lib/localGameStorage';
import { loadStreak, recordCompletion } from '../lib/streakTracker';
import { recordPlayerStarted } from '../lib/statsApi';

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

import type { CellValue, StreakData } from '../types';
interface DailySudokuProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function DailySudoku({ theme, onToggleTheme }: DailySudokuProps) {
  const { t } = useTranslation();
  const [showOverlay, setShowOverlay] = useState(true);

  const initialState = useMemo(() => {
    const { puzzle, solution, dateStr, puzzleNumber } = getDailyPuzzle();
    pruneOldGames(dateStr);

    const fixed = puzzle.map(row => row.map(cell => cell !== 0));
    const saved = loadGameState(dateStr, solution, fixed, puzzleNumber);
    return saved ?? buildInitialState(puzzle, solution, dateStr, puzzleNumber);
  }, []);

  const { state, selectCell, enterNumber, erase, togglePencil, undo, tick } = useGameState(initialState);
  const [streak, setStreak] = useState<StreakData>(() => loadStreak());
  const [fastFillActive, setFastFillActive] = useState(false);
  const [fastFillNumber, setFastFillNumber] = useState<CellValue | null>(null);

  useEffect(() => {
    if (state.isComplete) {
      recordCompletion(state.puzzleDate);
    }
  }, [state.isComplete, state.puzzleDate]);

  useEffect(() => {
    if (state.isComplete) {
      setStreak(loadStreak());
    }
  }, [state.isComplete]);

  useEffect(() => {
    recordPlayerStarted(state.puzzleNumber);
  }, [state.puzzleNumber]);

  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    function handleVisibility() {
      setIsHidden(document.hidden);
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const timerRunning = !state.isComplete && !state.isGameOver;
  useGameTimer(timerRunning, tick, state.elapsedSeconds);

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
      setFastFillActive(false);
      setFastFillNumber(null);
    }
  }, [state.board, fastFillActive, fastFillNumber]);

  useEffect(() => {
    if (state.isComplete || state.isGameOver) {
      setFastFillActive(false);
      setFastFillNumber(null);
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
            {t('header.puzzle', { number: state.puzzleNumber })}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <StreakDisplay streak={streak} />
          <GameTimer elapsedSeconds={state.elapsedSeconds} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </header>

      <div style={{ width: '100%', maxWidth: 'min(95vw, 480px)', display: 'flex', justifyContent: 'flex-end' }}>
        <MistakeCounter mistakes={state.mistakes} maxMistakes={state.maxMistakes} />
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 'min(95vw, 480px)' }}>
        <SudokuGrid state={state} onSelectCell={selectCell} onFastFill={fastFillActive ? handleFastFill : undefined} fastFillNumber={fastFillActive ? fastFillNumber : null} mistakeCell={state.mistakeCell} mistakeValue={state.mistakeValue} />
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
        onUndo={undo}
        onErase={erase}
        onTogglePencil={togglePencil}
        onToggleFastFill={handleToggleFastFill}
        disabled={gameDisabled}
      />

      <NumberPad
        board={state.board}
        onNumber={handleNumberPad}
        disabled={numberPadDisabled}
        completedNumbers={state.previousCompletions?.completedNumbers}
        fastFillNumber={fastFillActive ? fastFillNumber : null}
      />

      {showOverlay && <GameOverlay state={state} streak={streak} onDismiss={() => setShowOverlay(false)} />}

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
          {state.isComplete ? '🎉 ' : '😔 '} {t('complete.showResults')}
        </button>
      )}
    </div>
  );
}
