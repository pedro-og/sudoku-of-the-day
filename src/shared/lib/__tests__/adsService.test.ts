import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { showRewardedAd, isAdSenseAvailable } from '../adsService';

describe('adsService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as unknown as { adBreak?: unknown }).adBreak;
  });

  describe('mock fallback (no AdSense loaded)', () => {
    it('isAdSenseAvailable returns false when adBreak is undefined', () => {
      expect(isAdSenseAvailable()).toBe(false);
    });

    it('resolves to "rewarded" after the mock delay', async () => {
      const promise = showRewardedAd();
      vi.advanceTimersByTime(2500);
      await expect(promise).resolves.toBe('rewarded');
    });
  });

  describe('with AdSense loaded', () => {
    it('isAdSenseAvailable returns true when adBreak is a function', () => {
      (window as unknown as { adBreak: () => void }).adBreak = () => {};
      expect(isAdSenseAvailable()).toBe(true);
    });

    it('resolves "rewarded" when adViewed fires', async () => {
      (window as unknown as { adBreak: (p: { adViewed?: () => void }) => void }).adBreak = (p) => {
        p.adViewed?.();
      };
      await expect(showRewardedAd()).resolves.toBe('rewarded');
    });

    it('resolves "dismissed" when adDismissed fires', async () => {
      (window as unknown as { adBreak: (p: { adDismissed?: () => void }) => void }).adBreak = (p) => {
        p.adDismissed?.();
      };
      await expect(showRewardedAd()).resolves.toBe('dismissed');
    });

    it('resolves "error" when adBreak throws', async () => {
      (window as unknown as { adBreak: () => void }).adBreak = () => {
        throw new Error('fail');
      };
      await expect(showRewardedAd()).resolves.toBe('error');
    });

    it('only settles once even if multiple callbacks fire', async () => {
      (window as unknown as { adBreak: (p: { adViewed?: () => void; adDismissed?: () => void }) => void }).adBreak = (p) => {
        p.adViewed?.();
        p.adDismissed?.();
      };
      await expect(showRewardedAd()).resolves.toBe('rewarded');
    });
  });
});
