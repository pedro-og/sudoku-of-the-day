# Development — Running Locally & Contributing

## Quick Start

### Prerequisites
- Node.js >= 20.19 (we use 22.6.0; Vite wants 22.12+ but 22.6 works with a warning)
- npm >= 10

### Setup
```bash
# Clone / cd into project
cd /Users/pedrooliveiragonzaga/daily-sudoku

# Install dependencies
npm install

# Create .env (optional, for Supabase stats)
cp .env.example .env
# Edit .env with your Supabase URL + anon key (or leave blank to disable stats)
```

### Run Dev Server
```bash
npm run dev
```

Opens browser at `http://localhost:5173`.

**Hot reload:** Edit any file → browser auto-refreshes.

---

## Available Scripts

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start dev server on localhost:5173 |
| `npm run build` | Compile TypeScript, build with Vite to `/dist` |
| `npm run preview` | Preview production build locally |
| `npm run format` | Format code with Prettier (if configured) |
| `npm test` | Run test suite (when tests are added) |

---

## Project Structure for Development

```
src/
├── types/index.ts              ← All shared types (read before writing code)
├── lib/                        ← Pure business logic (no React)
│   ├── seededRandom.ts         ← PRNG + shuffling
│   ├── sudokuGenerator.ts      ← Puzzle generation
│   ├── sudokuValidator.ts      ← Game rules & conflict detection
│   ├── dailyPuzzle.ts          ← Date → seed → puzzle
│   ├── localGameStorage.ts     ← Browser persistence
│   ├── streakTracker.ts        ← Daily streak logic
│   ├── shareFormatter.ts       ← Wordle-style sharing
│   └── statsApi.ts             ← Supabase integration
├── hooks/                      ← React hooks
│   ├── useTheme.ts
│   ├── useGameState.ts         ← Central game reducer
│   └── useGameTimer.ts
├── components/                 ← React components
│   ├── SudokuCell.tsx
│   ├── SudokuGrid.tsx
│   ├── NumberPad.tsx
│   ├── GameToolbar.tsx
│   ├── ... (10 more)
│   └── DailySudoku.tsx         ← Top-level game component
├── i18n/                       ← Translations
├── App.tsx                     ← Root component
├── main.tsx                    ← Entry point
└── index.css                   ← Global styles + CSS variables

.claude/
├── CONTEXT.md                  ← Start here (overview & principles)
├── ARCHITECTURE.md             ← Deep dives into design decisions
├── REACT_BEST_PRACTICES.md     ← Senior-level React standards
├── FEATURES.md                 ← Feature list & roadmap
└── DEVELOPMENT.md              ← This file
```

---

## Code Walkthrough

### 1. Understanding the Puzzle Generation

**File:** `src/lib/dailyPuzzle.ts`

Every day, the app generates the same Sudoku puzzle worldwide based on the Brazil timezone date:

```typescript
const dateStr = getBrazilDateString();  // e.g., "2026-03-06"
const random = createSeededRandom(dateStr);
const puzzle = generatePuzzle(random, 30);  // 30 clues = medium difficulty
```

**Why Brazil timezone?**
- Users in São Paulo, Tokyo, New York all see the same puzzle.
- Puzzle rotates at midnight São Paulo time for all.

**Try it:**
```typescript
// In browser console:
import { getDailyPuzzle } from './lib/dailyPuzzle';
const p = getDailyPuzzle();
console.log(p.puzzle);
```

### 2. The Game State Reducer

**File:** `src/hooks/useGameState.ts`

All game logic flows through a single reducer. Actions include:

- `SELECT_CELL` — Click a cell
- `ENTER_NUMBER` — Type a number
- `TOGGLE_PENCIL` — Activate note mode
- `ERASE` — Delete cell content
- `UNDO` — Revert last action

**Example:** User enters 7 in a cell:

```typescript
dispatch({ type: 'ENTER_NUMBER', num: 7 });

// Reducer:
// 1. Check: Is 7 correct?
// 2. If yes: Save board[r][c] = 7, clear related notes
// 3. If no: Revert board[r][c] = 0, increment mistakes
// 4. If mistakes >= 3: Set isGameOver = true
```

