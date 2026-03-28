# Testing Guide — Comprehensive Reference

## 🎯 Quick Summary

| What | Command | When |
|------|---------|------|
| Run tests (watch) | `npm run test` | Development |
| Run tests once | `npm run test:run` | CI/CD, before commit |
| Coverage report | `npm run test:coverage` | Check coverage gaps |
| Type check | `npx tsc --noEmit` | Catch TS errors (no compilation) |
| All checks | `npm run test:run && npx tsc --noEmit` | Before push |

---

## 📊 Current Test Suite

### Coverage Overview
- **Total Tests:** 102
- **Test Files:** 10
- **Coverage (lib/):** 90%+
- **Coverage (hooks/):** 100% (useGameState reducer)
- **Coverage (components/):** Key UI components

### Test Files Structure
```
src/
├── features/
│   ├── game/
│   │   ├── lib/__tests__/
│   │   │   ├── sudokuGenerator.test.ts      (16 tests)
│   │   │   ├── sudokuValidator.test.ts      (12 tests)
│   │   │   ├── conflictDetector.test.ts     (8 tests)
│   │   │   └── highlighter.test.ts          (6 tests)
│   │   └── hooks/__tests__/
│   │       └── useGameState.test.ts         (28 tests)
│   ├── daily/
│   │   └── lib/__tests__/
│   │       └── dailyPuzzle.test.ts          (10 tests)
│   └── practice/
│       └── lib/__tests__/
│           └── practiceMode.test.ts         (8 tests)
├── shared/
│   ├── lib/__tests__/
│   │   ├── seededRandom.test.ts             (6 tests)
│   │   └── localStorage.test.ts             (6 tests)
│   └── components/__tests__/
│       └── NumberPad.test.tsx               (6 tests)
```

---

## 🏃 Running Tests

### 1. Development Mode (Watch)
```bash
npm run test
```

**What it does:**
- Watches all test files for changes
- Re-runs affected tests on save
- Interactive CLI (press `a` to run all, `q` to quit)
- Best for TDD workflow

**Output:**
```
✓ src/features/game/lib/__tests__/sudokuGenerator.test.ts (16)
✓ src/features/game/hooks/__tests__/useGameState.test.ts (28)
...
Test Files  10 passed (10)
Tests      102 passed (102)
```

### 2. CI Mode (Run Once)
```bash
npm run test:run
```

**What it does:**
- Runs all tests exactly once
- Exit code 0 = all pass, 1 = failure
- No watch mode or interactive features
- Best for CI/CD pipelines and pre-commit checks

**Usage in scripts:**
```bash
npm run test:run && npm run build  # Only build if tests pass
```

### 3. Coverage Report
```bash
npm run test:coverage
```

**What it does:**
- Runs all tests with coverage tracking
- Generates HTML report in `coverage/` directory
- Shows per-file coverage percentages
- Open `coverage/index.html` to see detailed report

**Output:**
```
------ Coverage summary ------
Statements   : 87.5% ( 140/160 )
Branches     : 84.2% ( 53/63 )
Functions    : 91.1% ( 41/45 )
Lines        : 88.0% ( 132/150 )
```

### 4. Type Checking
```bash
npx tsc --noEmit
```

**What it does:**
- Checks TypeScript types without compiling
- Catches type errors missed by IDE
- Verifies strict mode compliance
- Fast (no emit = no file generation)

**Common issues caught:**
- Missing type annotations
- `any` type usage
- Discriminated union failures
- Property access on potentially null values

---

## 📝 Test Types & Examples

### 1. Unit Tests (Pure Functions)

**Purpose:** Test isolated functions with no dependencies.

**Example: Seeded Random Generator**
```typescript
// src/shared/lib/__tests__/seededRandom.test.ts
describe('seededRandom', () => {
  test('same seed generates same sequence', () => {
    const r1 = createSeededRandom('2026-03-06');
    const r2 = createSeededRandom('2026-03-06');

    expect(r1.next()).toBe(r2.next());
    expect(r1.next()).toBe(r2.next());
  });

  test('different seeds generate different sequences', () => {
    const r1 = createSeededRandom('2026-03-06');
    const r2 = createSeededRandom('2026-03-07');

    expect(r1.next()).not.toBe(r2.next());
  });

  test('values are in range [0, 1)', () => {
    const r = createSeededRandom('test');
    for (let i = 0; i < 1000; i++) {
      const val = r.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});
```

