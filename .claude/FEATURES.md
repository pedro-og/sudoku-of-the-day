# Features — Current & Roadmap

## Current Features (MVP — Production Ready)

### Core Gameplay ✅
- **One puzzle per day** — Same puzzle for all users worldwide
- **9×9 Sudoku grid** — Standard Sudoku rules
- **Cell highlighting** — Row, column, 3×3 box, same digit
- **Conflict detection** — Highlights duplicate numbers in row/col/box
- **Tap/Click to select** — Mobile-friendly cell selection

### Input Methods ✅
- **Number buttons** — 1–9 with remaining count
- **Keyboard input** — Type numbers 1–9 directly
- **Arrow keys** — Navigate grid
- **Pencil mode (notes)** — Toggle with P key or button
- **Erase** — Backspace / Delete / 0 key
- **Undo** — Ctrl+Z / Cmd+Z (full history, reverts all state)

### Game Logic ✅
- **Mistake tracking** — 3 mistakes → game over
- **Instant feedback** — Wrong number reverts immediately
- **Completion detection** — Automatically detects solved puzzle
- **Game over screen** — Clear end state on 3 mistakes
- **Locked correct numbers** — Once a number is correct, it cannot be changed or erased

### Persistence ✅
- **localStorage** — All game progress saved locally
- **Resume on return** — Close tab, come back later → pick up where you left off
- **Same-day only** — Data persists for the current day only
- **Auto-cleanup** — Old puzzle saves are pruned

### User Experience ✅
- **Mobile-first design** — Optimized for phones and tablets
- **Responsive layout** — Works on all screen sizes
- **Large tap targets** — Easy to tap numbers and cells
- **Smooth animations** — Subtle transitions for feedback
- **Dark mode** — System detection + manual toggle
- **Light mode** — Clean, bright interface

### Localization ✅
- **English** — Default language
- **Portuguese (Brazil)** — Full translation
- **Spanish** — Full translation
- **Auto-detection** — Browser language → language selection

### Streak System ✅
- **Consecutive days** — Tracks longest & current streaks
- **Daily progress** — Displays 🔥 fire emoji with count
- **Reset on gap** — Missing one day resets current streak
- **localStorage persistence** — Survives browser close

### Sharing & Feedback ✅
- **Wordle-style sharing** — Copy result to clipboard
- **Puzzle number** — Tracks which day's puzzle
- **Stats included** — Mistakes, time, streak
- **Grid visualization** — 🟩 shows your complete work (no spoilers)

### Global Stats (Optional) ✅
- **Players today** — How many started today's puzzle
- **Solve rate** — Percentage who completed it
- **Average time** — Mean completion time
- **Supabase integration** — Optional; gracefully disabled if not configured

### Difficulty Calibration ✅
- **Medium difficulty** — 30 clues per puzzle
- **Unique solution guarantee** — Every puzzle has exactly one valid solution
- **Seeded generation** — Reproducible across all users

### Practice Mode ✅
- **Unlimited puzzles** — Generate infinite practice puzzles with deterministic seeding
- **No mistake limit** — Play at your own pace without game over conditions
- **Separate progression** — Practice puzzles don't affect streak tracking
- **Full feature parity** — Pencil mode, undo, highlights, all features available
- **Immediate access** — No time restrictions (unlike daily puzzles)

### Performance ✅
- **Bundle size** — 268 kB (85 kB gzip)
- **Fast load** — First paint < 1 second
- **Grid re-render** — < 50ms per cell click
- **Offline capable** — Works with zero backend

---

## Near-Term Roadmap (1–2 Months)

### Test Suite 📝
- [ ] Unit tests for `sudokuGenerator` — Verify reproducibility and uniqueness
- [ ] Unit tests for `useGameState` — All reducer actions
- [ ] Integration tests for `localGameStorage` — Persist + load cycles
- [ ] Component tests for SudokuGrid — Highlight logic
- [ ] E2E tests — Full game flow (play → complete → share)

