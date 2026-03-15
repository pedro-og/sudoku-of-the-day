# AI-First Documentation Hub

Welcome to Daily Sudoku! This folder contains comprehensive documentation designed to be read and understood by both humans and AI assistants.

## 📖 Documentation Files

### 1. **CONTEXT.md** — Start Here 🚀
**Purpose:** High-level overview, core principles, and project philosophy.

**Read this to understand:**
- What the project is and why it exists
- Core design principles (deterministic generation, local-first, separation of concerns)
- Data flow and reactive patterns
- File organization
- Performance considerations
- Testing strategy (TDD mindset)
- Error handling and graceful degradation

**Audience:** Anyone new to the project, AI assistants, new team members.

**Reading time:** 15–20 minutes.

---

### 2. **ARCHITECTURE_NEW.md** — Technical Deep Dives 🏗️
**Purpose:** Updated feature-based architecture (March 2026 refactor) with detailed design decisions.

**Read this to understand:**
- Feature-based folder structure (src/features/, src/shared/)
- Why we chose a reducer over Context API
- Puzzle generation pipeline (seeded PRNG → backtracking → uniqueness check)
- Conflict detection, highlighting, undo system, mistake tracking
- Theme system (CSS variables), localStorage persistence, Supabase integration
- Type safety philosophy and discriminated unions
- Path aliases for clean imports

**Audience:** Developers implementing features, AI assistants writing code, technical architects.

**Reading time:** 20–30 minutes.

---

### 3. **PATTERNS.md** — Code Examples & Patterns 💻
**Purpose:** Concrete implementation patterns with real code examples from the codebase.

**Read this for:**
- Reducer pattern (game state management)
- Hook patterns (useGameState, useTheme, etc.)
- Component patterns (feature-based structure)
- Test patterns (Vitest + React Testing Library)
- localStorage persistence patterns
- CSS Modules & theming patterns
- Keyboard input handling
- Real examples from src/ folder

**Audience:** Developers writing code, code reviewers, newcomers learning patterns.

**Reading time:** 20–25 minutes.

---

### 4. **REACT_BEST_PRACTICES.md** — Senior-Level Standards 🥇
**Purpose:** Production-grade React patterns and code quality standards.

**Read this before writing any code:**
- Component architecture (one responsibility, props over context)
- State management (reducer vs useState, derived state, immutability)
- Memoization (when to use React.memo, useCallback, useMemo)
- Effects & cleanup (minimal dependencies, proper cleanup)
- Error handling (graceful degradation, validation at boundaries)
- Performance profiling and optimization
- Testing strategy (behavior over implementation)
- Code style (explicit naming, comments for "why")
- TypeScript best practices (strict mode, discriminated unions, avoid `any`)

**Audience:** All developers, code reviewers, AI assistants writing code.

**Reading time:** 30–40 minutes.

**Must-read sections:** 1–4 (component architecture, state management, memoization, effects).

---

### 5. **TESTING.md** — How to Test 🧪
**Purpose:** Comprehensive guide to running tests, test types, patterns, and debugging.

**Read this to:**
- Run tests locally (`npm run test`, `npm run test:run`, `npm run test:coverage`)
- Understand test types (unit, integration, component, snapshot)
- Learn testing patterns (AAA, behavior-focused, edge cases, mocking)
- Debug failed tests (timeouts, mismatches, random failures)
- Check coverage reports
- Write new tests (templates, best practices)
- Pre-commit checklist

**Current test suite:** 102 tests, 90%+ coverage on core logic, CI/CD integrated

**Audience:** All developers, QA engineers, CI/CD maintainers.

**Reading time:** 15–20 minutes for overview; 5–10 minutes per section.

---

### 6. **DEVELOPMENT.md** — Running Locally & Contributing 👨‍💻
**Purpose:** Practical guide to setting up, running, debugging, and extending the project.

**Read this to:**
- Set up the project locally (`npm install`, `npm run dev`)
- Understand the dev server (hot reload at localhost:5173)
- Learn available npm scripts
- Get a code walkthrough (puzzle generation, game state, highlighting)
- Add new features step-by-step
- Debug using browser console, React DevTools, Performance tab
- Profile performance and identify bottlenecks
- Build for production and deploy

**Audience:** Developers working on features, CI/CD engineers, deployers.

**Reading time:** 20–25 minutes for setup; 5–10 minutes per task.

---