**Testing approach:**
- ✅ No mocks (pure function)
- ✅ Multiple assertions per test
- ✅ Edge cases (boundaries, extremes)
- ✅ Determinism proof (same seed = same output)

---

### 2. Integration Tests (Functions + State)

**Purpose:** Test functions that interact with state or side effects.

**Example: Game State Reducer**
```typescript
// src/features/game/hooks/__tests__/useGameState.test.ts
describe('useGameState reducer', () => {
  test('ENTER_NUMBER updates board and clears notes', () => {
    const initial = createInitialGameState(testPuzzle);

    const next = gameReducer(initial, {
      type: 'ENTER_NUMBER',
      row: 0,
      col: 0,
      num: 5,
    });

    expect(next.board[0][0]).toBe(5);
    expect(next.notes[0][0]).toEqual(new Set());
  });

  test('UNDO reverts to previous state', () => {
    let state = createInitialGameState(testPuzzle);

    state = gameReducer(state, {
      type: 'ENTER_NUMBER',
      row: 0,
      col: 0,
      num: 5,
    });

    expect(state.board[0][0]).toBe(5);

    state = gameReducer(state, { type: 'UNDO' });
    expect(state.board[0][0]).toBe(0); // Reverted
  });

  test('wrong number increments mistakes and reverts cell', () => {
    const initial = createInitialGameState(testPuzzle);

    const next = gameReducer(initial, {
      type: 'ENTER_NUMBER',
      row: 0,
      col: 0,
      num: 99, // Invalid
    });

    expect(next.board[0][0]).toBe(0); // Reverted
    expect(next.mistakes).toBe(1); // Incremented
  });

  test('3 mistakes triggers game over', () => {
    let state = createInitialGameState(testPuzzle);

    for (let i = 0; i < 3; i++) {
      state = gameReducer(state, {
        type: 'ENTER_NUMBER',
        row: i,
        col: 0,
        num: 99,
      });
    }

    expect(state.isGameOver).toBe(true);
    expect(state.gameOverReason).toBe('TOO_MANY_MISTAKES');
  });
});
```

**Testing approach:**
- ✅ Test state transitions (action in → new state out)
- ✅ Verify side effects (mistakes incremented, history saved)
- ✅ Test complex sequences (undo, redo, game over)
- ✅ No mocks of reducer itself (test the real behavior)

---

### 3. Component Tests (React Components)

**Purpose:** Test UI components with user interactions.

**Example: Number Pad**
```typescript
// src/shared/components/__tests__/NumberPad.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberPad } from '../NumberPad';

describe('NumberPad', () => {
  test('renders 9 number buttons', () => {
    const onSelect = vi.fn();
    render(<NumberPad onSelect={onSelect} />);

    for (let i = 1; i <= 9; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  test('calls onSelect with correct number on button click', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<NumberPad onSelect={onSelect} />);
    await user.click(screen.getByText('5'));

    expect(onSelect).toHaveBeenCalledWith(5);
  });

  test('disables button when number is disabled', () => {
    const onSelect = vi.fn();
    render(
      <NumberPad
        onSelect={onSelect}
        disabledNumbers={[5]}
      />
    );

    expect(screen.getByText('5')).toBeDisabled();
    expect(screen.getByText('3')).not.toBeDisabled();
  });
});
```

**Testing approach:**
- ✅ Use React Testing Library (test user interactions, not implementation)
- ✅ Mock event handlers (spies to verify calls)
- ✅ Check DOM state (rendered, disabled, visible)
- ✅ Simulate user actions (click, type, focus)

---

### 4. Snapshot Tests (NOT RECOMMENDED)

**Why we don't use snapshots:**
- ❌ Brittle (break on any whitespace change)
- ❌ Hard to review (diffs are giant)
- ❌ Encourage "just update" mentality
- ❌ Hide real behavior changes

