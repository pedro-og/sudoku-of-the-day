# Senior React Best Practices — Daily Sudoku

This document captures production-grade React patterns used in this codebase. Treat these as non-negotiable standards for future development.

---

## 1. Component Architecture

### Principle: Colocate Related Code
Each component owns its props, internal state, and styles. Avoid global style sheets for component-specific styling.

```typescript
// ✅ Good: Everything for this component in one file
export const SudokuCell = React.memo(function SudokuCell({ ... }) {
  return (
    <div style={{
      background: isSelected ? 'var(--cell-bg-selected)' : 'var(--cell-bg)',
      borderRight: (col + 1) % 3 === 0 ? '2px solid ...' : '1px solid ...',
    }}>
      {value}
    </div>
  );
});

// ❌ Avoid: Styles in separate CSS file (breaks colocations)
// ❌ Avoid: Inline CSS classes from external stylesheets
```

### Principle: One Component, One Responsibility
A component should do one thing well. If it's doing multiple things, split it.

```typescript
// ✅ Good: SudokuGrid handles layout; SudokuCell handles rendering
// ✅ Good: GameOverlay focuses only on displaying end-game state
// ✅ Good: NumberPad handles number selection logic only

// ❌ Avoid: One mega-component handling grid + cells + toolbar + modal
```

### Principle: Props Over Context for Local State
Use context only for **global, infrequently-changing data** (theme, language, user prefs).

```typescript
// ✅ Good: Pass onSelectCell via props (tight coupling is OK for child-parent)
<SudokuGrid state={state} onSelectCell={selectCell} />

// ❌ Avoid: Putting game state in context just to avoid prop drilling
// (leads to unnecessary re-renders of all context consumers)
```

---

## 2. State Management

### Principle: Reducer Over Hooks for Complex State
If state has multiple interdependent pieces, use a reducer.

```typescript
// ✅ Good: Reducer for game state (board, notes, mistakes, history all tied together)
const [state, dispatch] = useReducer(gameReducer, initialState);

// ❌ Avoid: Multiple useState calls that must stay in sync
// const [board, setBoard] = useState(...);
// const [notes, setNotes] = useState(...);
// const [mistakes, setMistakes] = useState(...);
// (Easy to desynchronize; hard to undo)
```

### Principle: Derived State is Computed, Not Stored
Never store state that can be computed from other state.

```typescript
// ✅ Good: isComplete is computed on every render
const isComplete = isBoardComplete(state.board, state.solution);

// ❌ Avoid: Storing isComplete as a state field, then keeping it in sync
// (What if you forget to update it during a mutation? Bug.)
```

### Principle: Immutability by Default
Never mutate state objects. Always create new objects.

```typescript
// ✅ Good: Cloning board before mutation
const newBoard = cloneBoard(state.board);
newBoard[r][c] = num;
return { ...state, board: newBoard };

// ❌ Avoid: Mutating directly
// state.board[r][c] = num;
// return state;
// (React won't detect the change; component won't re-render)
```

### Principle: Batch Writes to localStorage
Don't write every state change immediately.

```typescript
// ✅ Good: Write on mutations, debounce timer ticks
useEffect(() => {
  saveGameState(state);  // write immediately
}, [state.board, state.notes, state.mistakes]);

const tick = useCallback((elapsed: number) => {
  dispatch({ type: 'TICK', elapsed });
  if (elapsed % 5 === 0) saveGameState({ ...state, elapsedSeconds: elapsed });
}, []);

// ❌ Avoid: Writing every second (excessive disk I/O)
```

---

## 3. Memoization

### Principle: Memoize Expensive Computations, Not Everything
Memoization has overhead. Only use it where it matters.

```typescript
// ✅ Good: Memoize puzzle generation (expensive, one-time)
const initialState = useMemo(() => {
  const { puzzle, solution } = getDailyPuzzle();  // ~3s
  return buildInitialState(puzzle, solution, ...);
}, []);

// ❌ Avoid: Memoizing trivial computations
// const foo = useMemo(() => x + y, [x, y]);  // too simple
```