### UI Refinements 🎨
- [ ] Keyboard shortcut hints (hover over toolbar buttons)
- [ ] Settings modal (language selector, difficulty slider)
- [ ] Tutorial / onboarding for new users
- [ ] Splash screen while puzzle generates
- [ ] Better "game over" animation

### Difficulty Selector 🎮
- [ ] Easy (40 clues) — Suitable for casual players
- [ ] Medium (30 clues) — Current default
- [ ] Hard (20 clues) — For experienced players
- [ ] Persist selected difficulty in localStorage
- [ ] **Practice mode difficulty selector** — Allow users to choose difficulty when playing practice puzzles

### Analytics 📊
- [ ] Track average completion times by difficulty
- [ ] Measure abandon rate (players who start but don't finish)
- [ ] User retention (% of players returning next day)
- [ ] A/B test difficulty level preferences

### Mobile App 📱
- [ ] Wrap with React Native / Capacitor
- [ ] App Store & Google Play distribution
- [ ] Push notifications (daily puzzle available)
- [ ] Home screen badge (days remaining in streak)

---

## Mid-Term Roadmap (2–6 Months)

### Multiplayer Features 👥
- [ ] **Live sessions** — Friends solve same puzzle together
- [ ] **WebSocket sync** — Real-time cell selection sharing
- [ ] **Leaderboard** — Rank players by speed
- [ ] **Invite links** — Share a link to play together

### Puzzle Archive 📚
- [ ] **Calendar view** — Click past dates to replay old puzzles
- [ ] **Deterministic re-generation** — Same seed → same puzzle always
- [ ] **Difficulty history** — See your performance over time
- [ ] **Statistics** — Personal best time, completion rate by difficulty

### Advanced Features 🧠
- [ ] **Hint system** — Reveal a random empty cell
- [ ] **Solving tips** — Show next logical deduction
- [ ] **Timer modes** — Speed run, casual, untimed
- [ ] **Custom puzzles** — Upload your own puzzles

### Monetization (Optional) 💰
- [ ] **Premium tier** — Additional hints, custom puzzles, ad-free
- [ ] **Cosmetics** — Custom cell colors, themes, emoji variants
- [ ] **Advertising** — Non-intrusive banner ads (free tier)

---

## Long-Term Vision (6+ Months)

### Variant Sudoku Modes 🔄
- [ ] **Jigsaw Sudoku** — Irregular box shapes
- [ ] **X Sudoku** — Diagonals also contain 1–9
- [ ] **Killer Sudoku** — Clues are sums instead of digits
- [ ] **Wordoku** — Numbers replaced with letters

### AI Opponent 🤖
- [ ] **Difficulty matching** — AI plays at your skill level
- [ ] **Puzzle generation** — Train a neural network on puzzle difficulty
- [ ] **Strategy suggestions** — AI hints at next move

### Social Features 🌐
- [ ] **User accounts** (optional) — Track progress across devices
- [ ] **Follow friends** — See their daily progress
- [ ] **Achievements** — Badges for milestones (100 puzzles solved, 30-day streak, etc.)
- [ ] **Discord integration** — Share completions to Discord

### Accessibility 🦾
- [ ] **Screen reader support** — Full ARIA labels
- [ ] **Keyboard-only mode** — No mouse required
- [ ] **High contrast theme** — For visually impaired users
- [ ] **Dyslexia-friendly font** — Option for OpenDyslexic font

### Offline App 📴
- [ ] **Service Worker** — Cache puzzles for offline play
- [ ] **Sync on return** — Upload results when back online
- [ ] **Airplane mode** — Full gameplay without connection

---

## Technical Debt & Maintenance

### Ongoing
- [ ] Keep React, TypeScript, Vite up-to-date
- [ ] Monitor Supabase for API changes
- [ ] Security audit (OWASP top 10)
- [ ] Performance monitoring (daily bundle size, FCP, CLS)
- [ ] User feedback loop (gather via email/surveys)

### Potential Future Improvements
- [ ] Migrate to Zustand or Jotai if state becomes more complex
- [ ] Add CSS-in-JS framework (Emotion, Styled Components) if theming becomes complex
- [ ] Switch to Tailwind if component count exceeds 100
- [ ] Add E2E testing framework (Playwright, Cypress) for CI/CD
- [ ] GraphQL client if data fetching becomes complex

---

## Feature Priorities by Impact

### High Impact, Low Effort ✅
- [x] Seeded daily puzzles
- [x] localStorage persistence
- [x] Streak tracking
- [x] Share button
- [x] Dark mode

### High Impact, Medium Effort 🚀
- [ ] Test suite (especially sudokuGenerator uniqueness)
- [ ] Mobile app (React Native)
- [ ] Puzzle archive
- [ ] Multiplayer sessions

### High Impact, High Effort 🏔️
- [ ] AI opponent
- [ ] User accounts & cloud sync
- [ ] Variant Sudoku modes

### Low Impact, Low Effort 🎯
- [ ] Keyboard shortcut hints
- [ ] Settings modal
- [ ] Additional themes

### Low Impact, High Effort 🚫
- [ ] Custom puzzle upload (security concerns)
- [ ] Full social network
- [ ] NFT integration (not planned)

---

## Decision Log

### Why Not Variant Sudoku Initially?
**Decision:** Focus on classic 9×9 Sudoku for launch.
- Classic Sudoku is most familiar to players.
- Variants would double development time.
- Can add variants later with modular puzzle generator.

### Why Not User Accounts?
**Decision:** Use localStorage entirely for MVP.
- No backend burden initially.
- Users concerned about privacy (no account = no tracking).
- Can add optional accounts later (opt-in for multi-device sync).

### Why No Ads or Paywalls?
**Decision:** Keep it free and clean.
- Ad-free experience drives user retention.
- Monetization (if needed) will be optional premium cosmetics, not core features.
- Ads would clutter the minimal UI.

### Why Supabase Over Firebase?
**Decision:** Supabase is PostgreSQL + REST (simpler).
- No vendor lock-in (can migrate DB later if needed).
- Pricing is transparent.
- REST API is easier to debug than Firebase.

---

## Community Feedback Loop

To gather user feedback:
1. **In-app survey** (after completing 5 puzzles)
2. **Email newsletter** (optional opt-in)
3. **Reddit/Twitter mentions** (monitor for feedback)
4. **User testing** (record videos of users playing)

Feedback sources will inform:
- Difficulty calibration
- Feature requests ranking
- UX pain points
- Mobile app requirements

---

## Success Metrics

### Engagement
- Daily active users (DAU)
- Puzzle completion rate
- Streak retention (% returning next day)
- Average session duration

### Quality
- Crash rate (should be near 0)
- Puzzle difficulty satisfaction (user survey)
- Share rate (% who share results)

### Performance
- Page load time (< 1s)
- Grid interaction latency (< 100ms)
- Bundle size growth (track every release)

### Growth
- Month-over-month user growth
- Platform distribution (mobile vs desktop)
- Geographic distribution (which countries)

---

## Contributing

When implementing features:
1. **Reference this roadmap** — Ensure alignment with vision
2. **Read REACT_BEST_PRACTICES.md** — Follow senior patterns
3. **Add tests** — Use Vitest, follow TDD
4. **Update i18n** — Add any new UI strings to all 3 languages
5. **Document** — Update .claude/ docs if architecture changes

---

## Questions?

See:
- **CONTEXT.md** — Overview & core principles
- **ARCHITECTURE.md** — Technical deep dives
- **DEVELOPMENT.md** — How to run locally & debug
- **REACT_BEST_PRACTICES.md** — Code standards
