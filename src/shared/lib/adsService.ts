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

export function isAdSenseAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.adBreak === 'function';
}

// Master switch. While AdSense is in review there are no ads to serve, so
// adBreak() exists but never calls back — the promise would hang forever.
// Set VITE_ADS_ENABLED=true once AdSense approval is granted and a rewarded
// ad unit is configured.
function adsEnabled(): boolean {
  return import.meta.env.VITE_ADS_ENABLED === 'true';
}

export function showRewardedAd(placementName: string = 'extra-chance'): Promise<AdResult> {
  if (!adsEnabled() || !isAdSenseAvailable()) {
    // Reward immediately — no ad, no waiting.
    return Promise.resolve('rewarded');
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