### Principle: React.memo for Leaf Components
Memoize components that receive non-primitive props.

```typescript
// ✅ Good: Memoize SudokuCell (receives many props, rendered 81 times)
export const SudokuCell = React.memo(function SudokuCell(props) { ... });

// ✅ Good: Memoize NumberPad (receives function prop onNumber)
export const NumberPad = React.memo(function NumberPad(props) { ... });

// ❌ Avoid: Memoizing DailySudoku (top-level, no props, always re-renders)
```

### Principle: useCallback for Callbacks Passed to Children
If a callback is memoized, wrap the callback in useCallback.

```typescript
// ✅ Good: useCallback because selectCell is passed to memoized SudokuGrid
const selectCell = useCallback((row: number, col: number) => {
  dispatch({ type: 'SELECT_CELL', row, col });
}, [dispatch]);

// ❌ Avoid: Inline function (breaks memoization)
// <SudokuGrid onSelectCell={(r, c) => dispatch(...)} />
```

---

## 4. Effects & Cleanup

### Principle: One Effect Per Concern
Effects should have a single, well-defined purpose.

```typescript
// ✅ Good: Three separate effects, each for one job
useEffect(() => {
  // Timer logic
  const interval = setInterval(...);
  return () => clearInterval(interval);
}, [isRunning]);

useEffect(() => {
  // Keyboard input
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [state.selectedCell, enterNumber]);

useEffect(() => {
  // Persist to localStorage
  saveGameState(state);
}, [state.board, state.notes, state.mistakes]);

// ❌ Avoid: One mega-effect doing timer + keyboard + persistence
```

### Principle: Clean Up Side Effects
Always return a cleanup function from effects with external subscriptions.

```typescript
// ✅ Good: Remove listener on unmount
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);

// ❌ Avoid: Missing cleanup (memory leak)
// useEffect(() => {
//   window.addEventListener('keydown', handleKeyDown);
// }, []);
```

### Principle: Minimal Dependency Array
List only the dependencies that are actually used in the effect.

```typescript
// ✅ Good: Only list dependencies actually used
useEffect(() => {
  saveGameState(state);
}, [state.board, state.notes, state.mistakes]);
// (Not including state.selectedCell, state.pencilMode, etc.)

// ❌ Avoid: Over-specifying dependencies
// useEffect(() => {
//   saveGameState(state);
// }, [state]);  // Re-runs even if only selectedCell changed
```

---

## 5. Error Handling

### Principle: Graceful Degradation
App should work with reduced functionality if features fail.

```typescript
// ✅ Good: Supabase stats fail silently
async function recordPuzzleSolved(puzzleNumber: number, elapsed: number) {
  if (!isConfigured()) return;  // silently skip
  try {
    await fetch(...);
  } catch {
    // fail silently — stats are best-effort
  }
}

// ✅ Good: localStorage unavailable (private mode)
try {
  localStorage.setItem(key, JSON.stringify(data));
} catch {
  // fail silently — game still playable in RAM
}

// ❌ Avoid: Throwing errors that break the app
// if (!localStorage.available()) throw new Error('localStorage required');
```

### Principle: Validate at Boundaries
Only validate user input and external data; trust internal code.

```typescript
// ✅ Good: Validate board from localStorage (external source)
const saved = JSON.parse(raw) as PersistedGame;
if (!isValidBoard(saved.board)) return null;  // treat as corrupted

// ✅ Good: Type-guard cell values
const val: CellValue = num as CellValue;  // trust our type system

// ❌ Avoid: Over-validating internal calls
// function selectCell(row: number, col: number) {
//   if (row < 0 || row > 8) throw new Error('invalid row');  // unnecessary
// }
```

---

## 6. Performance

### Principle: Profile Before Optimizing
Don't guess where bottlenecks are.

```typescript
// ✅ Good: Use React DevTools Profiler
// - Render time per component
// - Time spent in each effect
// - Identify unnecessary re-renders

// ❌ Avoid: Premature optimization
// (Memoize everything "just in case")
```

### Principle: Lazy Load If > 100 kB
Code-split components if a feature is large.

