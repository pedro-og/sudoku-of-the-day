import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n'; // initialize i18next before rendering
import App from './App.tsx';

// Prevent unwanted zoom on mobile browsers when interacting with small-text
// elements (pencil-mark notes). Modern browsers ignore the viewport meta tag's
// maximum-scale for accessibility reasons, so we counter the zoom at runtime.

// 1. Block Safari's proprietary gesture events (pinch-to-zoom on page)
document.addEventListener('gesturestart', (e) => e.preventDefault());

// 2. Use Visual Viewport API to reset scroll offset caused by auto-zoom
if (window.visualViewport) {
  let lastScale = 1;
  window.visualViewport.addEventListener('resize', () => {
    const vv = window.visualViewport!;
    if (vv.scale !== lastScale && vv.scale > 1) {
      // Browser zoomed in — scroll back to neutralize the offset
      window.scrollTo(0, 0);
    }
    lastScale = vv.scale;
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