**Instead:** Test specific properties or assertions.

---

## 🔍 Testing Patterns & Best Practices

### Pattern 1: Arrange-Act-Assert (AAA)

```typescript
test('entering number updates board', () => {
  // Arrange
  const puzzle = testPuzzle;
  const state = createInitialGameState(puzzle);

  // Act
  const next = gameReducer(state, {
    type: 'ENTER_NUMBER',
    row: 0,
    col: 0,
    num: 5,
  });

  // Assert
  expect(next.board[0][0]).toBe(5);
});
```

**Why AAA?**
- Clear separation of setup, action, verification
- Easy to understand test intent
- Easier to debug when test fails

---

### Pattern 2: Test Behavior, Not Implementation

```typescript
// ❌ BAD: Tests implementation detail (how it works)
test('useGameState calls setBoard', () => {
  const setBoard = vi.fn();
  // ... test that setBoard was called
});

// ✅ GOOD: Tests behavior (what it does)
test('entering number updates the board state', () => {
  const { result } = renderHook(() => useGameState(puzzle));
  act(() => result.current.dispatch({ type: 'ENTER_NUMBER', ... }));
  expect(result.current.board[0][0]).toBe(5);
});
```

**Why behavior-focused?**
- Tests remain valid even if internals refactor
- Closer to how users interact with code
- Catches real bugs, not just code changes

---

### Pattern 3: Use Descriptive Test Names

```typescript
// ❌ BAD: Unclear what's being tested
test('reducer works', () => {
  // ...
});

// ✅ GOOD: Describes expected behavior
test('ENTER_NUMBER action updates board and clears notes for selected cell', () => {
  // ...
});
```

**Naming formula:**
`[action/scenario] should [expected result]`

Examples:
- `"same seed generates same puzzle"`
- `"entering invalid number increments mistakes and reverts cell"`
- `"3 mistakes triggers game over"`

---

### Pattern 4: Test Edge Cases

```typescript
test('sudoku generator handles all difficulty levels', () => {
  // Easy (20 clues)
  expect(sudokuGenerator({ difficulty: 'easy', seed: 'test' }).clues).toBeLessThanOrEqual(25);

  // Medium (30 clues)
  expect(sudokuGenerator({ difficulty: 'medium', seed: 'test' }).clues).toBeLessThanOrEqual(35);

  // Hard (40 clues)
  expect(sudokuGenerator({ difficulty: 'hard', seed: 'test' }).clues).toBeGreaterThanOrEqual(35);
});

test('sudoku generator rejects invalid seeds', () => {
  expect(() => sudokuGenerator({ seed: '' })).toThrow('Invalid seed');
  expect(() => sudokuGenerator({ seed: null })).toThrow('Invalid seed');
});
```

**Common edge cases:**
- Empty/null inputs
- Boundary values (0, max, min)
- Invalid states
- Concurrent operations
- Error scenarios

---

### Pattern 5: Mock External Dependencies Only

```typescript
// ❌ BAD: Mocks everything (defeats purpose of test)
const mockRandom = vi.fn(() => 0.5);
const mockValidator = vi.fn(() => true);
const result = generatePuzzle(mockRandom, mockValidator);

// ✅ GOOD: Test real logic, mock only external services
const { data, error } = await submitStats({
  fetchFn: vi.fn().mockResolvedValue({ ok: true }),
});
expect(data).toBeDefined();
```

**Mocking guidelines:**
- ✅ Mock external APIs (Supabase, fetch)
- ✅ Mock time (vi.useFakeTimers)
- ✅ Mock browser APIs (localStorage, window)
- ❌ Don't mock your own functions being tested
- ❌ Don't mock internal implementations

---

## 📋 Pre-Commit Checklist

Before pushing code:

```bash
# 1. Run all tests
npm run test:run

# 2. Check types
npx tsc --noEmit

# 3. Build to catch errors
npm run build

# 4. Check bundle size didn't grow significantly
npm run build  # Look at dist/ size

# ✅ All pass? Ready to push
```

**One-liner:**
```bash
npm run test:run && npx tsc --noEmit && npm run build && echo "✅ All checks passed"
```

