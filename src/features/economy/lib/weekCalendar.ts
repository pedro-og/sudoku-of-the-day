import type { WeekDayStatus } from '@/types';

const DAY_MS = 86_400_000;

function toUTC(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function toDateStr(utc: number): string {
  const d = new Date(utc);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** ISO weekday: Monday = 0 … Sunday = 6. */
function isoWeekdayIndex(utc: number): number {
  // getUTCDay: Sunday = 0 … Saturday = 6
  return (new Date(utc).getUTCDay() + 6) % 7;
}

/** Returns the 7 date strings (Mon→Sun) of the week containing `todayStr`. */
export function getWeekDates(todayStr: string): string[] {
  const todayUTC = toUTC(todayStr);
  const monday = todayUTC - isoWeekdayIndex(todayUTC) * DAY_MS;
  return Array.from({ length: 7 }, (_, i) => toDateStr(monday + i * DAY_MS));
}

export interface WeekCalendarInput {
  /** Today's date (Brazil) as YYYY-MM-DD. */
  todayStr: string;
  /** Dates the player completed (YYYY-MM-DD). */
  completedDates: Set<string>;
  /** Dates a streak freeze was consumed (YYYY-MM-DD). */
  frozenDates: Set<string>;
}

/**
 * Pure: computes the Mon→Sun status strip for the current week.
 * - 'done'   → completed that day
 * - 'frozen' → streak freeze consumed that day
 * - 'missed' → a past/today day with neither
 * - 'future' → day still ahead this week
 */
export function getWeekStatuses(input: WeekCalendarInput): WeekDayStatus[] {
  const { todayStr, completedDates, frozenDates } = input;
  const todayUTC = toUTC(todayStr);

  return getWeekDates(todayStr).map((dateStr) => {
    if (completedDates.has(dateStr)) return 'done';
    if (frozenDates.has(dateStr)) return 'frozen';
    return toUTC(dateStr) > todayUTC ? 'future' : 'missed';
  });
}

/** True when every elapsed day of the week is done or frozen (used for the
 * perfect-week bonus, evaluated when the last day of the week is filled). */
export function isPerfectWeek(statuses: WeekDayStatus[]): boolean {
  return statuses.every((s) => s === 'done' || s === 'frozen');
}
