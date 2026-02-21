import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Modal, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { rewardedInterstitialAd, isAdMobAvailable } from '../../lib/admobService';
import { isAdPlatformSupported } from '../../lib/adConfig';

interface RewardedAdModalProps {
  visible: boolean;
  onClose: () => void;
  onRewardEarned: () => void;
  title?: string;
  description?: string;
}

export function RewardedAdModal({
  visible,
  onClose,
  onRewardEarned,
}: RewardedAdModalProps) {
  const [progress, setProgress] = useState(0);
  const [adCompleted, setAdCompleted] = useState(false);
  const [useRealAd, setUseRealAd] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedRef = useRef(false);
  const hasTriedRealAdRef = useRef(false);

  const progressWidth = useSharedValue(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Start the placeholder ad simulation
  const startPlaceholderAd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 5 second ad duration
    const adDuration = 5000;
    progressWidth.value = withTiming(100, { duration: adDuration, easing: Easing.linear });

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 2; // 2% every 100ms = 5 seconds total
        if (newProgress >= 100) {
          cleanup();
          setAdCompleted(true);

          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Auto-complete after a brief delay
            timeoutRef.current = setTimeout(() => {
              onRewardEarned();
              onClose();
            }, 800);
          }

          return 100;
        }
        return newProgress;
      });
    }, 100);
  }, [cleanup, onClose, onRewardEarned, progressWidth]);

  // Try to show real ad when modal opens
  useEffect(() => {
    if (visible) {
      // Reset everything when opening
      hasCompletedRef.current = false;
      hasTriedRealAdRef.current = false;
      setProgress(0);
      setAdCompleted(false);
      setUseRealAd(false);
      progressWidth.value = 0;

      // Try to show real ad if available
      if (isAdMobAvailable && isAdPlatformSupported && rewardedInterstitialAd.isReady()) {
        hasTriedRealAdRef.current = true;
        setUseRealAd(true);

        rewardedInterstitialAd.show(
          // On reward earned
          () => {
            console.log('[RewardedAd] Reward earned from real ad');
            if (!hasCompletedRef.current) {
              hasCompletedRef.current = true;
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onRewardEarned();
            }
          },
          // On ad closed
          () => {
            console.log('[RewardedAd] Real ad closed');
            onClose();
          }
        ).then((shown) => {
          if (!shown) {
            // Failed to show real ad, fall back to placeholder
            console.log('[RewardedAd] Failed to show real ad, using placeholder');
            setUseRealAd(false);
            startPlaceholderAd();
          }
        });
      } else {
        // No real ad available, use placeholder
        startPlaceholderAd();
      }
    } else {
      // Clean up when closing
      cleanup();
      setProgress(0);
      setAdCompleted(false);
      setUseRealAd(false);
      progressWidth.value = 0;
      hasCompletedRef.current = false;
      hasTriedRealAdRef.current = false;
    }

    return cleanup;
  }, [visible, cleanup, startPlaceholderAd, onClose, onRewardEarned, progressWidth]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const remainingSeconds = Math.ceil((100 - progress) / 20);

  // If using real ad, show minimal loading state (the native ad UI will take over)
  if (useRealAd) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={false}
        onRequestClose={() => {}}
      >
        <View className="flex-1 bg-black items-center justify-center">
          <Text className="text-white/60 text-lg">Loading ad...</Text>
        </View>
      </Modal>
    );
  }

  // Placeholder ad UI
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={() => {
        // Prevent closing - user must watch the ad
      }}
    >
      <View className="flex-1 bg-black items-center justify-center">
        {/* Progress bar at top */}
        <View className="absolute top-0 left-0 right-0 h-1.5 bg-white/20">
          <Animated.View
            style={[
              progressAnimatedStyle,
              { height: '100%', backgroundColor: '#a78bfa' },
            ]}
          />
        </View>

        {/* Timer indicator */}
        <View className="absolute top-14 left-0 right-0 items-center">
          <View className="bg-white/10 px-4 py-2 rounded-full">
            <Text className="text-white/60 font-medium">
              {adCompleted ? 'Complete!' : `${remainingSeconds}s`}
            </Text>
          </View>
        </View>

        {/* Ad content placeholder */}
        <View className="flex-1 items-center justify-center px-8 w-full">
          <View className="bg-slate-900/80 rounded-3xl p-8 items-center border border-white/10 w-full max-w-sm">
            {!adCompleted ? (
              <>
                <View className="w-full h-64 bg-slate-800/50 rounded-2xl items-center justify-center border border-dashed border-white/20 mb-4">
                  <Text className="text-white/30 text-center">
                    {Platform.OS === 'web'
                      ? 'Ads not shown on web'
                      : __DEV__
                        ? 'Rewarded Ad\n(Dev Mode)'
                        : 'Rewarded Ad\nContent Placeholder'}
                  </Text>
                </View>
                <Text className="text-white/40 text-xs text-center">
                  Advertisement
                </Text>
                <Text className="text-white/60 text-sm text-center mt-4">
                  Watch to reveal your restaurant pick
                </Text>
              </>
            ) : (
              <View className="items-center py-8">
                <View className="w-20 h-20 rounded-full bg-emerald-500/20 items-center justify-center mb-4">
                  <Text className="text-4xl">🎉</Text>
                </View>
                <Text className="text-white text-xl font-bold">
                  Revealing your pick...
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom info */}
        <View className="absolute bottom-8 items-center px-6">
          <Text className="text-white/30 text-xs text-center">
            Upgrade to Premium for instant results without ads
          </Text>
        </View>
      </View>
    </Modal>
  );
}