### 7. **FEATURES.md** — Current & Roadmap 🗺️
**Purpose:** Catalog of implemented features, planned roadmap, and prioritization.

**Read this to:**
- See what's already built (MVP checklist)
- Understand the vision for next phases (1-2 months, 2-6 months, 6+ months)
- Learn feature priorities (high/medium/low effort vs impact)
- Review decision log (why certain features were chosen/deferred)
- See success metrics
- Contribute aligned with project goals

**Audience:** Product managers, AI assistants suggesting features, new contributors, stakeholders.

**Reading time:** 10–15 minutes for high-level overview; 5 minutes per roadmap phase.

---

## 🔄 Typical Workflows

### For AI Assistants Writing New Code
1. **Start with CONTEXT.md** — Understand principles
2. **Read ARCHITECTURE_NEW.md** — Know the feature-based structure
3. **Review PATTERNS.md** — See concrete code examples
4. **Follow REACT_BEST_PRACTICES.md** — Apply patterns while coding
5. **Reference TESTING.md** — Add tests alongside code

### For New Developers Onboarding
1. **DEVELOPMENT.md** → Get project running locally
2. **CONTEXT.md** → Understand the big picture
3. **ARCHITECTURE_NEW.md** → Learn the feature-based folder structure
4. **REACT_BEST_PRACTICES.md** → Code standards before your first PR
5. **PATTERNS.md** → Study real code examples from src/

### For Feature Implementation
1. **Check FEATURES.md** → Confirm feature is in roadmap
2. **ARCHITECTURE_NEW.md** → Understand where it lives (src/features/x)
3. **PATTERNS.md** → Find similar implementations to reference
4. **REACT_BEST_PRACTICES.md** → Apply patterns while coding
5. **TESTING.md** → Write tests alongside code
6. **Run locally** → `npm run dev`, test in browser

### For Writing Tests
1. **TESTING.md** — Commands, test types, patterns
2. **PATTERNS.md** — See real test examples from codebase
3. **Create test file** → Use template from TESTING.md
4. **Run `npm run test`** — Watch mode development
5. **Coverage report** → `npm run test:coverage` to identify gaps

### For Bug Fixes
1. **DEVELOPMENT.md** — "Debugging Tips" section
2. **ARCHITECTURE_NEW.md** — Understand the subsystem with the bug
3. **Write test first** — Verify the bug exists (TESTING.md)
4. **Fix the code** — Make test pass
5. **Run full suite** — `npm run test:run` to ensure no regressions

---

## 🎯 Quick Reference

### Project Goals
✅ One Sudoku puzzle per day for all users worldwide
✅ Seeded generation (deterministic, reproducible)
✅ Local-first (no login required)
✅ Graceful degradation (works without Supabase)
✅ Mobile-first responsive design
✅ Production-ready MVP

### Core Technologies
- React 18 + TypeScript
- Vite (build tool)
- i18next (translations)
- Supabase (optional stats backend)
- CSS variables (theming)
- localStorage (persistence)

### Key Principles
1. **Deterministic** — Same seed → same puzzle every time
2. **Local-first** — No login, all data in browser
3. **Graceful degradation** — Works with minimal dependencies
4. **Type-safe** — TypeScript strict mode
5. **Performance** — < 100 kB bundle, < 1s first paint
6. **Accessibility** — Keyboard-first, high contrast support planned
7. **Testable** — Pure functions, reducer pattern, modular

### File Organization (Post-Refactor)
```
src/
├── features/          ← Feature modules (feature-based architecture)
│   ├── game/         ← Core Sudoku logic (components, hooks, lib)
│   ├── daily/        ← Daily puzzle feature
│   ├── practice/     ← Unlimited practice mode
│   └── theme/        ← Dark/light theme
├── shared/           ← Reusable primitives (components, hooks, lib)
├── types/            ← Central type definitions
├── i18n/             ← Translations
.claude/              ← This documentation
```

### Deployment
```bash
npm run build     # Compile to /dist
npm run preview   # Test production build locally
vercel            # Deploy to Vercel (one command)
```

---

## 📝 Test Strategy (TDD)

When you implement a feature:
1. **Write test first** (describe the behavior)
2. **Implement code** (make test pass)
3. **Refactor** (improve without breaking test)

