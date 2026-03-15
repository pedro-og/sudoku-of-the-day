# Architecture — Feature-Based Folder Structure

**Last Updated:** 2026-03-15
**Status:** Post-refactoring (Phase 5 complete)

This document describes the new feature-based folder structure, module organization, and architectural patterns.

---

## 📁 Folder Structure

```
src/
├── features/              # Feature-based modules
│   ├── game/             # Core Sudoku game logic
│   │   ├── components/   # SudokuGrid, SudokuCell, NumberPad, GameToolbar, GameHeader, GameTimer
│   │   ├── hooks/        # useGameState, useGameTimer, useKeyboardControls, useFastFill
│   │   ├── lib/          # sudokuGenerator, sudokuValidator, completionDetector, boardUtils, puzzleFactory
│   │   ├── __tests__/    # Feature-specific tests
│   │   └── index.ts      # Barrel export
│   │
│   ├── daily/            # Daily puzzle feature
│   │   ├── components/   # GameOverlay, DailyStatsPanel, MistakeCounter, ShareResultButton, StreakDisplay
│   │   ├── hooks/        # useGamePersistence
│   │   ├── lib/          # dailyPuzzle, streakTracker, statsApi, shareFormatter
│   │   ├── __tests__/    # Feature-specific tests
│   │   └── index.ts      # Barrel export
│   │
│   ├── practice/         # Unlimited practice mode
│   │   ├── components/   # PracticeOverlay
│   │   └── index.ts      # Barrel export
│   │
│   └── theme/            # Dark/light theme toggle
│       ├── components/   # ThemeToggle
│       ├── hooks/        # useTheme
│       └── index.ts      # Barrel export
│
├── shared/               # Shared primitives & utilities
│   ├── components/       # Modal, Button, IconButton, StatCard, Icons
│   ├── hooks/            # useCountdown
│   ├── lib/              # formatTime, localGameStorage, seededRandom
│   ├── __tests__/        # Shared library tests
│   └── index.ts          # Barrel export
│
├── types/                # Central TypeScript definitions
├── i18n/                 # Translations (i18next)
├── test/                 # Global test setup
├── App.tsx               # Root component (feature orchestration)
├── main.tsx              # Entry point
└── index.css             # Global styles + CSS variables
```

---

## 🎯 Feature-Based Design Philosophy

### Why Feature-Based?

1. **Scalability** — Easy to add new features without touching existing code
2. **Maintainability** — Each feature is self-contained with clear boundaries
3. **Team Collaboration** — Different teams can work on different features in parallel
4. **Testing** — Feature tests live with feature code
5. **Code Splitting** — Future: lazy-load features on demand

### Feature Independence

Each feature folder contains:
- **Components** — UI presentational components
- **Hooks** — Feature-specific state logic
- **Lib** — Pure business logic (testable, reusable)
- **Tests** — Feature-specific test suite
- **index.ts** — Barrel export for clean imports

**Rule:** Features import from `shared/` or other features, but **not the reverse**. Shared code flows downward, not sideways.

```
shared/         ← All features can import from here
  ↑
features/       ← Features import from shared & each other
  ├─ game/
  ├─ daily/
  ├─ practice/
  └─ theme/
```

---

## 📦 Path Aliases

To keep imports clean, we use Vite path aliases (configured in `vite.config.ts` and `tsconfig.app.json`):

```typescript
// Instead of:
import { Modal } from '../../../shared/components/Modal/Modal';

// Write:
import { Modal } from '@shared/components/Modal/Modal';

// Or use barrel export:
import { Modal } from '@shared';
```

### Available Aliases

| Alias | Maps to | Use Case |
|-------|---------|----------|
| `@/` | `src/` | Root-level imports (types, i18n) |
| `@features/` | `src/features/` | Cross-feature imports |
| `@shared/` | `src/shared/` | Shared utilities & components |

### Relative Imports (Within Features)

For same-feature imports, use relative paths:

```typescript
// ✅ Good — within same feature
import { useGameState } from '../hooks/useGameState';

// ❌ Avoid — unnecessary alias for same feature
import { useGameState } from '@features/game/hooks/useGameState';
```

---

## 🔌 Barrel Exports (index.ts)

Each feature and shared/ exports a barrel file for clean imports:

### src/features/game/index.ts
```typescript
// Components
export { DailySudoku } from './components/DailySudoku';
export { SudokuGrid } from './components/SudokuGrid';
// ... rest of exports

// Usage
import { DailySudoku, SudokuGrid } from '@features/game';
```

### src/shared/index.ts
```typescript
export { Modal, Button, IconButton, StatCard } from './components/*';
export { formatTime } from './lib/formatTime';
// ... rest

// Usage
import { Modal, Button, formatTime } from '@shared';
```

---

## 🏗️ Module Organization

### Features/Game (Core Game Logic)

**Responsibility:** Sudoku board state, puzzle generation, validation, game mechanics.

