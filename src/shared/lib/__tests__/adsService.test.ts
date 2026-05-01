import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { showRewardedAd, isAdSenseAvailable } from '../adsService';

describe('adsService', () => {
  afterEach(() => {
    delete (window as unknown as { adBreak?: unknown }).adBreak;
    vi.unstubAllEnvs();
  });

  describe('disabled (default — VITE_ADS_ENABLED not "true")', () => {
    it('isAdSenseAvailable returns false when adBreak is undefined', () => {
      expect(isAdSenseAvailable()).toBe(false);
    });

    it('resolves immediately to "rewarded" without ads', async () => {
      await expect(showRewardedAd()).resolves.toBe('rewarded');
    });

    it('resolves immediately even if AdSense script is loaded but ads disabled', async () => {
      (window as unknown as { adBreak: () => void }).adBreak = () => {};
      await expect(showRewardedAd()).resolves.toBe('rewarded');
    });
  });

  describe('enabled (VITE_ADS_ENABLED=true) with AdSense loaded', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_ADS_ENABLED', 'true');
    });

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

  describe('enabled but AdSense script not loaded', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_ADS_ENABLED', 'true');
    });

    it('falls back to immediate reward', async () => {
      await expect(showRewardedAd()).resolves.toBe('rewarded');
    });
  });
});
