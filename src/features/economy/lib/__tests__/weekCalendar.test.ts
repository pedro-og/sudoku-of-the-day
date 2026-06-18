import { getWeekDates, getWeekStatuses, isPerfectWeek } from '../weekCalendar';

describe('getWeekDates', () => {
  it('returns Mon→Sun for a midweek date', () => {
    // 2026-06-17 is a Wednesday
    expect(getWeekDates('2026-06-17')).toEqual([
      '2026-06-15', '2026-06-16', '2026-06-17',
      '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21',
    ]);
  });

  it('keeps Sunday in the same (current) week', () => {
    // 2026-06-21 is a Sunday → last slot
    const week = getWeekDates('2026-06-21');
    expect(week[0]).toBe('2026-06-15');
    expect(week[6]).toBe('2026-06-21');
  });

  it('keeps Monday as the first slot', () => {
    expect(getWeekDates('2026-06-15')[0]).toBe('2026-06-15');
  });
});

describe('getWeekStatuses', () => {
  const todayStr = '2026-06-17'; // Wednesday

  it('marks done, frozen, missed and future correctly', () => {
    const statuses = getWeekStatuses({
      todayStr,
      completedDates: new Set(['2026-06-15', '2026-06-17']),
      frozenDates: new Set(['2026-06-16']),
    });
    expect(statuses).toEqual([
      'done',   // Mon completed
      'frozen', // Tue frozen
      'done',   // Wed (today) completed
      'future', // Thu
      'future', // Fri
      'future', // Sat
      'future', // Sun
    ]);
  });

  it('marks a past day with no activity as missed', () => {
    const statuses = getWeekStatuses({
      todayStr,
      completedDates: new Set(['2026-06-17']),
      frozenDates: new Set(),
    });
    expect(statuses[0]).toBe('missed'); // Mon untouched
    expect(statuses[1]).toBe('missed'); // Tue untouched
  });
});

describe('isPerfectWeek', () => {
  it('is true only when every slot is done or frozen', () => {
    expect(isPerfectWeek(['done', 'done', 'frozen', 'done', 'done', 'done', 'done'])).toBe(true);
    expect(isPerfectWeek(['done', 'missed', 'done', 'done', 'done', 'done', 'done'])).toBe(false);
    expect(isPerfectWeek(['done', 'done', 'done', 'future', 'future', 'future', 'future'])).toBe(false);
  });
});
