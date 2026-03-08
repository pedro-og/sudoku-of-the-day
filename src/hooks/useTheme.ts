import { useState, useEffect } from 'react';
import { saveTheme, loadTheme } from '../lib/localGameStorage';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 1. User's saved preference
    const saved = loadTheme();
    if (saved) return saved;
    // 2. System preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply to DOM on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for OS theme changes (only if user hasn't set a preference)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!loadTheme()) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function toggleTheme() {
    setThemeState(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      saveTheme(next);
      return next;
    });
  }

  return { theme, toggleTheme };
}
