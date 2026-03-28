import type { GameState, Board, CellValue } from '@/types';
import { detectCompletions } from '../../lib/completionDetector';

// We need to test the reducer directly. Since it's not exported,
// we import the hook and test through the hook's returned actions.
// But for unit testing the reducer, we'll re-create the reducer logic
// by testing it indirectly through the hook's dispatch actions.

// For now, we test via renderHook since the reducer is internal.
import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../useGameState';

function createSolution(): Board {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0)) as Board;
  // Valid Sudoku solution (each row is a shifted version)
  const base = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const shifts = [0, 3, 6, 1, 4, 7, 2, 5, 8];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      board[r][c] = base[(c + shifts[r]) % 9] as CellValue;
    }
  }
  return board;
}

function createTestState(overrides: Partial<GameState> = {}): GameState {
  const solution = createSolution();
  const board = solution.map(row => [...row]) as Board;
  // Make first 5 cells per row empty (unfixed)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 5; c++) {
      board[r][c] = 0;
    }
  }
  const fixed = board.map(row => row.map(cell => cell !== 0));
  const notes = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>())
  );

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
    puzzleDate: '2026-03-15',
    puzzleNumber: 74,
    mistakeCell: null,
    mistakeValue: 0,
    animatingCells: new Set(),
    previousCompletions: detectCompletions(board),
    gameMode: 'daily',
    ...overrides,
  };
}

