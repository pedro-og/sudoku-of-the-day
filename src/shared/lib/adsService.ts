// Google AdSense H5 Games Ads — rewarded ad wrapper.
//
// The H5 Games Ads API works by registering a "placement" via window.adBreak({...}).
// When the placement fires, AdSense decides whether to show an ad. If it shows
// one and the user finishes watching, beforeReward(showAdFn) is invoked — we
// call showAdFn() to render the ad — then either adDismissed (skipped) or
// adViewed (full watch) fires. We only resolve true on adViewed.
//
// In dev (no AdSense script loaded) we fall back to a 2.5s mock so the flow
// is testable without the ad network.

export type AdResult = 'rewarded' | 'dismissed' | 'error';

interface AdBreakPlacement {
  type: 'reward';
  name: string;
  beforeAd?: () => void;
  afterAd?: () => void;
  beforeReward?: (showAdFn: () => void) => void;
  adDismissed?: () => void;
  adViewed?: () => void;
  adBreakDone?: (placementInfo: { breakStatus: string }) => void;
}

declare global {
  interface Window {
    adBreak?: (placement: AdBreakPlacement) => void;
    adConfig?: (config: { preloadAdBreaks?: 'on' | 'auto'; sound?: 'on' | 'off' }) => void;
  }
}

const MOCK_DELAY_MS = 2500;

export function isAdSenseAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.adBreak === 'function';
}

export function showRewardedAd(placementName: string = 'extra-chance'): Promise<AdResult> {
  if (!isAdSenseAvailable()) {
    return new Promise(resolve => {
      setTimeout(() => resolve('rewarded'), MOCK_DELAY_MS);
    });
  }

  return new Promise(resolve => {
    let settled = false;
    const settle = (result: AdResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    try {
      window.adBreak!({
        type: 'reward',
        name: placementName,
        beforeReward: (showAdFn: () => void) => {
          showAdFn();
        },
        adDismissed: () => settle('dismissed'),
        adViewed: () => settle('rewarded'),
        adBreakDone: (info) => {
          if (info.breakStatus !== 'viewed' && info.breakStatus !== 'dismissed') {
            settle('error');
          }
        },
      });
    } catch {
      settle('error');
    }
  });
}
