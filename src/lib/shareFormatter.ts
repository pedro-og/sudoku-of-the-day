import type { ShareData } from '../types';

interface ShareTextLabels {
  title: string;
  mistake: string;
  mistakes: string;
  time: string;
  domain: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function buildGrid(data: ShareData): string {
  const rows: string[] = [];
  for (let r = 0; r < 9; r++) {
    let row = '';
    for (let c = 0; c < 9; c++) {
      const val = data.board[r][c];
      if (val === 0) {
        row += '⬜';
      } else if (val === data.solution[r][c]) {
        row += '🟩';
      } else {
        row += '🟥';
      }
    }
    rows.push(row);
  }
  return rows.join('\n');
}

export function buildShareText(data: ShareData, labels: ShareTextLabels): string {
  const grid = buildGrid(data);
  const mistakeLabel = data.mistakes === 1 ? `${labels.mistake}: 1` : `${labels.mistakes}: ${data.mistakes}`;
  const time = formatTime(data.elapsedSeconds);

  return [
    `${labels.title} #${data.puzzleNumber}`,
    '',
    grid,
    '',
    mistakeLabel,
    `${labels.time}: ${time}`,
    `🔥 Streak: ${data.streak}`,
    '',
    labels.domain,
  ].join('\n');
}

export async function copyShareText(data: ShareData, labels: ShareTextLabels): Promise<boolean> {
  const text = buildShareText(data, labels);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}
