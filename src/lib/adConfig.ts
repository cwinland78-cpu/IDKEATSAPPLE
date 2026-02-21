/**
 * AdMob Configuration
 *
 * This file contains the configuration for AdMob ads.
 * Currently using placeholders since AdMob requires a native build.
 *
 * When you're ready to add real AdMob:
 * 1. Install react-native-google-mobile-ads during your production build
 * 2. Configure app.json with your AdMob App ID
 * 3. The production IDs below will be used automatically
 *
 * AdMob App ID: ca-app-pub-5879329589086028~3567654349
 */

import { Platform } from 'react-native';

// Google's official test ad unit IDs (used in development)
export const TEST_AD_UNIT_IDS = {
  BANNER: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
    default: '',
  }),
  INTERSTITIAL: Platform.select({
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
    default: '',
  }),
  REWARDED_INTERSTITIAL: Platform.select({
    ios: 'ca-app-pub-3940256099942544/6978759866',
    android: 'ca-app-pub-3940256099942544/5354046379',
    default: '',
  }),
};

// Your actual AdMob ad unit IDs (used in production)
export const PRODUCTION_AD_UNIT_IDS = {
  // IDK_Banner - Bottom banner ad
  BANNER: Platform.select({
    ios: 'ca-app-pub-5879329589086028/6856162664',
    android: 'ca-app-pub-5879329589086028/6856162664',
    default: '',
  }),
  // IDK_Map - Interstitial before opening Maps
  INTERSTITIAL: Platform.select({
    ios: 'ca-app-pub-5879329589086028/4861582383',
    android: 'ca-app-pub-5879329589086028/4861582383',
    default: '',
  }),
  // IDK_Result - Rewarded interstitial to reveal spin result
  REWARDED_INTERSTITIAL: Platform.select({
    ios: 'ca-app-pub-5879329589086028/1229459134',
    android: 'ca-app-pub-5879329589086028/1229459134',
    default: '',
  }),
};

// Use test IDs in development, production IDs in release builds
export const AD_UNIT_IDS = __DEV__ ? TEST_AD_UNIT_IDS : PRODUCTION_AD_UNIT_IDS;

// AdMob App ID (needed for app.json configuration)
export const ADMOB_APP_ID = 'ca-app-pub-5879329589086028~3567654349';

// Check if we're on a platform that supports ads (not web)
export const isAdPlatformSupported = Platform.OS === 'ios' || Platform.OS === 'android';

// AdMob is now installed and will be active in native builds
export const isAdMobInstalled = true;
