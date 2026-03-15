import { useCallback, useReducer, useEffect, useRef } from 'react';
import type { GameState, CellValue } from '../types';
import { isBoardComplete, cloneBoard } from '../lib/sudokuValidator';
import { saveGameState } from '../lib/localGameStorage';
import { recordCompletion } from '../lib/streakTracker';
import { recordPuzzleSolved } from '../lib/statsApi';
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
  | { type: 'CLEAR_ANIMATIONS' };

interface HistoryEntry {
  board: GameState['board'];
  notes: GameState['notes'];
}

type ReducerState = GameState & { history: HistoryEntry[] };

function cloneNotes(notes: GameState['notes']): GameState['notes'] {
  return notes.map(row => row.map(cell => new Set(cell)));
}

function reducer(state: ReducerState, action: Action): ReducerState {
  switch (action.type) {
    case 'RESET':
      return { ...action.state, history: [] };

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
      return {
        ...state,
        board: prev.board,
        notes: prev.notes,
        history: state.history.slice(0, -1),
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

      const isGameOver = state.gameMode !== 'practice' && newMistakes >= 3;
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
      };
    }

    case 'CLEAR_MISTAKE': {
      return { ...state, mistakeCell: null, mistakeValue: 0 };
    }

    case 'CLEAR_ANIMATIONS': {
      return { ...state, animatingCells: new Set() };
    }

    default:
      return state;
  }
}

export function useGameState(initialState: GameState) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    history: [],
  });
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  useEffect(() => {
    if (stateRef.current.gameMode !== 'practice') {
      saveGameState(stateRef.current);
    }
  }, [state.board, state.notes, state.mistakes, state.isComplete, state.isGameOver, state.gameMode]);

  useEffect(() => {
    if (stateRef.current.isComplete && stateRef.current.gameMode !== 'practice') {
      recordCompletion(stateRef.current.puzzleDate);
      recordPuzzleSolved(stateRef.current.puzzleNumber, stateRef.current.elapsedSeconds);
    }
  }, [state.isComplete, state.gameMode]);

  const selectCell = useCallback((row: number, col: number) => {
    dispatch({ type: 'SELECT_CELL', row, col });
  }, []);

  const enterNumber = useCallback((num: CellValue) => {
    dispatch({ type: 'ENTER_NUMBER', num });
  }, []);

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
    if (stateRef.current.gameMode !== 'practice') {
      saveGameState({ ...stateRef.current, elapsedSeconds: elapsed });
    }
  }, []);

  const reset = useCallback((newState: GameState) => {
    dispatch({ type: 'RESET', state: newState });
  }, []);

  const clearMistake = useCallback(() => {
    dispatch({ type: 'CLEAR_MISTAKE' });
  }, []);

  const clearAnimations = useCallback(() => {
    dispatch({ type: 'CLEAR_ANIMATIONS' });
  }, []);

  useEffect(() => {
    if (state.mistakeCell) {
      const timer = setTimeout(() => {
        clearMistake();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [state.mistakeCell, clearMistake]);

  useEffect(() => {
    if (state.animatingCells.size > 0) {
      const timer = setTimeout(() => {
        clearAnimations();
      }, 580);
      return () => clearTimeout(timer);
    }
  }, [state.animatingCells, clearAnimations]);

  return { state, selectCell, enterNumber, erase, togglePencil, undo, tick, reset };
}
