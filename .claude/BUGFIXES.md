# Bugfixes

## Mobile Auto-Zoom on Notes Input (2026-03-15)

**Problem:** On mobile devices (both Safari and Chrome), tapping a cell to insert a pencil-mark note triggered an unwanted browser zoom, cutting off numbers at the bottom of the screen.

**Root Cause:** Mobile browsers auto-zoom when interacting with elements containing small font sizes (the notes grid uses `clamp(7px, 1.4vw, 10px)`). Modern browsers ignore the viewport meta tag's `maximum-scale` for accessibility reasons.

**Fix (multi-layered):**
1. `touch-action: manipulation` on `<html>` — disables double-tap zoom
2. `gesturestart` event prevention — blocks Safari pinch-to-zoom
3. Visual Viewport API listener — resets scroll offset if zoom escapes
4. `font-size: 16px` on note cells — stays above the auto-zoom threshold
5. `overflow: hidden` on cells — prevents layout recalculation from NotesGrid

**Files changed:**
- `src/index.css` — added `touch-action: manipulation`
- `src/main.tsx` — added gesture and Visual Viewport listeners
- `src/components/SudokuCell.tsx` — added `font-size: 16px` for note cells, `overflow: hidden`