**Key Files:**
- `lib/sudokuGenerator.ts` — Generates puzzles using seeded PRNG + backtracking
- `lib/sudokuValidator.ts` — Validates moves, detects conflicts
- `lib/completionDetector.ts` — Detects row/column/box/number completions
- `lib/boardUtils.ts` — Board utilities (count placed, find max number)
- `lib/puzzleFactory.ts` — Creates initial game state for daily/practice modes
- `hooks/useGameState.ts` — Game state reducer (board, notes, mistakes, history)
- `hooks/useGameTimer.ts` — Timer logic (elapsed time, formatting)
- `hooks/useKeyboardControls.ts` — Keyboard input routing (1-9, arrows, P, Z, Backspace)
- `hooks/useFastFill.ts` — Fast-fill mode state + auto-advance logic
- `components/DailySudoku.tsx` — Main orchestrator (daily mode)
- `components/SudokuGrid.tsx` — 9×9 grid display
- `components/SudokuCell.tsx` — Individual cell (handles click, pencil mode)
- `components/NumberPad.tsx` — Number button input
- `components/GameToolbar.tsx` — Undo, erase, undo buttons
- `components/GameHeader.tsx` — Title + timer display
- `components/GameTimer.tsx` — Timer component

---

### Features/Daily (Daily Challenge Feature)

**Responsibility:** Daily puzzle selection, stats tracking, sharing, completion flow.

**Key Files:**
- `lib/dailyPuzzle.ts` — Gets today's puzzle using Brazil timezone seed
- `lib/streakTracker.ts` — Tracks solve streaks in localStorage
- `lib/statsApi.ts` — Optional Supabase integration for global stats
- `lib/shareFormatter.ts` — Formats share text (Wordle-style)
- `hooks/useGamePersistence.ts` — Auto-save game state + completion recording
- `components/GameOverlay.tsx` — Completion screen with stats
- `components/DailyStatsPanel.tsx` — Stats display (time, mistakes, streak)
- `components/MistakeCounter.tsx` — Shows 3-mistake indicator
- `components/ShareResultButton.tsx` — Copy-to-clipboard share button
- `components/StreakDisplay.tsx` — Shows current streak

---

### Features/Practice (Unlimited Practice Mode)

**Responsibility:** Infinite puzzles from difficulty selector.

**Key Files:**
- `components/PracticeOverlay.tsx` — Mode selector + confirmation dialog

---

### Features/Theme (Dark/Light Theme)

**Responsibility:** Theme switching and persistence.

**Key Files:**
- `hooks/useTheme.ts` — Theme state + preference storage
- `components/ThemeToggle.tsx` — Sun/moon button

---

### Shared (Reusable Primitives)

**Responsibility:** Components, hooks, and utilities shared across features.

**Key Files:**
- `components/Modal/Modal.tsx` — Dialog wrapper (escape key, backdrop click)
- `components/Button/Button.tsx` — Button primitive (3 variants, 3 sizes)
- `components/IconButton/IconButton.tsx` — Icon button variant
- `components/StatCard/StatCard.tsx` — Stat display card
- `components/Icons.tsx` — SVG icons (Pencil, Sun, Moon, Undo, etc.)
- `lib/formatTime.ts` — Converts seconds to MM:SS format
- `lib/localGameStorage.ts` — localStorage wrapper (games, theme preference)
- `lib/seededRandom.ts` — Mulberry32 PRNG for deterministic puzzles
- `hooks/useCountdown.ts` — Countdown to midnight (Brazil timezone)

---

## 🧪 Test Organization

Tests live **adjacent to the code they test**, organized by feature:

```
src/
├── features/game/lib/__tests__/
│   ├── sudokuGenerator.test.ts
│   ├── sudokuValidator.test.ts
│   ├── completionDetector.test.ts
│   └── ... (102 total tests)
├── features/game/hooks/__tests__/
│   └── useGameState.test.ts
└── shared/lib/__tests__/
    ├── seededRandom.test.ts
    └── localGameStorage.test.ts
```

### Running Tests

```bash
npm run test:run         # Run all tests once (CI mode)
npm run test             # Run tests in watch mode (dev)
npm run test:coverage    # Generate coverage report
```

**CI/CD Integration:** GitHub Actions runs `npm run test:run`. If any test fails, deployment is blocked.

---

## 🎨 CSS Modules Pattern

All components use **CSS Modules with data-attributes** for dynamic styling:

```typescript
// Component
import css from './Button.module.css';

export function Button({ variant, disabled, children }) {
  return (
    <button
      className={css.button}
      data-variant={variant}
      data-disabled={disabled}
    >
      {children}
    </button>
  );
}
```