```typescript
// ✅ Good: Lazy load help modal (unlikely to be used)
const HelpModal = React.lazy(() => import('./HelpModal'));

// ❌ Avoid: Bundling 200 kB of rarely-used code upfront
```

### Principle: Event Delegation for Many Similar Elements
If you have 100+ similar elements, consider event delegation.

```typescript
// ✅ Good: One listener on grid, delegate to cells
<div onMouseDown={(e) => {
  const cell = (e.target as HTMLElement).closest('[data-cell]');
  const [r, c] = cell?.dataset.cell.split(',').map(Number) ?? [-1, -1];
  selectCell(r, c);
}} />

// ✅ Current approach: 81 individual listeners (acceptable for 81 cells)
// ❌ Avoid: Individual listeners only if 1000+ elements
```

---

## 7. Testing

### Principle: Test Behavior, Not Implementation
Write tests that verify the component does what users expect.

```typescript
// ✅ Good: Test behavior
test('entering wrong number reverts cell and increments mistakes', () => {
  const { state, dispatch } = renderHook(() => useGameState(initial));
  dispatch({ type: 'SELECT_CELL', row: 0, col: 0 });
  dispatch({ type: 'ENTER_NUMBER', num: 9 });
  expect(state.board[0][0]).toBe(0);  // cell reverted
  expect(state.mistakes).toBe(1);
});

// ❌ Avoid: Testing implementation details
// expect(dispatch).toHaveBeenCalledWith({
//   type: 'ENTER_NUMBER',
//   num: 9,
// });  // brittle; breaks if you refactor reducer
```

### Principle: Test Edge Cases
Happy path is obvious; edge cases reveal bugs.

```typescript
// ✅ Good: Test edge cases
test('undo from game over reverts completion flag', () => {
  // Play to completion → verify isComplete = true
  // Undo → verify isComplete = false
});

test('three mistakes in a row → game over', () => {
  // Enter 3 wrong numbers → verify isGameOver = true
});

// ❌ Avoid: Only testing happy path
// test('completing puzzle shows modal', () => { ... });
```

### Principle: Use Meaningful Test Descriptions
Test names should read like documentation.

```typescript
// ✅ Good: Describes the scenario and expected outcome
test('when user enters an incorrect number, the cell reverts and mistake count increments');

// ❌ Avoid: Vague names
// test('test number entry');
```

---

## 8. Code Style

### Principle: Explicit Over Implicit
Code should be immediately understandable without context.

```typescript
// ✅ Good: Explicit variable names
const isSelected = r === selectedRow && c === selectedCol;
const isHighlighted = isInSelectedRow || isInSelectedCol || isInSelectedBox;

// ❌ Avoid: Abbreviated names
// const sel = r === sr && c === sc;
// const hl = ir || ic || ib;
```

### Principle: Comments for "Why", Not "What"
Code explains what it does; comments explain why.

```typescript
// ✅ Good: Comment explains the rationale
// Only accept clue removal if uniqueness is preserved.
// Without this, some puzzles would be ambiguous.
if (countSolutions(testBoard) === 1) {
  removed++;
}

// ❌ Avoid: Comment repeats code
// if (countSolutions(testBoard) === 1) {
//   removed++;  // increment removed if unique
// }
```

### Principle: Consistent Formatting
Use Prettier or similar for consistent formatting.

```
npm run format  // should auto-format all code
```

---

## 9. TypeScript

### Principle: Strict Mode Only
Never disable TypeScript checks.

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Principle: Use Discriminated Unions for Variants
Avoid large optional-property interfaces.

```typescript
// ✅ Good: Discriminated union (exhaustive checking)
type Result =
  | { status: 'loading' }
  | { status: 'success'; data: Data }
  | { status: 'error'; message: string };

// In a switch:
switch (result.status) {
  case 'loading': /* ... */; break;
  case 'success': const d = result.data; break;  // data is guaranteed
  case 'error': const m = result.message; break;
}

// ❌ Avoid: Optional properties everywhere
// interface Result {
//   status: 'loading' | 'success' | 'error';
//   data?: Data;
//   message?: string;
// }
```

