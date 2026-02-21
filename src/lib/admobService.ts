/**
 * AdMob Service
 *
 * This service handles AdMob integration for production builds.
 * In the Vibecode environment (development), it uses placeholder fallbacks.
 *
 * When you publish your app via Vibecode, the react-native-google-mobile-ads
 * package will be installed and real ads will be shown.
 *
 * Ad Unit IDs (already configured):
 * - Banner (IDK_Banner): ca-app-pub-5879329589086028/6856162664
 * - Interstitial (IDK_Map): ca-app-pub-5879329589086028/4861582383
 * - Rewarded Interstitial (IDK_Result): ca-app-pub-5879329589086028/1229459134
 * - App ID: ca-app-pub-5879329589086028~3567654349
 */

import { Platform } from 'react-native';
import { AD_UNIT_IDS, isAdPlatformSupported } from './adConfig';

// Check if AdMob is available (will be true in production builds)
let AdMobModule: any = null;
let isAdMobAvailable = false;

try {
  // This will only succeed in production builds with native code
  AdMobModule = require('react-native-google-mobile-ads');
  isAdMobAvailable = true;
  console.log('[AdMob] Module loaded successfully');
} catch (e) {
  console.log('[AdMob] Native module not available - using placeholders');
  isAdMobAvailable = false;
}

export { isAdMobAvailable };

// Types for callbacks
type AdEventCallback = () => void;
type AdErrorCallback = (error: Error) => void;

// Interstitial Ad Manager
class InterstitialAdManager {
  private ad: any = null;
  private isLoaded = false;
  private onCloseCallback: AdEventCallback | null = null;

  async load(): Promise<boolean> {
    if (!isAdMobAvailable || !isAdPlatformSupported) {
      console.log('[AdMob] Interstitial: Using placeholder (not available)');
      return false;
    }

    try {
      const { InterstitialAd, AdEventType } = AdMobModule;

      this.ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL, {
        requestNonPersonalizedAdsOnly: true,
      });

      return new Promise((resolve) => {
        this.ad.addAdEventListener(AdEventType.LOADED, () => {
          console.log('[AdMob] Interstitial loaded');
          this.isLoaded = true;
          resolve(true);
        });

        this.ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
          console.log('[AdMob] Interstitial error:', error);
          this.isLoaded = false;
          resolve(false);
        });

        this.ad.addAdEventListener(AdEventType.CLOSED, () => {
          console.log('[AdMob] Interstitial closed');
          this.isLoaded = false;
          if (this.onCloseCallback) {
            this.onCloseCallback();
            this.onCloseCallback = null;
          }
          // Preload next ad
          this.load();
        });

        this.ad.load();
      });
    } catch (error) {
      console.log('[AdMob] Interstitial load error:', error);
      return false;
    }
  }

  async show(onClose?: AdEventCallback): Promise<boolean> {
    if (!isAdMobAvailable || !this.isLoaded || !this.ad) {
      console.log('[AdMob] Interstitial not ready, using placeholder');
      return false;
    }

    try {
      this.onCloseCallback = onClose || null;
      await this.ad.show();
      return true;
    } catch (error) {
      console.log('[AdMob] Interstitial show error:', error);
      return false;
    }
  }

  isReady(): boolean {
    return isAdMobAvailable && this.isLoaded;
  }
}

// Rewarded Interstitial Ad Manager
class RewardedInterstitialAdManager {
  private ad: any = null;
  private isLoaded = false;
  private onRewardCallback: AdEventCallback | null = null;
  private onCloseCallback: AdEventCallback | null = null;

  async load(): Promise<boolean> {
    if (!isAdMobAvailable || !isAdPlatformSupported) {
      console.log('[AdMob] Rewarded: Using placeholder (not available)');
      return false;
    }

    try {
      const { RewardedInterstitialAd, RewardedAdEventType, AdEventType } = AdMobModule;

      this.ad = RewardedInterstitialAd.createForAdRequest(AD_UNIT_IDS.REWARDED_INTERSTITIAL, {
        requestNonPersonalizedAdsOnly: true,
      });

      return new Promise((resolve) => {
        this.ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          console.log('[AdMob] Rewarded loaded');
          this.isLoaded = true;
          resolve(true);
        });

        this.ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
          console.log('[AdMob] Rewarded error:', error);
          this.isLoaded = false;
          resolve(false);
        });

        this.ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          console.log('[AdMob] Reward earned!');
          if (this.onRewardCallback) {
            this.onRewardCallback();
            this.onRewardCallback = null;
          }
        });

        this.ad.addAdEventListener(AdEventType.CLOSED, () => {
          console.log('[AdMob] Rewarded closed');
          this.isLoaded = false;
          if (this.onCloseCallback) {
            this.onCloseCallback();
            this.onCloseCallback = null;
          }
          // Preload next ad
          this.load();
        });

        this.ad.load();
      });
    } catch (error) {
      console.log('[AdMob] Rewarded load error:', error);
      return false;
    }
  }

  async show(onReward?: AdEventCallback, onClose?: AdEventCallback): Promise<boolean> {
    if (!isAdMobAvailable || !this.isLoaded || !this.ad) {
      console.log('[AdMob] Rewarded not ready, using placeholder');
      return false;
    }

    try {
      this.onRewardCallback = onReward || null;
      this.onCloseCallback = onClose || null;
      await this.ad.show();
      return true;
    } catch (error) {
      console.log('[AdMob] Rewarded show error:', error);
      return false;
    }
  }

  isReady(): boolean {
    return isAdMobAvailable && this.isLoaded;
  }
}

// Export singleton instances
export const interstitialAd = new InterstitialAdManager();
export const rewardedInterstitialAd = new RewardedInterstitialAdManager();

// Initialize ads on app start
export async function initializeAds(): Promise<void> {
  if (!isAdMobAvailable || !isAdPlatformSupported) {
    console.log('[AdMob] Skipping initialization - not available');
    return;
  }

  console.log('[AdMob] Initializing ads...');

  // Preload ads
  await Promise.all([
    interstitialAd.load(),
    rewardedInterstitialAd.load(),
  ]);

  console.log('[AdMob] Initialization complete');
}

// Get BannerAd component if available
export function getBannerAdComponent(): React.ComponentType<any> | null {
  if (!isAdMobAvailable) {
    return null;
  }
  try {
    return AdMobModule.BannerAd;
  } catch {
    return null;
  }
}

// Get BannerAdSize if available
export function getBannerAdSize(): any {
  if (!isAdMobAvailable) {
    return null;
  }
  try {
    return AdMobModule.BannerAdSize;
  } catch {
    return null;
  }
}
