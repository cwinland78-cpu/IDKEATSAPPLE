import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Modal, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { interstitialAd, isAdMobAvailable } from '../../lib/admobService';
import { isAdPlatformSupported } from '../../lib/adConfig';

interface InterstitialAdModalProps {
  visible: boolean;
  onClose: () => void;
  onAdComplete: () => void;
  duration?: number;
}

export function InterstitialAdModal({
  visible,
  onClose,
  onAdComplete,
  duration = 3,
}: InterstitialAdModalProps) {
  const [countdown, setCountdown] = useState(duration);
  const [canSkip, setCanSkip] = useState(false);
  const [useRealAd, setUseRealAd] = useState(false);

  const progressWidth = useSharedValue(0);

  const startSimulatedAd = useCallback(() => {
    setCountdown(duration);
    setCanSkip(false);
    progressWidth.value = 0;

    progressWidth.value = withTiming(100, {
      duration: duration * 1000,
      easing: Easing.linear,
    });

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, progressWidth]);

  // Try to show real ad when visible
  useEffect(() => {
    if (visible) {
      setUseRealAd(false);

      // Try to show real ad if available
      if (isAdMobAvailable && isAdPlatformSupported && interstitialAd.isReady()) {
        setUseRealAd(true);

        interstitialAd.show(() => {
          console.log('[InterstitialAd] Real ad closed');
          onAdComplete();
          onClose();
        }).then((shown) => {
          if (!shown) {
            // Failed to show real ad, fall back to placeholder
            console.log('[InterstitialAd] Failed to show real ad, using placeholder');
            setUseRealAd(false);
            startSimulatedAd();
          }
        });
      } else {
        // No real ad available, use placeholder
        const cleanup = startSimulatedAd();
        return cleanup;
      }
    } else {
      setCountdown(duration);
      setCanSkip(false);
      setUseRealAd(false);
      progressWidth.value = 0;
    }
  }, [visible, startSimulatedAd, duration, progressWidth, onAdComplete, onClose]);

  const handleSkip = () => {
    if (canSkip) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onAdComplete();
      onClose();
    }
  };

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // If using real ad, show minimal loading state (the native ad UI will take over)
  if (useRealAd) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent
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
      transparent
      onRequestClose={() => {
        if (canSkip) {
          handleSkip();
        }
      }}
    >
      <View className="flex-1 bg-black items-center justify-center">
        {/* Progress bar at top */}
        <View className="absolute top-0 left-0 right-0 h-1 bg-white/20">
          <Animated.View
            style={[
              progressAnimatedStyle,
              { height: '100%', backgroundColor: '#a78bfa' },
            ]}
          />
        </View>

        {/* Skip button */}
        <Pressable
          onPress={handleSkip}
          disabled={!canSkip}
          className="absolute top-12 right-4 z-10"
        >
          <View
            className={`flex-row items-center px-4 py-2 rounded-full ${
              canSkip ? 'bg-white/20' : 'bg-white/10'
            }`}
          >
            {canSkip ? (
              <>
                <Text className="text-white font-medium mr-2">Skip</Text>
                <X size={18} color="#fff" />
              </>
            ) : (
              <Text className="text-white/60 font-medium">
                Skip in {countdown}s
              </Text>
            )}
          </View>
        </Pressable>

        {/* Ad content placeholder */}
        <View className="flex-1 items-center justify-center px-8">
          <View className="bg-slate-900/80 rounded-3xl p-8 items-center border border-white/10 w-full max-w-sm">
            <View className="w-full h-64 bg-slate-800/50 rounded-2xl items-center justify-center border border-dashed border-white/20 mb-4">
              <Text className="text-white/30 text-center">
                {Platform.OS === 'web'
                  ? 'Ads not shown on web'
                  : __DEV__
                    ? 'Interstitial Ad\n(Dev Mode)'
                    : 'Interstitial Ad\nContent Placeholder'}
              </Text>
            </View>
            <Text className="text-white/40 text-xs text-center">
              Advertisement
            </Text>
          </View>
        </View>

        {/* Bottom info */}
        <View className="absolute bottom-8 items-center">
          <Text className="text-white/30 text-xs">
            Upgrade to Premium for an ad-free experience
          </Text>
        </View>
      </View>
    </Modal>
  );
}
