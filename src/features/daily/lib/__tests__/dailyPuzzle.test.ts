import { getBrazilDateString, getPuzzleNumber } from '../dailyPuzzle';

describe('getBrazilDateString', () => {
  it('returns a YYYY-MM-DD formatted string', () => {
    const result = getBrazilDateString(new Date('2026-03-15T12:00:00Z'));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns deterministic result for a given date', () => {
    const date = new Date('2026-06-15T12:00:00Z');
    const a = getBrazilDateString(date);
    const b = getBrazilDateString(date);
    expect(a).toBe(b);
  });
});

describe('getPuzzleNumber', () => {
  it('returns 1 for the launch date', () => {
    expect(getPuzzleNumber('2026-01-01')).toBe(1);
  });

  it('returns 2 for the day after launch', () => {
    expect(getPuzzleNumber('2026-01-02')).toBe(2);
  });

  it('increments by 1 per day', () => {
    const num10 = getPuzzleNumber('2026-01-10');
    const num11 = getPuzzleNumber('2026-01-11');
    expect(num11 - num10).toBe(1);
  });

  it('handles month boundaries correctly', () => {
    const jan31 = getPuzzleNumber('2026-01-31');
    const feb01 = getPuzzleNumber('2026-02-01');
    expect(feb01 - jan31).toBe(1);
  });

  it('returns correct number for a known date', () => {
    // 2026-03-15 is 73 days after 2026-01-01
    expect(getPuzzleNumber('2026-03-15')).toBe(74);
  });
});
