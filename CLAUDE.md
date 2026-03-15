# Daily Sudoku — Complete Project Summary

Welcome! This is an **AI-first, production-ready daily Sudoku game**. This file is your entry point.

## 🚀 Quick Start

```bash
# Setup
npm install

# Run locally
npm run dev

# Opens http://localhost:5173
```

Done! The app is running.

---

## 📚 Documentation Hub

All comprehensive documentation is in the `.claude/` folder:

| File | Purpose | Read Time |
|------|---------|-----------|
| **[.claude/README.md](./.claude/README.md)** | Index of all docs & workflows | 5 min |
| **[.claude/CONTEXT.md](./.claude/CONTEXT.md)** | High-level overview & principles | 20 min |
| **[.claude/ARCHITECTURE_NEW.md](./.claude/ARCHITECTURE_NEW.md)** | Feature-based folder structure (post-refactor) | 25 min |
| **[.claude/PATTERNS.md](./.claude/PATTERNS.md)** | Concrete code examples & design patterns | 30 min |
| **[.claude/REACT_BEST_PRACTICES.md](./.claude/REACT_BEST_PRACTICES.md)** | Senior React standards | 40 min |
| **[.claude/DEVELOPMENT.md](./.claude/DEVELOPMENT.md)** | How to run locally & contribute | 20 min |
| **[.claude/FEATURES.md](./.claude/FEATURES.md)** | Current features & roadmap | 15 min |

**👉 Start with `.claude/README.md` for an overview of all docs.**

**NEW (March 2026):** The project underwent a major architectural refactoring. Read [ARCHITECTURE_NEW.md](./.claude/ARCHITECTURE_NEW.md) to understand the feature-based folder structure and [PATTERNS.md](./.claude/PATTERNS.md) for concrete implementation examples.

---

## 📋 What This Project Does

**One Sudoku puzzle per day for all users worldwide.**

- ✅ Same puzzle for everyone (seeded by Brazil timezone date)
- ✅ Deterministic generation (Mulberry32 PRNG)
- ✅ No login required (localStorage for persistence)
- ✅ Responsive mobile-first UI
- ✅ Dark/light theme
- ✅ Streak tracking
- ✅ Wordle-style sharing
- ✅ Optional global stats (Supabase)
- ✅ Multi-language (English, Portuguese, Spanish)

---

## 🏗️ Tech Stack

**Frontend:**
- **React 19** + TypeScript 5.9 (strict mode)
- **Vite 7.3** (build tool, <1s HMR)
- **CSS Modules** + CSS variables (theming)
- **i18next** (translations: EN, PT, ES)
- **localStorage** (persistence)

**Testing & Quality:**
- **Vitest** (unit/integration tests, 102 tests)
- **React Testing Library** (component testing)
- **TypeScript strict mode** (no `any`, discriminated unions)

**DevOps & Deployment:**
- **GitHub Actions** CI/CD (lint → test → build → deploy)
- **Docker** (multi-stage build + nginx)
- **Nginx** (SPA routing, gzip, security headers)

**Optional Backend:**
- **Supabase** (stats tracking, graceful degradation)

**Bundle Size:**
- **JS:** 292.84 kB (94.17 kB gzip) ✅
- **CSS:** 13.26 kB (3.41 kB gzip) ✅
- **Total:** ~98 kB gzip (under 100 kB target)

---

## 📂 Folder Structure

```
src/
├── features/            ← Feature-based modules (NEW!)
│   ├── game/           ← Core Sudoku logic (components, hooks, lib)
│   ├── daily/          ← Daily puzzle feature
│   ├── practice/       ← Unlimited practice mode
│   └── theme/          ← Dark/light theme
├── shared/             ← Reusable primitives (components, hooks, lib)
├── types/              ← Central TypeScript definitions
├── i18n/               ← Translations
├── test/               ← Test setup
├── App.tsx             ← Root component
├── main.tsx            ← Entry point
└── index.css           ← Global styles + CSS variables

.claude/                ← AI-first documentation
.github/workflows/      ← CI/CD pipeline (GitHub Actions)
```

**Key Refactoring (March 2026):**
- ✅ Feature-based folder structure instead of by-type
- ✅ 102 comprehensive tests with 90%+ lib coverage
- ✅ Vitest + React Testing Library
- ✅ Zero inline styles, all CSS Modules
- ✅ DailySudoku reduced from 572 → 185 lines
- ✅ Path aliases for clean imports (@/, @features/, @shared/)
- ✅ CI/CD blocks GitHub Pages if tests fail
- ✅ Docker containerization & docker-compose

---

## 🎮 How to Play

1. **Click a cell** to select it
2. **Type 1–9** or click number buttons to enter
3. **Press P** to toggle pencil mode (notes)
4. **Press Backspace** to erase
5. **Press Ctrl+Z** to undo
6. **Complete the puzzle** → See your stats & share result

---

## 💻 Development Commands

```bash
# Dev server (hot reload, http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (watch mode)
npm run test

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage

# Type check (no emit)
npx tsc --noEmit
```