### 3. Highlighting Logic

**File:** `src/components/SudokuGrid.tsx`

When you select a cell, the grid highlights:
- The selected cell (bright blue)
- Its entire row (light blue)
- Its entire column (light blue)
- Its 3×3 box (light blue)
- All cells with the same digit (light purple)

**Implementation:** Computed once per render, no re-computation per-cell.

```typescript
const selVal = board[selectedCell[0]][selectedCell[1]];

// In cell loop:
const isHighlighted = r === selRow || c === selCol || inSameBox;
const isSameNumber = selVal !== 0 && val === selVal;
```

### 4. Persistence Strategy

**File:** `src/lib/localGameStorage.ts`

Every move is saved to localStorage:

```
localStorage['daily-sudoku:game:2026-03-06'] = {
  "board": [...],
  "notes": [...],
  "mistakes": 0,
  "isComplete": false
}
```

On next load, the game resumes:

```typescript
const saved = loadGameState(dateStr);
if (saved) {
  // Resume in-progress game
  state = saved;
} else {
  // Fresh start
  state = buildInitialState(puzzle);
}
```

### 5. Theme System

**File:** `src/hooks/useTheme.ts` + `src/index.css`

Theme switching is a single CSS attribute:

```typescript
// In hook:
document.documentElement.setAttribute('data-theme', 'dark');

// In CSS:
:root { --bg-app: #f4f6fb; }  /* light mode */
[data-theme="dark"] { --bg-app: #0f1117; }  /* dark mode */
```

All components reference CSS variables, so no individual re-styling needed.

### 6. Keyboard Input Routing

**File:** `src/components/DailySudoku.tsx`

Listens for keyboard events and maps them to game actions:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= 9) {
      enterNumber(num);
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        selectCell(Math.max(0, row - 1), col);
        break;
      case 'z':
      case 'Z':
        if (e.metaKey || e.ctrlKey) undo();
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedCell, enterNumber, selectCell, undo]);
```

---

## Adding a New Feature

### Example: Dark Mode Toggle Button

1. **Check if hook exists:** `useTheme` already handles dark/light.

2. **Create component:**
   ```typescript
   // src/components/ThemeToggle.tsx
   export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
     return (
       <button onClick={onToggle}>
         {theme === 'dark' ? '☀️' : '🌙'}
       </button>
     );
   }
   ```

3. **Wire up in DailySudoku:**
   ```typescript
   const { theme, toggleTheme } = useTheme();
   return (
     <>
       <ThemeToggle theme={theme} onToggle={toggleTheme} />
       {/* rest of UI */}
     </>
   );
   ```

4. **Test:** Click button → theme changes → all CSS variables update.

### Example: Add a "Hard" Difficulty Level

1. **Update puzzle generation:**
   ```typescript
   // src/lib/dailyPuzzle.ts
   export function getDailyPuzzle(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
     const clues = difficulty === 'easy' ? 40 : difficulty === 'hard' ? 20 : 30;
     return generatePuzzle(random, clues);
   }
   ```

2. **Update GameState type:**
   ```typescript
   // src/types/index.ts
   export interface GameState {
     // ...
     difficulty: 'easy' | 'medium' | 'hard';
   }
   ```

3. **Add UI selector:**
   ```typescript
   // In DailySudoku or a new DifficultySelector component
   <select onChange={(e) => setDifficulty(e.target.value)}>
     <option value="easy">Easy (40 clues)</option>
     <option value="medium" selected>Medium (30 clues)</option>
     <option value="hard">Hard (20 clues)</option>
   </select>
   ```

---

## Debugging Tips

### 1. Check Today's Puzzle
```typescript
// Browser console
import { getDailyPuzzle } from './lib/dailyPuzzle';
const { puzzle, solution, dateStr, puzzleNumber } = getDailyPuzzle();
console.log('Puzzle number:', puzzleNumber);
console.log('Date:', dateStr);
console.log('Puzzle:'); console.table(puzzle);
console.log('Solution:'); console.table(solution);
```

### 2. Inspect Game State
```typescript
// Browser console
JSON.parse(localStorage.getItem('daily-sudoku:game:2026-03-06'));
```

### 3. Check Streak Data
```typescript
JSON.parse(localStorage.getItem('daily-sudoku:streak'));
```

### 4. Verify Puzzle Reproducibility
```typescript
// Run this twice; should output true
import { getDailyPuzzle } from './lib/dailyPuzzle';
const p1 = getDailyPuzzle();
const p2 = getDailyPuzzle();
console.log(JSON.stringify(p1.puzzle) === JSON.stringify(p2.puzzle));
```

### 5. React DevTools
Install **React Developer Tools** browser extension:
- Inspect component tree
- View props / state
- Profile render performance
- Time reducer actions

---

## Common Tasks

### Run Tests (When Ready)
```bash
npm test
```

### Build for Production
```bash
npm run build
# Output in /dist