Example test structure:
```typescript
describe('sudokuGenerator', () => {
  test('same seed generates same puzzle', () => {
    const p1 = generatePuzzle(createSeededRandom('2026-03-06'));
    const p2 = generatePuzzle(createSeededRandom('2026-03-06'));
    expect(p1.puzzle).toEqual(p2.puzzle);
  });

  test('generated puzzle has unique solution', () => {
    const puzzle = generatePuzzle(createSeededRandom('2026-03-06'));
    expect(countSolutions(puzzle)).toBe(1);
  });
});
```

---

## 🚀 Next Steps

### For Getting Started
1. **Clone repo** and run `npm install`
2. **Run dev server:** `npm run dev`
3. **Read DEVELOPMENT.md** for debugging tips
4. **Open http://localhost:5173** in browser

### For Making Changes
1. **Read REACT_BEST_PRACTICES.md** first
2. **Reference ARCHITECTURE.md** for the subsystem you're modifying
3. **Follow the code walkthrough** in DEVELOPMENT.md
4. **Write tests** (when ready)
5. **Check code review checklist** before submitting

### For Understanding Decisions
- **Why did we choose X over Y?** → See ARCHITECTURE.md or FEATURES.md decision log
- **What's the coding standard?** → REACT_BEST_PRACTICES.md
- **How does feature X work?** → ARCHITECTURE.md or DEVELOPMENT.md code walkthrough

---

## 💡 Pro Tips for AI Assistants

### Before Generating Code
1. **Check REACT_BEST_PRACTICES.md** — Know the patterns
2. **Understand the types** — Read src/types/index.ts
3. **Know the data flow** — Review ARCHITECTURE.md "High-Level Data Flow" section
4. **Check existing code** — Look for similar implementations

### When You're Unsure
1. **Reference CONTEXT.md** core principles
2. **Ask in code comments** — Explain your reasoning
3. **Add tests** — Behavior is clearer than comments
4. **Keep it simple** — The simplest code is the best code

### When Refactoring
1. **Don't break the contract** — Keep public APIs the same
2. **Add tests first** — Green before refactoring
3. **Update documentation** — If behavior changes
4. **Profile before/after** — Ensure you didn't make it slower

---

## 📚 External Resources

- **React docs:** https://react.dev
- **TypeScript handbook:** https://www.typescriptlang.org/docs
- **Vite docs:** https://vite.dev
- **i18next docs:** https://www.i18next.com
- **Supabase docs:** https://supabase.com/docs

---

## 🤝 Contributing

1. **Pick a feature from FEATURES.md roadmap**
2. **Create a branch:** `git checkout -b feature/name`
3. **Follow REACT_BEST_PRACTICES.md**
4. **Write tests** before code (TDD)
5. **Run `npm run build`** to check for errors
6. **Submit PR** with description from FEATURES.md

---

## ❓ FAQ

**Q: How do I run the project locally?**
A: See DEVELOPMENT.md "Quick Start" section or run `npm run dev`.

**Q: What's the code style?**
A: See REACT_BEST_PRACTICES.md + PATTERNS.md (real examples).

**Q: How do I add a new feature?**
A: Check FEATURES.md, read ARCHITECTURE_NEW.md, follow PATTERNS.md examples.

**Q: How do I run tests?**
A: See TESTING.md quick summary: `npm run test` (watch) or `npm run test:run` (once).

**Q: Why is the puzzle the same for everyone?**
A: See CONTEXT.md "Core Principles" (Deterministic Everything).

**Q: How do I enable Supabase stats?**
A: See .env.example, then ARCHITECTURE_NEW.md "Supabase Integration" section.

**Q: What should I read first?**
A: CONTEXT.md — gives you the 30,000-foot view in 15 minutes.

**Q: Where is the code organized?**
A: Feature-based: src/features/ (game, daily, practice, theme) + src/shared/. See ARCHITECTURE_NEW.md.

---

## 📞 Questions?

Refer to the appropriate documentation file:
- **"How do I...?"** → DEVELOPMENT.md
- **"How do I test...?"** → TESTING.md
- **"Why did we choose...?"** → ARCHITECTURE_NEW.md or FEATURES.md
- **"What's the standard for...?"** → REACT_BEST_PRACTICES.md
- **"Show me an example"** → PATTERNS.md
- **"What's the big picture?"** → CONTEXT.md
- **"Is this feature planned?"** → FEATURES.md

---

**Last Updated:** 2026-03-15
**Status:** AI-First, Production-Ready, Feature-Based Architecture
**Test Coverage:** 102 tests, 90%+ on core logic
**Bundle Size:** 94.17 kB gzip (target: < 100 kB)
