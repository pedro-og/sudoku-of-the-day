import { calculateRewards, COIN_ECONOMY } from '../coinEconomy';

function amountFor(key: string, input: Parameters<typeof calculateRewards>[0]): number {
  const line = calculateRewards(input).lines.find((l) => l.key === key);
  return line?.amount ?? 0;
}

const base = { elapsedSeconds: 480, mistakes: 0, streak: 1, perfectWeek: false };

describe('calculateRewards', () => {
  it('always awards the base reward', () => {
    expect(amountFor('challengeComplete', { ...base, mistakes: 3 })).toBe(COIN_ECONOMY.BASE);
  });

  it('gives no speed bonus at or above the target median', () => {
    expect(amountFor('speedBonus', { ...base, elapsedSeconds: 480 })).toBe(0);
    expect(amountFor('speedBonus', { ...base, elapsedSeconds: 600 })).toBe(0);
  });

  it('gives the max speed bonus for an instant solve', () => {
    expect(amountFor('speedBonus', { ...base, elapsedSeconds: 0 })).toBe(COIN_ECONOMY.SPEED_MAX);
  });

  it('scales the speed bonus linearly', () => {
    // halfway to the target → half the max, rounded
    expect(amountFor('speedBonus', { ...base, elapsedSeconds: 240 })).toBe(
      Math.round(COIN_ECONOMY.SPEED_MAX / 2)
    );
  });

  it('awards the perfect bonus for zero mistakes only', () => {
    expect(amountFor('perfect', { ...base, mistakes: 0 })).toBe(COIN_ECONOMY.PERFECT);
    expect(amountFor('perfect', { ...base, mistakes: 1 })).toBe(0);
  });

  it('awards almost-perfect for exactly one mistake, not stacking with perfect', () => {
    const r = calculateRewards({ ...base, mistakes: 1 });
    expect(r.lines.find((l) => l.key === 'almostPerfect')?.amount).toBe(COIN_ECONOMY.ALMOST_PERFECT);
    expect(r.lines.find((l) => l.key === 'perfect')).toBeUndefined();
  });

  it('gives no mistake bonus for 2+ mistakes', () => {
    expect(amountFor('perfect', { ...base, mistakes: 2 })).toBe(0);
    expect(amountFor('almostPerfect', { ...base, mistakes: 2 })).toBe(0);
  });

  it('awards the /5 milestone but not on /10', () => {
    expect(amountFor('streakMilestone5', { ...base, streak: 15 })).toBe(COIN_ECONOMY.STREAK_MILESTONE_5);
    expect(amountFor('streakMilestone5', { ...base, streak: 20 })).toBe(0);
  });

  it('awards the /10 milestone instead of /5', () => {
    expect(amountFor('streakMilestone10', { ...base, streak: 20 })).toBe(COIN_ECONOMY.STREAK_MILESTONE_10);
    expect(amountFor('streakMilestone5', { ...base, streak: 20 })).toBe(0);
  });

  it('attaches the streak to milestone meta', () => {
    const line = calculateRewards({ ...base, streak: 15 }).lines.find((l) => l.key === 'streakMilestone5');
    expect(line?.meta?.streak).toBe(15);
  });

  it('awards the perfect-week bonus', () => {
    expect(amountFor('perfectWeek', { ...base, perfectWeek: true })).toBe(COIN_ECONOMY.PERFECT_WEEK);
    expect(amountFor('perfectWeek', { ...base, perfectWeek: false })).toBe(0);
  });

  it('sums the total correctly and never goes negative', () => {
    const r = calculateRewards({ elapsedSeconds: 240, mistakes: 0, streak: 10, perfectWeek: true });
    const expected =
      COIN_ECONOMY.BASE +
      Math.round(COIN_ECONOMY.SPEED_MAX / 2) +
      COIN_ECONOMY.PERFECT +
      COIN_ECONOMY.STREAK_MILESTONE_10 +
      COIN_ECONOMY.PERFECT_WEEK;
    expect(r.total).toBe(expected);
    expect(r.total).toBeGreaterThanOrEqual(COIN_ECONOMY.BASE);
  });
});
