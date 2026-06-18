import { useCallback, useReducer, useEffect, useRef } from 'react';
import type { GameState, CellValue } from '@/types';
import { isBoardComplete, cloneBoard } from '../lib/sudokuValidator';
import { detectCompletions, getCellsToAnimate } from '../lib/completionDetector';


type Action =
  | { type: 'SELECT_CELL'; row: number; col: number }
  | { type: 'ENTER_NUMBER'; num: CellValue }
  | { type: 'ERASE' }
  | { type: 'TOGGLE_PENCIL' }
  | { type: 'UNDO' }
  | { type: 'TICK'; elapsed: number }
  | { type: 'RESET'; state: GameState }
  | { type: 'CLEAR_MISTAKE' }
  | { type: 'CLEAR_ANIMATIONS' }
  | { type: 'AUTO_SOLVE' }
  | { type: 'GRANT_EXTRA_CHANCE' }
  | { type: 'UNDO_MISTAKE' };

interface HistoryEntry {
  board: GameState['board'];
  notes: GameState['notes'];
}

type ReducerState = GameState & { history: HistoryEntry[]; solvedCount: number };

function cloneNotes(notes: GameState['notes']): GameState['notes'] {
  return notes.map(row => row.map(cell => new Set(cell)));
}

function reducer(state: ReducerState, action: Action): ReducerState {
  switch (action.type) {
    case 'RESET':
      return { ...action.state, history: [], solvedCount: 0 };

    case 'SELECT_CELL': {
      if (state.isComplete || state.isGameOver) return state;
      return { ...state, selectedCell: [action.row, action.col] };
    }

    case 'TOGGLE_PENCIL':
      return { ...state, pencilMode: !state.pencilMode };

    case 'TICK':
      return { ...state, elapsedSeconds: action.elapsed };

    case 'ERASE': {
      if (!state.selectedCell || state.isComplete || state.isGameOver) return state;
      const [r, c] = state.selectedCell;
      if (state.fixed[r][c]) return state;
      if (state.board[r][c] !== 0 && state.board[r][c] === state.solution[r][c]) return state;

      const newBoard = cloneBoard(state.board);
      const newNotes = cloneNotes(state.notes);
      newBoard[r][c] = 0;
      newNotes[r][c].clear();

      return { ...state, board: newBoard, notes: newNotes };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      let restoredSolvedCount = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!state.fixed[r][c] && prev.board[r][c] !== 0 && prev.board[r][c] === state.solution[r][c]) {
            restoredSolvedCount++;
          }
        }
      }
      return {
        ...state,
        board: prev.board,
        notes: prev.notes,
        history: state.history.slice(0, -1),
        solvedCount: restoredSolvedCount,
      };
    }

    case 'ENTER_NUMBER': {
      if (!state.selectedCell || state.isComplete || state.isGameOver) return state;
      const [r, c] = state.selectedCell;
      if (state.fixed[r][c]) return state;
      if (state.board[r][c] !== 0 && state.board[r][c] === state.solution[r][c]) return state;

      const num = action.num;

      const snapshot: HistoryEntry = {
        board: cloneBoard(state.board),
        notes: cloneNotes(state.notes),
      };

      if (state.pencilMode) {
        const newNotes = cloneNotes(state.notes);
        if (newNotes[r][c].has(num)) {
          newNotes[r][c].delete(num);
        } else {
          newNotes[r][c].add(num);
        }
        return { ...state, notes: newNotes, history: [...state.history, snapshot] };
      }

      const newBoard = cloneBoard(state.board);
      const newNotes = cloneNotes(state.notes);

      newBoard[r][c] = num;

      const isCorrect = num === state.solution[r][c];
      let newMistakes = state.mistakes;
      let mistakeCell: [number, number] | null = null;
      let mistakeValue: CellValue = 0;

      if (!isCorrect) {
        newMistakes = state.mistakes + 1;
        mistakeCell = [r, c];
        mistakeValue = num;
        newBoard[r][c] = 0;
      } else {
        for (let i = 0; i < 9; i++) {
          newNotes[r][i].delete(num);
          newNotes[i][c].delete(num);
        }
        const br = Math.floor(r / 3) * 3;
        const bc = Math.floor(c / 3) * 3;
        for (let rr = br; rr < br + 3; rr++) {
          for (let cc = bc; cc < bc + 3; cc++) {
            newNotes[rr][cc].delete(num);
          }
        }
      }

      const isGameOver = state.gameMode !== 'practice' && newMistakes >= state.maxMistakes;
      const isComplete = !isGameOver && isBoardComplete(newBoard, state.solution);

      const currentCompletions = detectCompletions(newBoard);
      const cellsToAnimate = getCellsToAnimate(currentCompletions, state.previousCompletions, newBoard);

      return {
        ...state,
        board: newBoard,
        notes: newNotes,
        mistakes: newMistakes,
        isGameOver,
        isComplete,
        history: [...state.history, snapshot],
        mistakeCell,
        mistakeValue,
        animatingCells: cellsToAnimate,
        previousCompletions: currentCompletions,
        solvedCount: isCorrect ? state.solvedCount + 1 : state.solvedCount,
      };
    }

    case 'CLEAR_MISTAKE':
      return { ...state, mistakeCell: null, mistakeValue: 0 };

    case 'CLEAR_ANIMATIONS':
      return { ...state, animatingCells: new Set() };

    case 'GRANT_EXTRA_CHANCE': {
      if (!state.isGameOver || state.extraChanceUsed || state.gameMode === 'practice') return state;
      return {
        ...state,
        isGameOver: false,
        maxMistakes: state.maxMistakes + 1,
        extraChanceUsed: true,
      };
    }

    case 'UNDO_MISTAKE': {
      // Free undo-error consumable: cancels one counted mistake. Only meaningful
      // in daily mode while still playing and at least one mistake was made.
      if (state.gameMode === 'practice' || state.isComplete || state.isGameOver || state.mistakes <= 0) {
        return state;
      }
      return { ...state, mistakes: state.mistakes - 1 };
    }

    case 'AUTO_SOLVE': {
      if (state.isComplete || state.isGameOver) return state;
      const solvedBoard = state.solution.map(row => [...row]) as GameState['board'];
      return {
        ...state,
        board: solvedBoard,
        isComplete: true,
        autoSolved: true,
        notes: state.notes.map(row => row.map(() => new Set<number>())),
      };
    }

    default:
      return state;
  }
}