---

## 🔧 Debugging Failed Tests

### Issue: Test hangs or times out

**Symptoms:**
```
FAIL src/features/game/lib/__tests__/sudokuGenerator.test.ts
Timeout - Async callback was not invoked within 5000ms
```

**Solutions:**
1. Check for infinite loops in tested code
2. Verify async operations complete (await/resolve)
3. Increase timeout: `test('...', async () => {...}, 10000)`

### Issue: Snapshot mismatch

**Symptoms:**
```
Expected: {...previous snapshot...}
Received: {...new snapshot...}
```

**Solutions:**
- Review the diff — is it an intentional change?
- If yes: `npm run test -- -u` (update snapshot)
- If no: fix the code, don't update snapshot

### Issue: Random test failures

**Symptoms:**
```
Test passes sometimes, fails other times
```

**Likely cause:** Non-deterministic behavior

**Solutions:**
1. Check for uncontrolled randomness (use seeded RNG in tests)
2. Verify async operations complete
3. Check for race conditions
4. Use `vi.useFakeTimers()` for time-dependent code

### Issue: Component test fails with "not wrapped in act(...)"

**Symptoms:**
```
Warning: An update to [component] inside a test was not wrapped in act(...)
```

**Solution:** Wrap state updates in `act()`:
```typescript
act(() => {
  result.current.dispatch({ type: 'ENTER_NUMBER', ... });
});
```

---

## 📈 Coverage Goals

**Current status:**
- ✅ lib/ (pure functions): 90%+
- ✅ hooks/ (state management): 100%
- ✅ components/ (UI): 60% (spot-check critical paths)

**Target:** 85%+ overall, 95%+ on core logic

**To improve coverage:**
```bash
npm run test:coverage
open coverage/index.html  # Find uncovered lines
```

---

## 🚀 CI/CD Integration

### GitHub Actions Pipeline

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: npm run test:run

- name: Type Check
  run: npx tsc --noEmit

- name: Build
  run: npm run build

# Deployment only happens if all checks pass ✅
```

**Benefits:**
- ✅ Tests must pass before deploying
- ✅ Type errors caught before production
- ✅ No bad builds shipped
- ✅ Zero tolerance for breaking changes

---

## 📚 Test File Template

When creating a new test file:

```typescript
// src/features/myfeature/lib/__tests__/myFunction.test.ts

import { describe, test, expect } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  // Group related tests
  describe('happy path', () => {
    test('returns expected result for valid input', () => {
      const result = myFunction('input');
      expect(result).toBe('expected');
    });
  });

  describe('edge cases', () => {
    test('handles empty input', () => {
      const result = myFunction('');
      expect(result).toBeDefined();
    });

    test('handles null input', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });

  describe('error handling', () => {
    test('throws for invalid input', () => {
      expect(() => myFunction(NaN)).toThrow('Invalid input');
    });
  });
});
```

---

## 🎓 Learning Resources

**For writing better tests:**
- [Vitest Docs](https://vitest.dev) — Test framework
- [React Testing Library](https://testing-library.com/react) — Component testing
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) — Kent C. Dodds

**For understanding patterns:**
- Read existing tests in `src/**/__tests__/`
- Copy structure from similar tests
- Ask in code comments if unsure

---

## 💡 Pro Tips

### Tip 1: Run single test file
```bash
npm run test -- sudokuGenerator.test.ts
```

### Tip 2: Run tests matching pattern
```bash
npm run test -- --grep "UNDO"  # Only UNDO-related tests
```

### Tip 3: Debug a test
```bash
# In test file:
test('...', () => {
  console.log('Debug info:', state);  // logs to console
  debugger;  // pause execution
});

# Then run:
node --inspect-brk ./node_modules/vitest/vitest.mjs run test-file.ts
```

### Tip 4: Watch specific folder
```bash
npm run test -- src/features/game
```

### Tip 5: Clear cache
```bash
npm run test -- --clearCache
```

---

**Last Updated:** 2026-03-15
**Status:** 102 tests, 90%+ core coverage, CI/CD integrated
**Maintainers:** Pedro (QA + testing strategy)

