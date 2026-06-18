import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { CoinBreakdown } from '../CoinBreakdown';
import type { RewardBreakdown } from '@/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const breakdown: RewardBreakdown = {
  lines: [
    { key: 'challengeComplete', amount: 20 },
    { key: 'perfect', amount: 10 },
    { key: 'streakMilestone5', amount: 5, meta: { streak: 15 } },
  ],
  total: 35,
};

describe('CoinBreakdown', () => {
  beforeEach(() => {
    // Force reduced-motion so all lines render immediately (no fake timers needed).
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
  });

  it('renders every breakdown line', () => {
    render(<CoinBreakdown breakdown={breakdown} />);
    expect(screen.getByText('coins.challengeComplete')).toBeInTheDocument();
    expect(screen.getByText('coins.perfect')).toBeInTheDocument();
  });

  it('shows the full total when reduced motion is on', () => {
    const { container } = render(<CoinBreakdown breakdown={breakdown} />);
    // The total is the first element with the running value, distinct from line amounts.
    expect(container.querySelector('[class*="totalValue"]')?.textContent).toBe('+35');
  });

  it('animates the running total when motion is allowed', () => {
    vi.useFakeTimers();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
    const { container } = render(<CoinBreakdown breakdown={breakdown} />);
    const total = () => container.querySelector('[class*="totalValue"]')?.textContent;
    // First line revealed after one tick → running total 20.
    act(() => { vi.advanceTimersByTime(600); });
    expect(total()).toBe('+20');
    act(() => { vi.advanceTimersByTime(1200); });
    expect(total()).toBe('+35');
    vi.useRealTimers();
  });
});