# Preview locally
npm run preview
```

### Check for TypeScript Errors
```bash
npx tsc --noEmit
```

### Format Code
```bash
npm run format
# (or use a code editor with Prettier integration)
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
# Follows interactive prompts; deploys /dist to vercel.com
```

---

## Troubleshooting

### "Cannot find module" Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### localStorage Quota Exceeded
- Browser console will show an error if localStorage is full.
- This should not happen unless the user has many other sites storing data.
- App will continue to work in RAM (just won't persist).

### Supabase Stats Not Recording
- Verify `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Check browser DevTools Network tab → see if requests are hitting Supabase.
- If stats are optional, it's fine if they're disabled.

### Puzzle Doesn't Match Expected Seed
- Verify `getBrazilDateString()` returns correct date.
- Check that `America/Sao_Paulo` timezone is used (not local time).
- Seed format must be `YYYY-MM-DD`.

### React DevTools Shows Excessive Re-renders
- Use Profiler to identify which component is re-rendering.
- Check if props are changing unnecessarily (arrays/objects created in render).
- Wrap expensive components in `React.memo()`.

---

## Code Review Checklist

Before submitting a PR, ensure:

- [ ] TypeScript compiles without errors
- [ ] No console warnings
- [ ] Tests pass (when applicable)
- [ ] Code follows REACT_BEST_PRACTICES.md
- [ ] Props are properly typed
- [ ] Effects have correct dependencies
- [ ] localStorage writes are not excessive
- [ ] No hardcoded strings (use i18n)
- [ ] Component is memoized if it receives non-primitive props
- [ ] Naming is descriptive
- [ ] Comments explain "why", not "what"

---

## Performance Profiling

### Using React DevTools Profiler
1. Open React DevTools → Profiler tab
2. Click "Record"
3. Interact with the app
4. Click "Stop"
5. Analyze:
   - Which components took longest to render?
   - Which renders were unexpected?

### Using Browser Performance Tab
1. Open DevTools → Performance tab
2. Click "Record"
3. Interact with the app
4. Click "Stop"
5. Look for:
   - Long tasks (> 50ms)
   - Main thread jank
   - Layout thrashing

### Typical Performance Targets
- Puzzle generation: < 5s (one-time, acceptable)
- Grid re-render: < 50ms (on cell click)
- Cell click latency: < 100ms
- Theme toggle: < 30ms (instant to user)

---

## Resources

- **React docs:** https://react.dev
- **TypeScript handbook:** https://www.typescriptlang.org/docs
- **Vite docs:** https://vite.dev
- **i18next docs:** https://www.i18next.com
- **Supabase docs:** https://supabase.com/docs

---

## Getting Help

1. **Check existing documentation** in `.claude/` folder.
2. **Run tests** to isolate the issue.
3. **Use browser DevTools** (console, network, performance tabs).
4. **Search** React / TypeScript / Vite docs for error messages.
5. **Ask Claude** (this AI) with context from `.claude/CONTEXT.md`.
