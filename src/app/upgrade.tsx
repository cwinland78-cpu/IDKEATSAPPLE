import React from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Crown, Check, X, Sparkles, Ban } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useOfferings, usePurchase, useRestorePurchases, usePremiumStatus } from '@/lib/usePremium';
import { isRevenueCatEnabled } from '@/lib/revenuecatClient';
import type { PurchasesPackage } from 'react-native-purchases';

const FEATURES = [
  { icon: Ban, text: 'Remove all banner ads' },
  { icon: Sparkles, text: 'Instant spin results (no video ads)' },
  { icon: Check, text: 'No interstitial ads when opening maps' },
  { icon: Crown, text: 'Support the developer' },
];

export default function UpgradeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremiumStatus();
  const { packages, isLoading: isLoadingOfferings } = useOfferings();
  const { purchase, isPurchasing } = usePurchase();
  const { restore, isRestoring } = useRestorePurchases();

  const lifetimePackage = packages.find((pkg: PurchasesPackage) => pkg.identifier === '$rc_lifetime');
  const price = lifetimePackage?.product?.priceString ?? '$2.99';

  const handlePurchase = async () => {
    if (!isRevenueCatEnabled()) {
      Alert.alert(
        'Payments Not Available',
        'Please use the mobile app to make purchases. Payments are not supported in the browser.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!lifetimePackage) {
      Alert.alert('Error', 'Package not available. Please try again later.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await purchase(lifetimePackage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', 'Thank you for your purchase! Enjoy your ad-free experience.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      // User cancelled or error - don't show error for user cancellation
    }
  };

  const handleRestore = async () => {
    if (!isRevenueCatEnabled()) {
      Alert.alert(
        'Restore Not Available',
        'Please use the mobile app to restore purchases.',
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await restore();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Restored!', 'Your purchases have been restored.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('No Purchases Found', 'We could not find any previous purchases to restore.');
    }
  };

  if (isPremium) {
    return (
      <View className="flex-1 bg-slate-950">
        <LinearGradient
          colors={['#0f172a', '#1e1b4b', '#0f172a']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          <View className="w-20 h-20 rounded-full bg-emerald-500/20 items-center justify-center mb-6">
            <Crown size={40} color="#10b981" />
          </View>
          <Text className="text-white text-2xl font-bold mb-2">You're Premium!</Text>
          <Text className="text-white/60 text-center mb-8">
            Enjoy your ad-free experience.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="bg-white/10 px-8 py-4 rounded-2xl active:opacity-80"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#0f172a']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Close button */}
      <Pressable
        onPress={() => router.back()}
        className="absolute z-10 right-4 bg-white/10 w-10 h-10 rounded-full items-center justify-center"
        style={{ top: insets.top + 8 }}
      >
        <X size={24} color="#fff" />
      </Pressable>

      <View
        className="flex-1 px-6"
        style={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }}
      >
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-violet-600/30 items-center justify-center mb-4">
            <Crown size={40} color="#a78bfa" />
          </View>
          <Text className="text-white text-3xl font-bold mb-2">Go Premium</Text>
          <Text className="text-white/60 text-center">
            Remove all ads with a one-time purchase
          </Text>
        </View>

        {/* Features */}
        <View className="bg-white/5 rounded-3xl p-6 mb-8 border border-white/10">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <View
                key={index}
                className={`flex-row items-center ${index < FEATURES.length - 1 ? 'mb-5' : ''}`}
              >
                <View className="w-10 h-10 rounded-full bg-violet-600/20 items-center justify-center mr-4">
                  <Icon size={20} color="#a78bfa" />
                </View>
                <Text className="text-white text-base flex-1">{feature.text}</Text>
              </View>
            );
          })}
        </View>

        {/* Price */}
        <View className="items-center mb-6">
          <Text className="text-white/40 text-sm mb-1">One-time purchase</Text>
          {isLoadingOfferings ? (
            <ActivityIndicator color="#a78bfa" />
          ) : (
            <Text className="text-white text-4xl font-bold">{price}</Text>
          )}
          <Text className="text-emerald-400 text-sm mt-1">Lifetime access - pay once, never again</Text>
        </View>

        {/* Purchase Button */}
        <Pressable
          onPress={handlePurchase}
          disabled={isPurchasing || isLoadingOfferings}
          className="mb-4"
        >
          <LinearGradient
            colors={['#7c3aed', '#c026d3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 18,
              alignItems: 'center',
              opacity: isPurchasing || isLoadingOfferings ? 0.6 : 1,
            }}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-bold">Remove Ads Forever</Text>
            )}
          </LinearGradient>
        </Pressable>

        {/* Restore */}
        <Pressable
          onPress={handleRestore}
          disabled={isRestoring}
          className="py-3 items-center"
        >
          {isRestoring ? (
            <ActivityIndicator color="#a78bfa" size="small" />
          ) : (
            <Text className="text-violet-400 font-medium">Restore Purchase</Text>
          )}
        </Pressable>

        {/* Terms */}
        <Text className="text-white/30 text-xs text-center mt-auto">
          Payment will be charged to your Apple ID account at confirmation of purchase.
        </Text>
      </View>
    </View>
  );
}