```css
/* Button.module.css */
.button {
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.button[data-variant="primary"] {
  background: var(--color-primary);
  color: white;
}

.button[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Benefits:**
- ✅ No style duplication
- ✅ Scoped styles (no global conflicts)
- ✅ Dynamic styling via data attributes
- ✅ CSS variables for theming
- ✅ ~10 kB CSS total (gzipped: 3.4 kB)

---

## 🔄 Data Flow

### Daily Game Flow

```
App.tsx
  └─ DailySudoku (feature/game/components)
      ├─ useGameState (reducer pattern)
      │  └─ Actions: MOVE, UNDO, CLEAR_BOARD, etc.
      ├─ useKeyboardControls (routes input)
      ├─ useFastFill (auto-advance logic)
      ├─ useGamePersistence (saves to localStorage)
      │  └─ recordCompletion (saves streak)
      │  └─ recordPlayerStarted (sends to Supabase)
      │
      └─ Components:
         ├─ SudokuGrid (renders cells)
         │  └─ SudokuCell (click, pencil toggle)
         ├─ NumberPad (input buttons)
         ├─ GameOverlay (completion modal)
         │  └─ shares to clipboard
         └─ GameTimer (elapsed time)
```

### Practice Mode Flow

```
App.tsx
  └─ DailySudoku (with isPractice=true)
      ├─ Different initial state (createPracticeInitialState)
      ├─ No persistence (no stats recording)
      └─ PracticeOverlay (leave confirm)
```

---

## 🧠 Key Patterns

### 1. Reducer Pattern (useGameState)

State mutations go through a single reducer for clarity and undo support:

```typescript
const [state, dispatch] = useReducer(gameReducer, initialState);

dispatch({ type: 'MOVE', payload: { row, col, value } });
dispatch({ type: 'UNDO' });
dispatch({ type: 'TOGGLE_PENCIL_MODE', payload: { row, col, number } });
```

**Why:** Complex state (board + notes + mistakes + history) benefits from explicit actions.

### 2. Custom Hooks for Logic

Business logic lives in hooks, not components:

```typescript
// ✅ Good — logic in hook
export function useFastFill() {
  const [active, setActive] = useState(false);
  const [number, setNumber] = useState(null);

  useEffect(() => {
    // auto-advance logic
  }, [active]);

  return { active, setActive, number, setNumber };
}
```

### 3. Pure Functions in Lib

Game logic is pure (no side effects), making it testable and composable:

```typescript
// ✅ Pure function
export function isValidPlacement(board: Board, row: number, col: number, value: number): boolean {
  // No I/O, no mutations, no randomness
}

// ✅ Deterministic with seeded RNG
export function generatePuzzle(random: Random): GeneratedPuzzle {
  // Uses injected random, not global Math.random()
}
```

### 4. Barrel Exports

Each feature exports a clean public API:

```typescript
// Instead of:
import { DailySudoku } from '@features/game/components/DailySudoku';
import { useGameState } from '@features/game/hooks/useGameState';

// Use:
import { DailySudoku, useGameState } from '@features/game';
```

### 5. CSS Modules + Data Attributes

No inline styles, all CSS is modular and scoped:

```typescript
// ✅ Good
<div className={css.container} data-active={isActive} />

// ❌ Avoid
<div style={{ backgroundColor: isActive ? 'red' : 'blue' }} />
```

---

## 🚀 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Bundle (gzip) | < 100 kB | ✅ 94.17 kB |
| CSS (gzip) | < 5 kB | ✅ 3.4 kB |
| First paint | < 1s | ✅ ~500ms |
| Grid re-render | < 50ms | ✅ ~10ms |
| Puzzle generation | < 5s | ✅ ~3s |
| Test suite | < 2s | ✅ ~1s |

---

## 🔧 Dependency Graph

```
external libs (react, i18next, etc.)
        ↓
    src/types/ (shared types)
        ↓
    shared/ (primitives & utilities)
        ↓
    features/
    ├─ game/ (core logic)
    ├─ daily/ (depends on game)
    ├─ practice/ (depends on game)
    └─ theme/ (independent)
        ↓
    App.tsx (orchestrator)
```

**Rule:** No circular dependencies. Features can import shared, but shared should never import features.

---

## 🧪 Adding New Code

### Adding a Component

```bash
# Create component with CSS module
src/features/[feature]/components/MyComponent.tsx
src/features/[feature]/components/MyComponent.module.css

# Add test
src/features/[feature]/components/__tests__/MyComponent.test.ts

# Update barrel export
src/features/[feature]/index.ts
```

### Adding a Hook

```bash
# Create hook
src/features/[feature]/hooks/useMyHook.ts

# Add test (if complex)
src/features/[feature]/hooks/__tests__/useMyHook.test.ts

# Update barrel export
src/features/[feature]/index.ts
```

### Adding Lib Code

```bash
# Create pure function
src/features/[feature]/lib/myFunction.ts

# Add comprehensive tests
src/features/[feature]/lib/__tests__/myFunction.test.ts

# Update barrel export
src/features/[feature]/index.ts
```

---

## ✅ Pre-Commit Checklist

Before committing, ensure:

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] All tests pass: `npm run test:run`
- [ ] Build succeeds: `npm run build`
- [ ] No linting errors: `npm run lint` (when added)
- [ ] Bundle size under 100 kB gzip: `npm run build` output
- [ ] CSS modules scoped (no global styles in components)
- [ ] Imports use path aliases or relative paths
- [ ] Barrel exports updated if adding new public APIs

---

**Next:** Read [PATTERNS.md](./ PATTERNS.md) for concrete code examples and best practices.
