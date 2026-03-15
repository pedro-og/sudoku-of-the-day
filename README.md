# 🎮 Sudoku of the Day — Interview-Grade Portfolio Project

Welcome to **Sudoku of the Day** — a production-ready, daily Sudoku puzzle game showcasing modern React architecture, testing discipline, and DevOps best practices.

🎮 **[Play now](https://sudoku-of-the-day.com)**

---

## ✨ What Makes This Different

This isn't a typical side project. It demonstrates **professional software engineering practices**:

### 🏗️ **Architecture**
- Feature-based folder structure (not by-type)
- Separation of concerns (components, hooks, pure functions)
- Path aliases for clean imports
- Explicit public APIs with barrel exports

### 🧪 **Testing & Quality**
- **102 comprehensive tests** (90%+ coverage on business logic)
- Vitest + React Testing Library
- CI/CD **blocks deployment** if tests fail
- TypeScript strict mode throughout

### 🚀 **DevOps & Deployment**
- GitHub Actions CI/CD pipeline
- Docker containerization
- Automated GitHub Pages deployment
- Performance monitoring (94.17 kB gzip)

### 📚 **Documentation**
- 7 comprehensive guides in `.claude/` folder
- Concrete code examples for every pattern
- Architecture decision records
- Step-by-step contributor workflow

---

## 📊 Quick Stats

| Metric | Value |
|--------|-------|
| Tests | 102 (90%+ coverage) |
| Bundle Size | 94.17 kB gzip ✅ |
| CSS Size | 3.41 kB gzip ✅ |
| Build Time | ~500ms |
| Test Time | ~1s |
| Components | 19 total |
| Custom Hooks | 12 |
| Pure Functions | 20+ |

---

## 🚀 Quick Start

```bash
# Setup
nvm install 22 && nvm use 22
npm install

# Develop
npm run dev                # http://localhost:5173

# Test & Deploy
npm run test:run           # Must pass before deploy
npm run build              # Production bundle
```

---

## 🎮 Features

### Core Gameplay
- ✅ Daily puzzle (seeded by Brazil timezone date)
- ✅ Full undo history (reverts board, notes, mistakes)
- ✅ 3-mistake limit → game over
- ✅ Conflict detection & smart highlighting
- ✅ Keyboard shortcuts (1-9, arrows, P for pencil, Z for undo)
- ✅ Fast-fill mode (auto-complete when possible)
- ✅ Pencil mode for notes

### User Experience
- ✅ Mobile-first responsive design
- ✅ Dark/light theme (OS auto-detection)
- ✅ Multi-language (EN, PT, ES)
- ✅ Smooth animations & transitions
- ✅ Wordle-style result sharing
- ✅ Streak tracking across days

### Architecture
- ✅ Feature-based folder structure
- ✅ Reducer pattern for game state
- ✅ Custom hooks for logic extraction
- ✅ Pure functions in lib/ (100% testable)
- ✅ CSS Modules (zero inline styles)
- ✅ Optional Supabase stats

---

## 📂 Architecture

```
src/
├── features/              # Feature-based modules
│   ├── game/             # Core Sudoku logic
│   │   ├── components/     SudokuGrid, SudokuCell, NumberPad, GameToolbar
│   │   ├── hooks/          useGameState, useKeyboardControls, useFastFill
│   │   └── lib/            sudokuGenerator, sudokuValidator, completionDetector
│   │
│   ├── daily/            # Daily challenge feature
│   │   ├── components/     GameOverlay, StreakDisplay, DailyStatsPanel
│   │   ├── hooks/          useGamePersistence
│   │   └── lib/            dailyPuzzle, streakTracker, statsApi, shareFormatter
│   │
│   ├── practice/         # Unlimited practice mode
│   └── theme/            # Dark/light theme
│
├── shared/               # Reusable primitives
│   ├── components/         Modal, Button, StatCard, Icons
│   ├── hooks/              useCountdown
│   └── lib/                formatTime, localGameStorage, seededRandom
│
├── types/                # Central TypeScript definitions
├── i18n/                 # Translations
├── test/                 # Global test setup
└── App.tsx               # Root component
```

**Why feature-based?** Scales better with team size, easier to understand feature boundaries, reduces cross-feature dependencies.

---

## 🧪 Testing

### Coverage

- ✅ **Game logic** — Puzzle generation, validation, conflict detection (30+ tests)
- ✅ **Game state** — Reducer actions, undo, completion (40+ tests)
- ✅ **Utilities** — localStorage, seeded PRNG, formatting (20+ tests)
- ✅ **Integration** — Persistence, streak tracking, stats (12+ tests)

### Running Tests

```bash
npm run test              # Watch mode
npm run test:run         # Run once (CI)
npm run test:coverage    # Coverage report
```

### CI/CD Integration

```
Push to main
    ↓
GitHub Actions CI runs
    ├─ TypeScript check ✅
    ├─ Run 102 tests ✅
    ├─ Build production ✅
    └─ Deploy to GitHub Pages ✅

If ANY test fails → ❌ Deployment blocked
```

---

## 📚 Documentation

Comprehensive guides in `.claude/` folder:

| Document | Purpose | Time |
|----------|---------|------|
| [README.md](./.claude/README.md) | Doc index & workflows | 5 min |
| [CONTEXT.md](./.claude/CONTEXT.md) | High-level overview | 15 min |
| [ARCHITECTURE_NEW.md](./.claude/ARCHITECTURE_NEW.md) | Feature-based structure | 25 min |
| [PATTERNS.md](./.claude/PATTERNS.md) | Code examples & patterns | 30 min |
| [REACT_BEST_PRACTICES.md](./.claude/REACT_BEST_PRACTICES.md) | Senior React standards | 40 min |
| [DEVELOPMENT.md](./.claude/DEVELOPMENT.md) | Local setup & debugging | 20 min |
| [FEATURES.md](./.claude/FEATURES.md) | Features & roadmap | 15 min |

**New since March 2026:**
- [ARCHITECTURE_NEW.md](./.claude/ARCHITECTURE_NEW.md) — Complete refactoring to feature-based structure
- [PATTERNS.md](./.claude/PATTERNS.md) — Concrete implementation examples

---

## 🏗️ Tech Stack

**Frontend:**
- React 19 + TypeScript 5.9 (strict mode)
- Vite 7.3 (fast HMR, <1s)
- CSS Modules + CSS variables
- i18next (translations)

**Testing:**
- Vitest (102 tests, unit/integration)
- React Testing Library (component testing)
- jsdom (DOM environment)

**DevOps:**
- GitHub Actions (CI/CD pipeline)
- Docker (multi-stage build + nginx)
- Nginx (SPA routing, gzip, security headers)

**Bundle Performance:**
- JS: 292.84 kB → 94.17 kB gzip ✅
- CSS: 13.26 kB → 3.41 kB gzip ✅
- **Total: ~98 kB gzip** (target: <100 kB)

---

## 🤝 Contributing

### Getting Started

1. **Read documentation** (choose your path)
   - For architecture: [ARCHITECTURE_NEW.md](./.claude/ARCHITECTURE_NEW.md)
   - For code examples: [PATTERNS.md](./.claude/PATTERNS.md)
   - For React standards: [REACT_BEST_PRACTICES.md](./.claude/REACT_BEST_PRACTICES.md)

2. **Set up locally**
   ```bash
   npm install && npm run dev
   ```

3. **Pick a feature** from [FEATURES.md](./.claude/FEATURES.md) roadmap

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
# Write tests alongside code
# Follow patterns in PATTERNS.md

# Verify before submitting
npx tsc --noEmit      # Type check
npm run test:run      # All tests pass
npm run build         # Build succeeds

# Push & create PR
git push origin feature/my-feature
```

### Code Standards

- ✅ TypeScript strict mode (no `any`)
- ✅ CSS Modules only (no inline styles)
- ✅ Tests for business logic
- ✅ Feature-based folder structure
- ✅ Explicit public APIs (barrel exports)
- ✅ Descriptive commits

---

## 🐛 How to Play

1. **Click a cell** to select it
2. **Type 1–9** to enter numbers
3. **Press P** for pencil mode (notes)
4. **Press Backspace** to erase
5. **Press Ctrl+Z** to undo
6. **Complete** and see your stats

---

## 🚀 Deployment

### GitHub Pages (Automated)

Push to `main` → GitHub Actions runs CI/CD → Tests must pass → Deploy to GitHub Pages

```bash
# One-time setup (add to GitHub)
Settings → Pages → Build from ./dist
```

### Local Docker

```bash
docker-compose up
# Open http://localhost:3000
```

---

## 📈 Performance Targets (All Met ✅)

| Metric | Target | Actual |
|--------|--------|--------|
| Bundle | < 100 kB | 94.17 kB |
| CSS | < 5 kB | 3.41 kB |
| First paint | < 1s | ~500ms |
| Grid re-render | < 50ms | ~10ms |
| Puzzle generation | < 5s | ~3s |
| Test suite | < 2s | ~1s |

---

## ❓ FAQ

**Q: Why feature-based folder structure?**
A: Scales better, easier to understand feature boundaries, reduces cross-feature imports.

**Q: Why CSS Modules instead of Tailwind?**
A: Full control, smaller bundle, scoped styling, suits project scope.

**Q: Why Vitest instead of Jest?**
A: Faster, Vite-native, better ESM support, modern patterns.

**Q: How do I add a new feature?**
A: Read [PATTERNS.md](./.claude/PATTERNS.md) for step-by-step guide.

**Q: How often can I play?**
A: Once per day. Puzzle resets at midnight São Paulo time.

**Q: Is my data secure?**
A: Yes. Everything is browser localStorage. No servers see your progress (unless you enable Supabase).

---

## 🎯 What Makes This Portfolio-Grade

✅ **Full-Stack Thinking**
- Frontend architecture (React + TypeScript)
- Testing discipline (102 tests)
- DevOps & deployment (GitHub Actions, Docker)
- Documentation (7 comprehensive guides)

✅ **Production Readiness**
- Performance targets met
- Error handling & edge cases
- Type safety throughout
- CI/CD blocks bad code

✅ **Real-World Practices**
- Feature-based structure
- Separation of concerns
- Reusable components & hooks
- Code review standards

✅ **Interview-Friendly**
- Easy to understand
- Well-documented decisions
- Concrete examples
- Problem-solving showcase

---

## ☕ Support

If you enjoy this project, consider starring it on GitHub!

---

## 🤝 Contributing

Found a bug? Have a feature idea? Open an issue or submit a PR!

---

**Built with ❤️ as a portfolio project showcasing modern React architecture, testing culture, and DevOps practices.**

*One puzzle per day, every day.*

---

Last Updated: **March 15, 2026**
