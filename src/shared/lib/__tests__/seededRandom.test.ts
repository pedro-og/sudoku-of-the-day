import { createSeededRandom, seededShuffle } from '../seededRandom';

describe('createSeededRandom', () => {
  it('produces deterministic output for the same seed', () => {
    const a = createSeededRandom('test-seed');
    const b = createSeededRandom('test-seed');
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = createSeededRandom('seed-a');
    const b = createSeededRandom('seed-b');
    const resultsA = Array.from({ length: 10 }, () => a());
    const resultsB = Array.from({ length: 10 }, () => b());
    expect(resultsA).not.toEqual(resultsB);
  });

  it('returns values in [0, 1)', () => {
    const rng = createSeededRandom('range-test');
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe('seededShuffle', () => {
  it('returns the same array reference (mutates in place)', () => {
    const arr = [1, 2, 3, 4, 5];
    const rng = createSeededRandom('shuffle');
    const result = seededShuffle(arr, rng);
    expect(result).toBe(arr);
  });

  it('produces deterministic shuffle for the same seed', () => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const b = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    seededShuffle(a, createSeededRandom('shuffle-seed'));
    seededShuffle(b, createSeededRandom('shuffle-seed'));
    expect(a).toEqual(b);
  });

  it('preserves all elements (no loss or duplication)', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    seededShuffle(arr, createSeededRandom('preserve'));
    expect(arr.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
