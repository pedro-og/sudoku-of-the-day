# 🎮 Sudoku of the Day

Hey! Welcome to **Sudoku of the Day** — a daily Sudoku puzzle game I created for myself and my friends.

🎮 **[Play now at sudoku-of-the-day.com](https://sudoku-of-the-day.com)**

## 🧠 Why Sudoku?

Sudoku has been a game-changer for me personally. It's helped train my focus, sharpen my attention, and boost my memory. More importantly, it's given me a healthy reason to take a break from screens — a refreshing alternative to endless scrolling on social media and other dopamine-driven apps.

## 🚀 This Project

This side project emerged from my desire to **test and apply technologies I'm enthusiastic about** — like React, TypeScript, and deterministic puzzle generation — while building something I could actually *ship end-to-end*.

It's a small, focused project built to play with my close circle of Sudoku enthusiasts. I don't have grand ambitions for it to become massive, but I do want to keep playing it daily and maintain it as a solid, reliable companion for my friends and I.

## ✨ Features

- **One puzzle per day** — Same puzzle for everyone, worldwide (seeded by date in Brazil timezone)
- **No login required** — Entirely local, no sign-up friction
- **Streak tracking** — Keep your winning streak alive
- **Dark/light theme** — Adapts to your preference
- **Responsive design** — Play on desktop, tablet, or mobile
- **Keyboard-first** — Lightning-fast input (1-9, arrows, P for pencil mode)
- **Share your result** — Wordle-style sharing without spoilers
- **Optional stats** — Send your stats to Supabase if you want (optional)
- **Multi-language** — English, Portuguese, Spanish, Chinese, French and more

## 🛠️ Tech Stack

- **React 18** + TypeScript
- **Vite** for fast builds
- **i18next** for translations
- **CSS Variables** for theming
- **localStorage** for persistence
- **Supabase** for optional global stats

## 🎯 Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Opens http://localhost:5173
```

Done! Start solving. (Auto-deployed to production on every push to main).

## 📖 How to Play

1. **Click a cell** to select it
2. **Type 1–9** to enter numbers
3. **Press P** for pencil mode (notes)
4. **Ctrl+Z** to undo
5. **Complete** and see your stats

## 📁 Project Structure

```
src/
├── lib/          ← Puzzle logic, validation, storage
├── hooks/        ← Game state management
├── components/   ← UI components
├── types/        ← TypeScript definitions
├── i18n/         ← Translations
└── App.tsx       ← Root component
```

For deep dives, check out [`.claude/README.md`](./.claude/README.md) (AI-first documentation).

## ☕ Support

If you enjoy this project and want to support my work, you can buy me a coffee:

**[Coffee link coming soon]** ☕

## 🤝 Contributing

Found a bug? Have a suggestion? Feel free to open an issue or reach out!

---

**Made with ❤️ for puzzle lovers everywhere.**

*One puzzle per day, every day.*