export function useGameState(initialState: GameState, initialCellIntervals: number[] = []) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    history: [],
    solvedCount: 0,
  });

  // Track timestamps of correct cell fills for anti-bot honeypot.
  // Stored as a ref (not state) — transient metric, doesn't affect rendering.
  const lastCorrectFillTimeRef = useRef<number | null>(null);
  const cellIntervalsRef = useRef<number[]>(initialCellIntervals);

  const selectCell = useCallback((row: number, col: number) => {
    dispatch({ type: 'SELECT_CELL', row, col });
  }, []);

  const enterNumber = useCallback((num: CellValue) => {
    dispatch({ type: 'ENTER_NUMBER', num });
  }, []);

  // Record inter-cell interval whenever a correct fill happens.
  // solvedCount is maintained by the reducer — no board scan needed.
  const prevSolvedCountRef = useRef(0);
  useEffect(() => {
    if (state.solvedCount > prevSolvedCountRef.current) {
      const now = performance.now();
      if (lastCorrectFillTimeRef.current !== null) {
        const interval = Math.round(now - lastCorrectFillTimeRef.current);
        cellIntervalsRef.current.push(interval);
      }
      lastCorrectFillTimeRef.current = now;
    }
    prevSolvedCountRef.current = state.solvedCount;
  }, [state.solvedCount]);

  const erase = useCallback(() => {
    dispatch({ type: 'ERASE' });
  }, []);

  const togglePencil = useCallback(() => {
    dispatch({ type: 'TOGGLE_PENCIL' });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const tick = useCallback((elapsed: number) => {
    dispatch({ type: 'TICK', elapsed });
  }, []);

  const reset = useCallback((newState: GameState) => {
    lastCorrectFillTimeRef.current = null;
    cellIntervalsRef.current = [];
    prevSolvedCountRef.current = 0;
    dispatch({ type: 'RESET', state: newState });
  }, []);

  const autoSolve = useCallback(() => {
    dispatch({ type: 'AUTO_SOLVE' });
  }, []);

  const grantExtraChance = useCallback(() => {
    dispatch({ type: 'GRANT_EXTRA_CHANCE' });
  }, []);

  const undoMistake = useCallback(() => {
    dispatch({ type: 'UNDO_MISTAKE' });
  }, []);

  // Auto-clear mistake visual after animation
  useEffect(() => {
    if (state.mistakeCell) {
      const timer = setTimeout(() => dispatch({ type: 'CLEAR_MISTAKE' }), 600);
      return () => clearTimeout(timer);
    }
  }, [state.mistakeCell]);

  // Auto-clear completion animations
  useEffect(() => {
    if (state.animatingCells.size > 0) {
      const timer = setTimeout(() => dispatch({ type: 'CLEAR_ANIMATIONS' }), 650);
      return () => clearTimeout(timer);
    }
  }, [state.animatingCells]);

  return { state, selectCell, enterNumber, erase, togglePencil, undo, tick, reset, autoSolve, grantExtraChance, undoMistake, cellIntervalsRef };
}
