# Daily Sudoku — AI-First Context & Guidelines

## Overview
Daily Sudoku is a mobile-first web game where users solve one shared Sudoku puzzle per day. The puzzle rotates daily at midnight Brazil time (America/Sao_Paulo timezone), and all users worldwide see the same puzzle on the same day.

**Status:** Ongoing MVP.

---

## Core Principles

### 1. Deterministic Everything
- **Seed-based generation:** Puzzle seed = `YYYY-MM-DD` in Brazil timezone.
- **Reproducible:** Same seed always generates the same valid, solvable puzzle.
- **No randomness at runtime:** All randomness is seeded upfront during puzzle generation.

### 2. Local-First Architecture
- **No login required:** Game progress stored entirely in browser localStorage.
- **Offline-capable:** Full gameplay works with zero backend (except optional stats).
- **Graceful degradation:** Global stats are best-effort; missing Supabase credentials silently disables them.

### 3. Clean Separation of Concerns
- **lib/** — Pure business logic (no React, no UI dependencies).
- **hooks/** — React state management and lifecycle.
- **components/** — Presentational components; minimal logic.
- **types/** — Single source of truth for all TypeScript definitions.

### 4. Type Safety
- Use TypeScript strict mode exclusively.
- Avoid `any` types; use discriminated unions and generics instead.
- Types live in `src/types/index.ts` for centralized reference.

### 5. Performance-First
- Memoize expensive computations with `useCallback` / `useMemo`.
- Render only what changed; avoid cascading re-renders.
- Persist to localStorage asynchronously and efficiently (batch writes where possible).

---

## Architecture

### High-Level Data Flow

```
[Browser loads]
    ↓
[getDailyPuzzle()] → seed-based generation
    ↓
[loadGameState() OR buildInitialState()]
    ↓
[DailySudoku component]
    ├─ useGameState() — central reducer for all game mutations
    ├─ useGameTimer() — elapsed second ticker
    ├─ useTheme() — dark/light preference + OS detection
    └─ keyboard listener — handles all input
    ↓
[Save to localStorage after every meaningful mutation]
    ↓
[On puzzle complete] → recordCompletion() + recordPuzzleSolved()
    ↓
[Supabase stats (optional)]
```

### Key Abstractions

#### `useGameState(initialState: GameState)`
Central reducer managing:
- Cell selection
- Number entry (validation + conflict detection)
- Pencil mode (notes)
- Erase, Undo
- Mistake tracking
- Game over / completion detection

**Actions:**
- `SELECT_CELL` — highlight a cell
- `ENTER_NUMBER` — attempt to place a digit
- `ERASE` — clear the selected cell
- `TOGGLE_PENCIL` — switch note-taking mode
- `UNDO` — revert last action
- `TICK` — update elapsed time
- `RESET` — restore from saved state

#### `getDailyPuzzle()`
Returns:
```typescript
{
  puzzle: Board,           // the clues (0 = empty)
  solution: Board,         // the complete solution
  dateStr: string,         // YYYY-MM-DD in Brazil timezone
  puzzleNumber: number,    // days since 2026-01-01
}
```

#### `loadGameState()` vs `buildInitialState()`
- **loadGameState:** Resume in-progress game (called first).
- **buildInitialState:** Fresh start if no save found.

Both are called in `DailySudoku.tsx` via `useMemo` to avoid re-generation on every render.

---

## File Organization

```
src/
├── types/
│   └── index.ts                  — Board, GameState, StreakData, ShareData, DailyStats
│
├── lib/ (pure business logic — no React)
│   ├── seededRandom.ts           — Mulberry32 PRNG + Fisher-Yates shuffle
│   ├── sudokuGenerator.ts        — Generate valid puzzle with unique solution
│   ├── sudokuValidator.ts        — Check moves, detect conflicts, validate solutions
│   ├── dailyPuzzle.ts            — Brazil timezone + seed → puzzle
│   ├── localGameStorage.ts       — localStorage persistence (game + theme + streak)
│   ├── streakTracker.ts          — Consecutive-day streak logic
│   ├── shareFormatter.ts         — Wordle-style share text + clipboard API
│   └── statsApi.ts               — Supabase REST (optional)
│
├── i18n/
│   ├── index.ts                  — i18next configuration + auto language detection
│   └── locales/
│       ├── en.json               — English UI text
│       ├── pt.json               — Portuguese (Brazil)
│       └── es.json               — Spanish
│
├── hooks/ (React state + lifecycle)
│   ├── useTheme.ts               — Light/dark mode + localStorage + OS detection
│   ├── useGameState.ts           — Central game reducer + action handlers
│   └── useGameTimer.ts           — Elapsed seconds ticker
│
├── components/ (presentational)
│   ├── SudokuCell.tsx            — Single cell with notes, highlights, conflicts
│   ├── SudokuGrid.tsx            — 9×9 grid layout + highlight logic
│   ├── NumberPad.tsx             — 1-9 buttons + remaining count
│   ├── GameToolbar.tsx           — Undo / Erase / Notes toggle
│   ├── MistakeCounter.tsx        — 3 dot visual indicator
│   ├── StreakDisplay.tsx         — 🔥 streak count
│   ├── GameTimer.tsx             — MM:SS timer
│   ├── ThemeToggle.tsx           — Sun/moon button
│   ├── ShareResultButton.tsx     — Share to clipboard
│   ├── DailyStatsPanel.tsx       — Global stats from Supabase
│   ├── GameOverlay.tsx           — Modal for game end states
│   └── DailySudoku.tsx           — Top-level game component
│
├── App.tsx                       — Root component (wraps DailySudoku with theme)
├── main.tsx                      — Entry point
├── index.css                     — CSS variables + theme system
└── i18n/                         — initialized before render

.claude/
├── CONTEXT.md                    — This file
├── ARCHITECTURE.md               — Detailed design patterns
├── DEVELOPMENT.md                — How to run & develop locally
├── FEATURES.md                   — Current features & roadmap
└── REACT_BEST_PRACTICES.md       — Senior-level React standards
```

---

## Key Design Patterns

### 1. Reducer for Complex State
`useGameState` uses a reducer because:
- Multiple interdependent state updates (board + notes + mistakes).
- Undo requires full history snapshots.
- Action-based interface is clearer than multiple setState calls.

### 2. Memoization Strategy
- **`React.memo` on components:** SudokuCell, NumberPad, GameToolbar — prevent re-renders.
- **`useCallback`:** Event handlers passed to child components.
- **`useMemo`:** Initial state generation (expensive puzzle loading).

### 3. Lazy Conflict Detection
- `getConflicts()` is called once per render in `SudokuGrid` to compute all conflict positions.
- Prevents re-computing conflicts per-cell.

### 4. localStorage Batching
- Game state saved after every meaningful mutation (selectCell, enterNumber, erase, etc.).
- Timer ticks saved only every 5 seconds (to reduce write frequency).

### 5. Keyboard-First Input
- Numbers 1-9 entered via keyboard or NumberPad buttons.
- Arrow keys navigate the grid.
- Ctrl+Z / Cmd+Z for undo.
- P toggles pencil mode.
- Backspace / Delete / 0 erases.

---

## Reactive Flows

### Game Start
1. Component mounts → `getDailyPuzzle()` generates today's puzzle.
2. `loadGameState()` tries to resume; if not found, `buildInitialState()` creates a fresh board.
3. `useGameTimer()` starts ticking if game is not complete/over.

### Number Entry
1. User clicks cell → `selectCell(row, col)`.
2. User clicks number → `enterNumber(num)`.
3. Reducer checks:
   - Is pencil mode on? → Add to notes.
   - Otherwise: Is the number correct? → If no, increment mistakes & revert cell; if yes, clear related notes.
4. Dispatch: Board updated → `saveGameState()` persists → Component re-renders.

### Puzzle Complete
1. `isBoardComplete(board, solution)` returns true.
2. `recordCompletion()` updates streak.
3. `recordPuzzleSolved()` sends elapsed time to Supabase.
4. `GameOverlay` displays results + share button + global stats.

### Theme Toggle
1. User clicks theme button → `toggleTheme()`.
2. `saveTheme()` stores preference.
3. `document.documentElement.setAttribute('data-theme', 'dark' | 'light')`.
4. All CSS variables automatically update via `:root[data-theme="dark"]`.

---

## Performance Considerations

| Aspect | Strategy |
|--------|----------|
| **Bundle size** | Tree-shake unused code; vite build output ~85 kB gzip. |
| **Rendering** | Memoize SudokuCell; recompute grid highlights once per render. |
| **Storage writes** | Batch timer ticks; write every 5s instead of every 1s. |
| **Puzzle generation** | Only happens on app mount (cached in useMemo). |
| **Supabase calls** | Async; fail silently if offline/misconfigured. |

---

## Testing Strategy (TDD)

### Unit Tests
- **sudokuGenerator.ts:** Puzzle validity, uniqueness check, seeded reproducibility.
- **sudokuValidator.ts:** Conflict detection, board completeness, placement rules.
- **streakTracker.ts:** Day gap logic, streak reset/increment.
- **shareFormatter.ts:** Wordle-style text generation.

### Integration Tests
- **useGameState reducer:** All action types + transitions (e.g., select → enter → undo).
- **localGameStorage:** Persist + load + clear old saves.
- **dailyPuzzle:** Brazil timezone calculations, seed consistency.

### Component Tests
- **SudokuGrid:** Highlight logic, selection state.
- **NumberPad:** Remaining count updates, disabled state.
- **GameOverlay:** Visible only when complete/over, shows correct stats.

### End-to-End Tests
- Load page → generate puzzle → play several moves → complete → check streak + share text.

### Test Framework
- Use **Vitest** (Jest-compatible, fast, native ESM).
- **@testing-library/react** for component assertions.
- **Happy path + edge cases** (e.g., 3 mistakes in a row, undo from complete state).

---

## Error Handling

### Graceful Degradation
- **localStorage unavailable?** Fail silently; game still playable.
- **Supabase misconfigured?** Stats unavailable, but game continues.
- **Browser doesn't support Intl.DateTimeFormat?** Fallback to UTC (Wordle-style).

### Input Validation
- Only 0-9 accepted for cell values.
- Rejected numbers do not appear in any state.
- Pencil notes are Sets; impossible to duplicate.

### Edge Cases
- Undo from an "errored" cell reverts the mistake count.
- Completing puzzle after 2 mistakes records streak correctly.
- Switching tabs doesn't lose state (all in localStorage).

---

## Localization (i18n)

### Supported Languages
- **English** (fallback)
- **Portuguese (Brazil)**
- **Spanish**

### Detection
Auto-detected from `navigator.language`; user can change via language switcher (future feature).

### All UI Strings
Use `useTranslation()` and `t('key.path')` throughout components. Keys are in `i18n/locales/*.json`.

---

## Deployment

### Static Hosting
- Build → `npm run build` → `/dist` folder.
- Deploy to Vercel, Netlify, or S3 + CloudFront.
- No backend required (localStorage is sufficient).

### Optional Supabase Setup
1. Create Supabase project.
2. Create table `daily_stats` (puzzle_number PK, players_started, players_solved, total_completion_time).
3. Set row-level security to allow anon inserts.
4. Copy `.env.example` → `.env` with your URL + anon key.

---

## Future Roadmap

See [FEATURES.md](./FEATURES.md) for detailed current features and roadmap.

---

## Quick Links
- **How to run locally:** See [DEVELOPMENT.md](./DEVELOPMENT.md)
- **React best practices:** See [REACT_BEST_PRACTICES.md](./REACT_BEST_PRACTICES.md)
- **Architecture deep-dive:** See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Feature list & roadmap:** See [FEATURES.md](./FEATURES.md)
