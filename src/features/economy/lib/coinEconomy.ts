import type { RewardBreakdown, RewardLine } from '@/types';

/**
 * Sudokoins economy constants. Tuned for a single daily puzzle:
 * a well-played day yields ~25–60 coins. Kept here so the values are
 * easy to tune in one place and mirrored exactly by the server
 * (record_completion in migration 014).
 */
export const COIN_ECONOMY = {
  /** Flat reward for solving the daily puzzle. */
  BASE: 20,
  /** Max bonus for speed; scales linearly down to 0 at TARGET_MEDIAN_SECONDS. */
  SPEED_MAX: 15,
  /** Solve time at/above which the speed bonus is 0. */
  TARGET_MEDIAN_SECONDS: 480, // 8 min
  /** Bonus for a flawless solve (0 mistakes). */
  PERFECT: 10,
  /** Consolation bonus for exactly 1 mistake (does not stack with PERFECT). */
  ALMOST_PERFECT: 4,
  /** Bonus when the new streak is a multiple of 5 (but not 10). */
  STREAK_MILESTONE_5: 5,
  /** Bonus when the new streak is a multiple of 10 (replaces the /5 bonus). */
  STREAK_MILESTONE_10: 15,
  /** Bonus for playing/freezing every day of the current week (Mon–Sun). */
  PERFECT_WEEK: 7,
} as const;

export interface RewardInput {
  /** Total solve time in seconds. */
  elapsedSeconds: number;
  /** Mistakes made during the solve. */
  mistakes: number;
  /** The player's streak AFTER recording this completion. */
  streak: number;
  /** True when every day of the current week is done or frozen. */
  perfectWeek: boolean;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Pure reward calculator. Returns the line-by-line breakdown shown in the
 * animated CoinBreakdown panel plus the total. Only includes lines that
 * actually award coins (amount > 0). Never returns a negative total — the
 * floor is the base reward.
 */
export function calculateRewards(input: RewardInput): RewardBreakdown {
  const { elapsedSeconds, mistakes, streak, perfectWeek } = input;
  const lines: RewardLine[] = [];

  // Base
  lines.push({ key: 'challengeComplete', amount: COIN_ECONOMY.BASE });

  // Speed bonus (0..SPEED_MAX), never negative
  const speed = clamp(
    Math.round(
      (COIN_ECONOMY.SPEED_MAX * (COIN_ECONOMY.TARGET_MEDIAN_SECONDS - elapsedSeconds)) /
        COIN_ECONOMY.TARGET_MEDIAN_SECONDS
    ),
    0,
    COIN_ECONOMY.SPEED_MAX
  );
  if (speed > 0) lines.push({ key: 'speedBonus', amount: speed });

  // Mistake bonus (perfect > almost; mutually exclusive)
  if (mistakes === 0) {
    lines.push({ key: 'perfect', amount: COIN_ECONOMY.PERFECT });
  } else if (mistakes === 1) {
    lines.push({ key: 'almostPerfect', amount: COIN_ECONOMY.ALMOST_PERFECT });
  }

  // Streak milestone (/10 replaces /5)
  if (streak > 0 && streak % 10 === 0) {
    lines.push({ key: 'streakMilestone10', amount: COIN_ECONOMY.STREAK_MILESTONE_10, meta: { streak } });
  } else if (streak > 0 && streak % 5 === 0) {
    lines.push({ key: 'streakMilestone5', amount: COIN_ECONOMY.STREAK_MILESTONE_5, meta: { streak } });
  }

  // Perfect week
  if (perfectWeek) {
    lines.push({ key: 'perfectWeek', amount: COIN_ECONOMY.PERFECT_WEEK });
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return { lines, total };
}

/** Shop catalog. Prices mirrored by the purchase_item RPC. */
export const SHOP_ITEMS = {
  streakFreeze: { price: 120, maxOwned: 2 },
  undoToken: { price: 50, maxOwned: Infinity },
} as const;

export type ShopItemId = keyof typeof SHOP_ITEMS;