### Principle: Avoid `any`
Always type your variables.

```typescript
// ✅ Good: Typed
function selectCell(row: number, col: number): void { ... }

// ❌ Avoid
// function selectCell(row: any, col: any): any { ... }
```

---

## 10. Naming Conventions

### Component Names
PascalCase, descriptive, one noun.
```typescript
✅ SudokuGrid, NumberPad, GameOverlay, ShareResultButton
❌ GridComponent, NumPad, Modal, Share
```

### Function Names
camelCase, verb-first for actions, adjective-first for predicates.
```typescript
✅ selectCell, enterNumber, isBoardComplete, getConflicts
❌ cellSelect, number, complete, conflictDetector
```

### Boolean Names
Prefix with `is`, `has`, `can`, `should`.
```typescript
✅ isSelected, isHighlighted, hasNotes, canEnter
❌ selected, highlighted, notes, enter
```

### Constants
UPPER_SNAKE_CASE.
```typescript
✅ const MAX_MISTAKES = 3;
✅ const LAUNCH_DATE = '2026-01-01';
❌ const maxMistakes = 3;
```

---

## 11. File Structure

### Rule: Mirror File Names to Export Names
A file should export one default or a few named exports with clear names.

```typescript
// ✅ Good: File name matches export
// SudokuCell.tsx
export const SudokuCell = React.memo(...);

// ✅ Good: Multiple related exports in one file
// GameOverlay.tsx
export function GameOverlay(...) { ... }
export function ShareResultButton(...) { ... }

// ❌ Avoid: Export unrelated items
// Helpers.tsx (vague; what kind of helpers?)
```

### Rule: Co-locate Related Files
Put tests next to the code being tested.

```
src/lib/
├── sudokuGenerator.ts
├── sudokuGenerator.test.ts  (✅ next to implementation)

❌ Avoid:
tests/
├── sudokuGenerator.test.ts  (too far away)
```

---

## 12. Common Pitfalls

### Pitfall: Infinite Render Loops
Creating new objects in render causes infinite re-renders when used as dependencies.

```typescript
// ❌ Bad: Object created on every render
useEffect(() => {
  // ...
}, [{ x: 1, y: 2 }]);  // new object every render → effect runs every time

// ✅ Good: Object created once
const position = useMemo(() => ({ x: 1, y: 2 }), []);
useEffect(() => {
  // ...
}, [position]);
```

### Pitfall: Stale Closures in Event Handlers
Event handlers capture variables at the time the effect ran.

```typescript
// ❌ Bad: selectCell closure is stale
useEffect(() => {
  const handleClick = () => selectCell(row, col);  // old row, col
  element.addEventListener('click', handleClick);
  return () => element.removeEventListener('click', handleClick);
}, []);  // missing row, col in dependencies

// ✅ Good: Re-attach listener when dependencies change
useEffect(() => {
  const handleClick = () => selectCell(row, col);
  element.addEventListener('click', handleClick);
  return () => element.removeEventListener('click', handleClick);
}, [row, col, selectCell]);
```

### Pitfall: Missing Cleanup
Resources leak if you don't clean up.

```typescript
// ❌ Bad: Listener never removed
useEffect(() => {
  window.addEventListener('keydown', handler);
}, [handler]);

// ✅ Good: Listener cleaned up
useEffect(() => {
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [handler]);
```

---

## Summary Checklist

- [ ] One responsibility per component
- [ ] Props over context for local state
- [ ] Reducer for complex, interdependent state
- [ ] Derived state is computed, never stored
- [ ] All state mutations are immutable
- [ ] Memoization only where it matters (profiled)
- [ ] Effects have minimal, explicit dependencies
- [ ] Effects are cleaned up
- [ ] Error handling is graceful
- [ ] TypeScript strict mode enabled
- [ ] No `any` types
- [ ] Discriminated unions for variants
- [ ] Tests verify behavior, not implementation
- [ ] Naming is explicit and descriptive
- [ ] Comments explain "why", not "what"
- [ ] Code is formatted consistently