describe('useGameState', () => {
  describe('SELECT_CELL', () => {
    it('selects a cell', () => {
      const { result } = renderHook(() => useGameState(createTestState()));
      act(() => result.current.selectCell(3, 4));
      expect(result.current.state.selectedCell).toEqual([3, 4]);
    });

    it('does not select when game is complete', () => {
      const { result } = renderHook(() =>
        useGameState(createTestState({ isComplete: true }))
      );
      act(() => result.current.selectCell(3, 4));
      expect(result.current.state.selectedCell).toBeNull();
    });

    it('does not select when game is over', () => {
      const { result } = renderHook(() =>
        useGameState(createTestState({ isGameOver: true }))
      );
      act(() => result.current.selectCell(3, 4));
      expect(result.current.state.selectedCell).toBeNull();
    });
  });

  describe('ENTER_NUMBER', () => {
    it('places correct number on the board', () => {
      const state = createTestState();
      const correctNum = state.solution[0][0];
      const { result } = renderHook(() => useGameState(state));

      act(() => result.current.selectCell(0, 0));
      act(() => result.current.enterNumber(correctNum));

      expect(result.current.state.board[0][0]).toBe(correctNum);
      expect(result.current.state.mistakes).toBe(0);
    });

    it('increments mistakes for wrong number', () => {
      const state = createTestState();
      const correctNum = state.solution[0][0];
      const wrongNum = (correctNum === 9 ? 1 : correctNum + 1) as CellValue;
      const { result } = renderHook(() => useGameState(state));

      act(() => result.current.selectCell(0, 0));
      act(() => result.current.enterNumber(wrongNum));

      expect(result.current.state.board[0][0]).toBe(0); // wrong number is not placed
      expect(result.current.state.mistakes).toBe(1);
    });

    it('does not overwrite a correctly placed number', () => {
      const state = createTestState();
      const correctNum = state.solution[0][0];
      const { result } = renderHook(() => useGameState(state));

      act(() => result.current.selectCell(0, 0));
      act(() => result.current.enterNumber(correctNum));
      act(() => result.current.enterNumber(5 as CellValue));

      expect(result.current.state.board[0][0]).toBe(correctNum);
    });

    it('does not modify fixed cells', () => {
      const state = createTestState();
      // Cell at (0, 5) is fixed
      const originalVal = state.board[0][5];
      const { result } = renderHook(() => useGameState(state));

      act(() => result.current.selectCell(0, 5));
      act(() => result.current.enterNumber(1 as CellValue));

      expect(result.current.state.board[0][5]).toBe(originalVal);
    });

    it('triggers game over at 3 mistakes in daily mode', () => {
      const state = createTestState();
      const correctNum = state.solution[0][0];
      const wrongNum = (correctNum === 9 ? 1 : correctNum + 1) as CellValue;
      const { result } = renderHook(() => useGameState(state));

      // Make 3 wrong guesses
      act(() => result.current.selectCell(0, 0));
      act(() => result.current.enterNumber(wrongNum));
      act(() => result.current.enterNumber(wrongNum));
      act(() => result.current.enterNumber(wrongNum));

      expect(result.current.state.mistakes).toBe(3);
      expect(result.current.state.isGameOver).toBe(true);
    });

    it('does not trigger game over in practice mode', () => {
      const state = createTestState({ gameMode: 'practice' });
      const correctNum = state.solution[0][0];
      const wrongNum = (correctNum === 9 ? 1 : correctNum + 1) as CellValue;
      const { result } = renderHook(() => useGameState(state));

      act(() => result.current.selectCell(0, 0));
      act(() => result.current.enterNumber(wrongNum));
      act(() => result.current.enterNumber(wrongNum));
      act(() => result.current.enterNumber(wrongNum));

      expect(result.current.state.mistakes).toBe(3);
      expect(result.current.state.isGameOver).toBe(false);
    });

    it('does nothing without a selected cell', () => {
      const state = createTestState();
      const { result } = renderHook(() => useGameState(state));

      act(() => result.current.enterNumber(5 as CellValue));
      expect(result.current.state.board).toEqual(state.board);
    });
  });

  describe('pencil mode', () => {
    it('toggles pencil notes instead of placing numbers', () => {
      const state = createTestState();
      const { result } = renderHook(() => useGameState(state));

      act(() => result.current.togglePencil());
      expect(result.current.state.pencilMode).toBe(true);

      act(() => result.current.selectCell(0, 0));
      act(() => result.current.enterNumber(3 as CellValue));

      expect(result.current.state.board[0][0]).toBe(0);
      expect(result.current.state.notes[0][0].has(3)).toBe(true);
    });

    it('toggles notes off when entered twice', () => {
      const state = createTestState();
      const { result } = renderHook(() => useGameState(state));

      act(() => result.current.togglePencil());
      act(() => result.current.selectCell(0, 0));
      act(() => result.current.enterNumber(3 as CellValue));
      act(() => result.current.enterNumber(3 as CellValue));

      expect(result.current.state.notes[0][0].has(3)).toBe(false);
    });

    it('auto-removes notes when correct number is placed in same row/col/box', () => {
      const state = createTestState();
      const { result } = renderHook(() => useGameState(state));

      // Add note "1" to cell (0, 1)
      act(() => result.current.togglePencil());
      act(() => result.current.selectCell(0, 1));
      const targetNum = state.solution[0][0]; // we'll place this in (0, 0)
      act(() => result.current.enterNumber(targetNum));

      // Switch to normal mode and place the correct number in (0, 0)
      act(() => result.current.togglePencil());
      act(() => result.current.selectCell(0, 0));
      act(() => result.current.enterNumber(targetNum));

      // Notes with that number should be removed from same row
      expect(result.current.state.notes[0][1].has(targetNum)).toBe(false);
    });
  });

  describe('ERASE', () => {
    it('does nothing on fixed cells', () => {
      const state = createTestState();
      const { result } = renderHook(() => useGameState(state));

      act(() => result.current.selectCell(0, 5)); // fixed cell
      act(() => result.current.erase());

      expect(result.current.state.board[0][5]).not.toBe(0);
    });

    it('does nothing on correctly placed cells', () => {
      const state = createTestState();
      const correctNum = state.solution[0][0];
      const { result } = renderHook(() => useGameState(state));

      act(() => result.current.selectCell(0, 0));
      act(() => result.current.enterNumber(correctNum));
      act(() => result.current.erase());

      expect(result.current.state.board[0][0]).toBe(correctNum);
    });

    it('does nothing without a selected cell', () => {
      const state = createTestState();
      const { result } = renderHook(() => useGameState(state));
      const boardBefore = result.current.state.board.map(r => [...r]);

      act(() => result.current.erase());
      expect(result.current.state.board).toEqual(boardBefore);
    });
  });

  describe('UNDO', () => {
    it('reverts to previous board state', () => {
      const state = createTestState();
      const correctNum = state.solution[0][0];
      const { result } = renderHook(() => useGameState(state));

      const boardBefore = result.current.state.board.map(r => [...r]);
      act(() => result.current.selectCell(0, 0));
      act(() => result.current.enterNumber(correctNum));
      expect(result.current.state.board[0][0]).toBe(correctNum);

      act(() => result.current.undo());
      expect(result.current.state.board).toEqual(boardBefore);
    });

    it('does nothing when history is empty', () => {
      const state = createTestState();
      const { result } = renderHook(() => useGameState(state));
      const boardBefore = result.current.state.board.map(r => [...r]);

      act(() => result.current.undo());
      expect(result.current.state.board).toEqual(boardBefore);
    });
  });

  describe('TICK', () => {
    it('updates elapsed seconds', () => {
      const { result } = renderHook(() => useGameState(createTestState()));

      act(() => result.current.tick(42));
      expect(result.current.state.elapsedSeconds).toBe(42);
    });
  });

  describe('RESET', () => {
    it('resets to a new state', () => {
      const { result } = renderHook(() => useGameState(createTestState()));

      act(() => result.current.selectCell(0, 0));
      expect(result.current.state.selectedCell).toEqual([0, 0]);

      const freshState = createTestState({ puzzleDate: '2026-03-16', puzzleNumber: 75 });
      act(() => result.current.reset(freshState));

      expect(result.current.state.selectedCell).toBeNull();
      expect(result.current.state.puzzleDate).toBe('2026-03-16');
      expect(result.current.state.puzzleNumber).toBe(75);
    });
  });

  describe('board completion', () => {
    it('detects completion when all cells match solution', () => {
      const solution = createSolution();
      // Board almost complete — only (0,0) is empty
      const board = solution.map(row => [...row]) as Board;
      board[0][0] = 0;
      const fixed = board.map(row => row.map(cell => cell !== 0));
      const notes = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => new Set<number>())
      );

      const state: GameState = {
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
        elapsedSeconds: 100,
        startTime: null,
        puzzleDate: '2026-03-15',
        puzzleNumber: 74,
        mistakeCell: null,
        mistakeValue: 0,
        animatingCells: new Set(),
        previousCompletions: detectCompletions(board),
        gameMode: 'daily',
      };

      const { result } = renderHook(() => useGameState(state));

      act(() => result.current.selectCell(0, 0));
      act(() => result.current.enterNumber(solution[0][0]));

      expect(result.current.state.isComplete).toBe(true);
    });
  });
});
