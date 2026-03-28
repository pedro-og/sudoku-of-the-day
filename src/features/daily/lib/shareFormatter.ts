import type { ShareData } from '@/types';

interface ShareTextLabels {
  title: string;
  mistake: string;
  mistakes: string;
  time: string;
  streak: string;
  percentile: string;
  domain: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function buildShareText(data: ShareData, labels: ShareTextLabels): string {
  const time = formatTime(data.elapsedSeconds);
  const mistakeEmoji = data.mistakes === 0 ? '💎' : '🟥';
  const mistakeLabel = data.mistakes === 1
    ? `${labels.mistake}: 1 ${mistakeEmoji}`
    : `${labels.mistakes}: ${data.mistakes}/3 ${mistakeEmoji}`;

  const lines = [
    `${labels.title} #${data.puzzleNumber}`,
    '',
    `${labels.time}: ${time} 🕐`,
  ];

  if (data.percentile != null) {
    lines.push(`${labels.percentile.replace('{{percent}}', String(data.percentile))} ⚡`);
  }

  lines.push(mistakeLabel);
  lines.push(`${labels.streak}: ${data.streak} 🔥`);
  lines.push('');
  lines.push(labels.domain);

  return lines.join('\n');
}

export async function copyShareText(data: ShareData, labels: ShareTextLabels): Promise<boolean> {
  const text = buildShareText(data, labels);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
