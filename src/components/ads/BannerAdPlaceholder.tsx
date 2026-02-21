import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { AD_UNIT_IDS, isAdPlatformSupported } from '../../lib/adConfig';
import { isAdMobAvailable, getBannerAdComponent, getBannerAdSize } from '../../lib/admobService';

interface BannerAdPlaceholderProps {
  onRemoveAds?: () => void;
}

export function BannerAdPlaceholder({ onRemoveAds }: BannerAdPlaceholderProps) {
  const router = useRouter();
  const [adError, setAdError] = useState(false);

  const handleRemoveAds = () => {
    if (onRemoveAds) {
      onRemoveAds();
    } else {
      router.push('/upgrade');
    }
  };

  // Try to use real AdMob if available
  if (isAdMobAvailable && isAdPlatformSupported && !adError) {
    const BannerAd = getBannerAdComponent();
    const BannerAdSize = getBannerAdSize();

    if (BannerAd && BannerAdSize) {
      return (
        <View className="bg-slate-800/90 border-t border-white/10">
          <View className="flex-row items-center justify-between px-4 py-2">
            <View className="flex-1 items-center">
              <BannerAd
                unitId={AD_UNIT_IDS.BANNER}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                  requestNonPersonalizedAdsOnly: true,
                }}
                onAdLoaded={() => {
                  console.log('[AdMob] Banner ad loaded');
                }}
                onAdFailedToLoad={(error: any) => {
                  console.log('[AdMob] Banner ad failed:', error);
                  setAdError(true);
                }}
              />
            </View>
            <Pressable
              onPress={handleRemoveAds}
              className="ml-3 bg-violet-600/80 px-3 py-2 rounded-full active:opacity-70"
            >
              <Text className="text-white text-xs font-medium">Remove Ads</Text>
            </Pressable>
          </View>
        </View>
      );
    }
  }

  // Placeholder for development or when AdMob is not available
  return (
    <View className="bg-slate-800/90 border-t border-white/10">
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-1">
          <View className="bg-slate-700/50 rounded-lg h-12 items-center justify-center border border-dashed border-white/20">
            <Text className="text-white/40 text-xs">
              {Platform.OS === 'web'
                ? 'Ads not shown on web'
                : __DEV__
                  ? 'Ad Banner (Dev Mode)'
                  : 'Ad Banner Placeholder'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={handleRemoveAds}
          className="ml-3 bg-violet-600/80 px-3 py-2 rounded-full active:opacity-70"
        >
          <Text className="text-white text-xs font-medium">Remove Ads</Text>
        </Pressable>
      </View>
    </View>
  );
}