---

## 🔧 Configuration

### Optional: Enable Global Stats (Supabase)

1. Copy `.env.example` to `.env`
2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-key-here
   ```
3. Create table `daily_stats` in Supabase:
   ```sql
   CREATE TABLE daily_stats (
     puzzle_number BIGINT PRIMARY KEY,
     players_started BIGINT DEFAULT 0,
     players_solved BIGINT DEFAULT 0,
     total_completion_time BIGINT DEFAULT 0
   );
   ```

**Without this:** App works perfectly fine, stats just won't be collected.

---

## 🚀 Key Features

### Puzzle Generation
- ✅ Seeded PRNG (Mulberry32) for reproducibility
- ✅ Backtracking solver with uniqueness check
- ✅ 30 clues (medium difficulty)
- ✅ Guaranteed valid, solvable puzzles
- ✅ Deterministic by Brazil timezone date

### Game Logic
- ✅ Full undo history (reverts board, notes, mistakes)
- ✅ 3-mistake limit → game over
- ✅ Wrong numbers instantly rejected
- ✅ Conflict detection (highlights duplicates)
- ✅ Smart highlighting (row, col, box, same digit)
- ✅ Keyboard & mouse input (1-9, arrows, P, Z, Backspace)
- ✅ Fast-fill mode (auto-complete when possible)
- ✅ Pencil mode for notes

### User Experience
- ✅ Mobile-first responsive design
- ✅ Keyboard-first input with shortcuts
- ✅ Dark mode with OS auto-detection
- ✅ Theme persistence in localStorage
- ✅ Smooth animations & transitions
- ✅ Multi-language (English, Portuguese, Spanish)

### Persistence
- ✅ Game state saved to localStorage (by date)
- ✅ Streak tracking across days
- ✅ Auto-resume on return (same day)
- ✅ Theme preference remembered

### Sharing & Stats
- ✅ Wordle-style result sharing
- ✅ Copy to clipboard with one click
- ✅ No spoilers (grid shows completion, not layout)
- ✅ Optional global stats (Supabase)
- ✅ Player completion tracking

### Architecture
- ✅ Feature-based folder structure
- ✅ Reducer pattern for game state
- ✅ Custom hooks for logic extraction
- ✅ Pure functions in lib/ (testable)
- ✅ CSS Modules for scoped styling
- ✅ 102 tests (90%+ coverage)

---

## 🧠 Core Concepts

### Deterministic Generation
The puzzle seed = `YYYY-MM-DD` in Brazil timezone (America/Sao_Paulo).

This ensures:
- Same puzzle for all users worldwide on the same day
- Puzzle rotates at midnight São Paulo time
- Zero backend needed (seed is just a date string)

### Reducer Pattern
All game state mutations go through a central reducer (`useGameState`).

Why? Complex state (board + notes + mistakes + history) benefits from:
- Single source of truth
- Action-based semantics
- Undo-friendly snapshots
- Easy to test

### localStorage Persistence
Every move is saved automatically:
```
daily-sudoku:game:2026-03-06 = { board, notes, mistakes, ... }
```

On reload, the game resumes exactly where it left off.

### CSS Variables for Theming
All colors are CSS variables:
```css
:root { --bg-app: #f4f6fb; }           /* light */
[data-theme="dark"] { --bg-app: #0f1117; }  /* dark */
```

One attribute on `<html>` switches the entire theme.

---

## 🧪 Testing Strategy

**Current Test Coverage:**
- ✅ 102 tests across 10 test files
- ✅ 90%+ coverage on lib/ (pure functions)
- ✅ 100% coverage on useGameState reducer
- ✅ Component tests for key UI components
- ✅ Integration tests for localStorage + persistence
- ✅ E2E-like tests for game flows

**Test Structure:**
```
src/features/game/lib/__tests__/sudokuGenerator.test.ts
src/features/game/hooks/__tests__/useGameState.test.ts
src/features/daily/lib/__tests__/dailyPuzzle.test.ts
src/shared/lib/__tests__/seededRandom.test.ts
... (102 tests total)
```

**Running Tests:**
```bash
npm run test              # Watch mode (development)
npm run test:run         # Run once (CI mode)
npm run test:coverage    # Generate coverage report
```

**CI/CD Integration:**
```
GitHub Actions → Run tests → If FAIL: ❌ Block deployment
                                      → If PASS: ✅ Deploy to GitHub Pages
```

Tests **must pass** before code deploys. Zero tolerance for breaking changes.

See [.claude/PATTERNS.md](./.claude/PATTERNS.md) for concrete test examples.

---

## 📊 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Bundle (gzip) | < 100 kB | ✅ 94.17 kB |
| CSS (gzip) | < 5 kB | ✅ 3.41 kB |
| First paint | < 1s | ✅ ~500ms |
| Grid re-render | < 50ms | ✅ ~10ms |
| Puzzle generation | < 5s | ✅ ~3s |
| Test suite | < 2s | ✅ ~1s |

---

## 🗺️ Roadmap

### ✅ Completed (March 2026)
- [x] Full test suite (Vitest, 102 tests)
- [x] Feature-based folder structure
- [x] CSS Modules (zero inline styles)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Docker containerization
- [x] Path aliases for clean imports

### Near-Term (1–2 months)
- [ ] UI refinements (settings modal, tutorial)
- [ ] Difficulty selector (easy/medium/hard)
- [ ] Analytics dashboard
- [ ] Lint rules (ESLint)
- [ ] Performance monitoring

### Mid-Term (2–6 months)
- [ ] Multiplayer (live sessions, leaderboard)
- [ ] Puzzle archive (replay old puzzles)
- [ ] Mobile app (React Native)
- [ ] Hint system
- [ ] Accessibility audit (WCAG 2.1 AA)

### Long-Term (6+ months)
- [ ] Variant Sudoku modes (Jigsaw, X, Killer)
- [ ] User accounts & cloud sync
- [ ] AI opponent
- [ ] Offline PWA support

See [.claude/FEATURES.md](./.claude/FEATURES.md) for full roadmap.

---

## 🤝 Contributing

1. **Read documentation:**
   - [ARCHITECTURE_NEW.md](./.claude/ARCHITECTURE_NEW.md) — Folder structure
   - [PATTERNS.md](./.claude/PATTERNS.md) — Code examples
   - [REACT_BEST_PRACTICES.md](./.claude/REACT_BEST_PRACTICES.md) — Standards

2. **Pick a feature from [FEATURES.md](./.claude/FEATURES.md) roadmap**

3. **Create a branch:** `git checkout -b feature/name`

4. **Implement:**
   - Follow feature-based folder structure
   - Use CSS Modules (no inline styles)
   - Extract logic to hooks & lib/
   - Write tests alongside code

5. **Verify before submitting:**
   ```bash
   npx tsc --noEmit      # Type check
   npm run test:run      # All tests pass
   npm run build         # Build succeeds
   ```

6. **Submit PR:**
   - Clear description
   - Tests included
   - No breaking changes
   - CI/CD must pass

---

## 🐛 Debugging

### Check Today's Puzzle
```javascript
// Browser console
import { getDailyPuzzle } from './lib/dailyPuzzle';
const p = getDailyPuzzle();
console.table(p.puzzle);
```

### Inspect Game State
```javascript
JSON.parse(localStorage.getItem('daily-sudoku:game:2026-03-06'));
```

### React DevTools
Install React Developer Tools browser extension → inspect component tree, profile renders.

See [.claude/DEVELOPMENT.md](./.claude/DEVELOPMENT.md) for more debugging tips.

---

## ❓ FAQ

**Q: Why can't I play old puzzles?**
A: Puzzles are deterministic by date. You can replay them using the archive feature (roadmap).

**Q: Where is my data stored?**
A: Entirely in browser localStorage. No servers know about your progress.

**Q: Why doesn't it work offline?**
A: It does! Zero backend required (except optional Supabase stats).

**Q: Can I play with friends?**
A: Not yet, but multiplayer is in the roadmap.

**Q: How do I enable dark mode?**
A: Click the sun/moon button in top-right. Your preference is saved.

**Q: What if Supabase is down?**
A: Game works fine without it. Stats just won't be collected.

See [.claude/FEATURES.md](./.claude/FEATURES.md) FAQ section for more.

---

## 🎯 Project Principles

1. **Deterministic** — Same seed → same puzzle every time
2. **Local-first** — No login, all data in browser
3. **Graceful degradation** — Works with minimal dependencies
4. **Type-safe** — TypeScript strict mode always
5. **Performance-first** — < 100 kB bundle, < 1s load
6. **Accessible** — Keyboard-first, mobile-friendly
7. **Testable** — Pure functions, modular design

---

## 📖 Next Steps

### For Running Locally
→ See [.claude/DEVELOPMENT.md](./.claude/DEVELOPMENT.md) "Quick Start"

### For Understanding the Codebase
→ Start with [.claude/CONTEXT.md](./.claude/CONTEXT.md)

### For Writing Code
→ Read [.claude/REACT_BEST_PRACTICES.md](./.claude/REACT_BEST_PRACTICES.md) first

### For Understanding Design Decisions
→ See [.claude/ARCHITECTURE.md](./.claude/ARCHITECTURE.md)

### For Feature Planning
→ Check [.claude/FEATURES.md](./.claude/FEATURES.md)

### For AI Assistants (Claude)
→ Everything you need is in `.claude/` folder. Start with README.md there.

---

## 📞 Questions?

1. **Check the documentation** in `.claude/` folder
2. **Search the code** for similar implementations
3. **Ask an AI assistant** (reference this CLAUDE.md + appropriate doc)

---

**Status:** ✅ Production-Ready, Interview-Grade
**Last Updated:** 2026-03-15
**Architecture:** Feature-based, fully tested, containerized
**Test Coverage:** 102 tests, 90%+ on core logic
**Bundle Size:** 94.17 kB gzip (target: <100 kB)
