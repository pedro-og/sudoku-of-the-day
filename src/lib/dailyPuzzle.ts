import { createSeededRandom } from './seededRandom';
import { generatePuzzle, type GeneratedPuzzle } from './sudokuGenerator';

const LAUNCH_DATE = '2026-01-01';
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
export function getBrazilDateString(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function getPuzzleNumber(dateStr: string): number {
  const [ly, lm, ld] = LAUNCH_DATE.split('-').map(Number);
  const [dy, dm, dd] = dateStr.split('-').map(Number);
  const launch = Date.UTC(ly, lm - 1, ld);
  const current = Date.UTC(dy, dm - 1, dd);
  return Math.floor((current - launch) / 86_400_000) + 1;
}

export function getDailyPuzzle(): GeneratedPuzzle & { dateStr: string; puzzleNumber: number } {
  const dateStr = getBrazilDateString();
  const random = createSeededRandom(dateStr);
  const puzzle = generatePuzzle(random, 30);
  const puzzleNumber = getPuzzleNumber(dateStr);
  return { ...puzzle, dateStr, puzzleNumber };
}

export function getPracticePuzzle(): GeneratedPuzzle {
  const seed = `practice-${Date.now()}-${Math.random()}`;
  const random = createSeededRandom(seed);
  return generatePuzzle(random, 40);
}
