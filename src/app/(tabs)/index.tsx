import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, Image, ScrollView, Linking, ActivityIndicator, Share as RNShare } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  MapPin,
  Utensils,
  ShoppingBag,
  Sparkles,
  ExternalLink,
  Star,
  Crown,
  Beer,
  Share,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { usePlacesStore, Place, DistanceFilter, FilterType } from '@/lib/store';
import { cn } from '@/lib/cn';
import { usePremiumStatus } from '@/lib/usePremium';
import { BannerAdPlaceholder, RewardedAdModal, InterstitialAdModal } from '@/components/ads';
import { useRouter } from 'expo-router';
import { useFonts, BubblegumSans_400Regular } from '@expo-google-fonts/bubblegum-sans';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';

// Import the spin wheel image and IDK logo
const spinWheelImage = require('../../../assets/spin-wheel.png');
const idkEatsLogo = require('../../../assets/idk-eats-logo.png');
const shareIcon = require('../../../assets/iconfinal.png');

const DISTANCE_OPTIONS: { key: DistanceFilter; label: string }[] = [
  { key: '2', label: '2 mi' },
  { key: '4', label: '4 mi' },
  { key: '8', label: '8 mi' },
];

const FILTER_OPTIONS: { key: FilterType; label: string; icon: typeof Utensils }[] = [
  { key: 'dine-in', label: 'Dine In', icon: Utensils },
  { key: 'takeout', label: 'Takeout', icon: ShoppingBag },
  { key: 'bar', label: 'Pub/Tavern', icon: Beer },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremiumStatus();

  // Load custom font
  const [fontsLoaded] = useFonts({
    BubblegumSans_400Regular,
    Pacifico_400Regular,
  });

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<FilterType[]>([]);
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>('4');
  const [isSpinning, setIsSpinning] = useState(false);
  const [cyclingPlaces, setCyclingPlaces] = useState<Place[]>([]);
  const [currentCycleIndex, setCurrentCycleIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  // Ad states
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [pendingPlace, setPendingPlace] = useState<Place | null>(null);
  const [pendingMapPlace, setPendingMapPlace] = useState<Place | null>(null);

  // Ad frequency counters - show ads every 5 actions
  const spinCountRef = useRef(0);
  const mapOpenCountRef = useRef(0);
  const AD_FREQUENCY = 5;

  const places = usePlacesStore((s) => s.places);
  const isLoading = usePlacesStore((s) => s.isLoading);
  const error = usePlacesStore((s) => s.error);
  const fetchRealRestaurants = usePlacesStore((s) => s.fetchRealRestaurants);
  const getRandomPlace = usePlacesStore((s) => s.getRandomPlace);
  const getFilteredPlaces = usePlacesStore((s) => s.getFilteredPlaces);
  const addVisit = usePlacesStore((s) => s.addVisit);
  const getCachedLocation = usePlacesStore((s) => s.getCachedLocation);
  const setCachedLocation = usePlacesStore((s) => s.setCachedLocation);

  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const cardScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const cycleIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSpinningRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Request location permission and fetch real restaurants on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        // Check for cached location first (15 min cache)
        const cached = getCachedLocation();

        let coords: { latitude: number; longitude: number };

        if (cached) {
          // Use cached location
          coords = cached;
        } else {
          // Fetch fresh location from GPS
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          // Cache the new location
          setCachedLocation(coords.latitude, coords.longitude);
        }

        setUserLocation(coords);

        // Fetch real restaurants near user (only once)
        if (!hasLoadedRef.current) {
          hasLoadedRef.current = true;
          fetchRealRestaurants(coords.latitude, coords.longitude);
        }
      }
    })();
  }, [fetchRealRestaurants, getCachedLocation, setCachedLocation]);

  const getMaxDistance = useCallback((): number => {
    return parseInt(distanceFilter, 10);
  }, [distanceFilter]);

  // Toggle filter selection (multi-select)
  const toggleFilter = useCallback((filterKey: FilterType) => {
    Haptics.selectionAsync();
    setSelectedFilters(prev => {
      if (prev.includes(filterKey)) {
        return prev.filter(f => f !== filterKey);
      } else {
        return [...prev, filterKey];
      }
    });
  }, []);

  // Get count of restaurants for a specific distance (within X miles)
  const getCountForDistance = useCallback((distance: number): number => {
    // Start with all places
    let filtered = [...places];

    // Apply type filter if any selected
    if (selectedFilters.length > 0) {
      filtered = filtered.filter((p) => {
        if (p.diningType === 'both') {
          return selectedFilters.includes('dine-in') || selectedFilters.includes('takeout');
        }
        return selectedFilters.includes(p.diningType as FilterType);
      });
    }

    // Apply distance filter - within X miles
    const withinDistance = filtered.filter((p) => {
      const placeDistance = p.distance ?? 0;
      return placeDistance <= distance;
    });

    return withinDistance.length;
  }, [places, selectedFilters]);

  const openInMaps = useCallback((place: Place) => {
    // Search by name + full address for accurate business lookup
    let searchQuery = place.name;

    if (place.address) {
      // Use the full address if available
      searchQuery = `${place.name}, ${place.address}`;
    } else if (userLocation) {
      // If no address, search near user's coordinates to find the right location
      searchQuery = `${place.name}`;
      // Use Apple Maps with near parameter for better local results
      const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(searchQuery)}&near=${userLocation.latitude},${userLocation.longitude}`;

      Linking.openURL(appleMapsUrl).catch(() => {
        const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
        Linking.openURL(googleUrl);
      });
      return;
    }

    const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(searchQuery)}`;

    Linking.openURL(appleMapsUrl).catch(() => {
      // Fallback to Google Maps
      const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
      Linking.openURL(googleUrl);
    });
  }, [userLocation]);

  const handleSpin = useCallback(() => {
    if (isSpinningRef.current || isLoading) return;

    const filters = selectedFilters.length > 0 ? selectedFilters : undefined;

    const maxDistance = getMaxDistance();
    const availablePlaces = getFilteredPlaces(filters, maxDistance);

    if (availablePlaces.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Clear any existing timeout
    if (cycleIntervalRef.current) {
      clearTimeout(cycleIntervalRef.current);
      cycleIntervalRef.current = null;
    }

    isSpinningRef.current = true;
    setIsSpinning(true);
    setSelectedPlace(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Hide current card
    cardOpacity.value = withTiming(0, { duration: 200 });
    cardTranslateY.value = withTiming(50, { duration: 200 });
    cardScale.value = withTiming(0.8, { duration: 200 });

    // Start golden glow animation that pulses
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 250 }),
        withTiming(0.4, { duration: 250 })
      ),
      -1,
      true
    );

    // Gentle scale pulse during spin
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 300, easing: Easing.in(Easing.quad) })
      ),
      -1,
      true
    );

    // Wheel of Fortune style spin - starts fast, gradually slows down
    // Total spin: multiple full rotations (1800-2520 degrees = 5-7 full spins)
    const totalRotation = 1800 + Math.random() * 720; // Random between 5-7 full spins
    const spinDuration = 3500; // 3.5 seconds total spin time

    rotation.value = withTiming(rotation.value + totalRotation, {
      duration: spinDuration,
      easing: Easing.out(Easing.cubic), // Natural deceleration like a real wheel
    });

    // Button press bounce at start
    scale.value = withSequence(
      withSpring(0.9, { damping: 8 }),
      withSpring(1.05, { damping: 6 }),
      withSpring(1, { damping: 10 })
    );

    // Shuffle the places for cycling so it looks random
    const shuffledForCycling = [...availablePlaces];
    for (let i = shuffledForCycling.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledForCycling[i], shuffledForCycling[j]] = [shuffledForCycling[j], shuffledForCycling[i]];
    }

    // Cycle through places rapidly (slot machine effect)
    setCyclingPlaces(shuffledForCycling);
    setCurrentCycleIndex(0);

    let cycleCount = 0;
    // More cycles to match the longer spin, with natural slowdown
    const totalCycles = 20;
    let currentDelay = 60;

    const cycleNext = () => {
      cycleCount++;
      // Pick a random index each time instead of sequential
      const randomIndex = Math.floor(Math.random() * shuffledForCycling.length);
      setCurrentCycleIndex(randomIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (cycleCount < totalCycles) {
        // Smooth deceleration curve matching the wheel spin
        const progress = cycleCount / totalCycles;
        // Exponential slowdown for natural feel
        currentDelay = 60 + Math.pow(progress, 2) * 400;
        cycleIntervalRef.current = setTimeout(cycleNext, currentDelay);
      } else {
        // Final selection after wheel stops
        setTimeout(() => {
          finishSpinAnimation(availablePlaces, filters, maxDistance);
        }, 200);
      }
    };

    cycleIntervalRef.current = setTimeout(cycleNext, currentDelay);
  }, [
    selectedFilters,
    isLoading,
    getFilteredPlaces,
    getMaxDistance,
    rotation,
    scale,
    cardOpacity,
    cardTranslateY,
    cardScale,
    glowOpacity,
    pulseScale,
  ]);

  const finishSpinAnimation = useCallback(
    (
      availablePlaces: Place[],
      filters: FilterType[] | undefined,
      maxDistance: number | undefined
    ) => {
      // Stop glow and pulse animations
      cancelAnimation(glowOpacity);
      cancelAnimation(pulseScale);

      // Fade out glow
      glowOpacity.value = withTiming(0, { duration: 400 });
      pulseScale.value = withTiming(1, { duration: 300 });

      // Add a satisfying wobble/bounce at the end like a real wheel settling
      const currentRotation = rotation.value;
      rotation.value = withSequence(
        withTiming(currentRotation + 8, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(currentRotation - 5, { duration: 120, easing: Easing.inOut(Easing.quad) }),
        withTiming(currentRotation + 3, { duration: 100, easing: Easing.inOut(Easing.quad) }),
        withTiming(currentRotation, { duration: 80, easing: Easing.out(Easing.quad) })
      );

      // Get final place
      const place = getRandomPlace(filters, maxDistance);

      setCyclingPlaces([]);
      isSpinningRef.current = false;
      setIsSpinning(false);

      if (place) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Increment spin count and check if we should show ad
        spinCountRef.current += 1;
        const shouldShowAd = !isPremium && spinCountRef.current >= AD_FREQUENCY;

        if (shouldShowAd) {
          // Reset counter and show rewarded ad
          spinCountRef.current = 0;
          setPendingPlace(place);
          setShowRewardedAd(true);
        } else {
          // Show result immediately (no ad this time)
          revealPlace(place);
        }
      }
    },
    [
      getRandomPlace,
      rotation,
      glowOpacity,
      pulseScale,
      isPremium,
    ]
  );

  const revealPlace = useCallback((place: Place) => {
    setSelectedPlace(place);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 100);

    cardScale.value = withSequence(
      withTiming(1.05, { duration: 200, easing: Easing.out(Easing.back(2)) }),
      withSpring(1, { damping: 10 })
    );
    cardOpacity.value = withDelay(100, withSpring(1, { damping: 15 }));
    cardTranslateY.value = withDelay(
      100,
      withSpring(0, { damping: 12, stiffness: 100 })
    );
  }, [cardOpacity, cardTranslateY, cardScale]);

  const handleRewardEarned = useCallback(() => {
    if (pendingPlace) {
      revealPlace(pendingPlace);
      setPendingPlace(null);
    }
  }, [pendingPlace, revealPlace]);

  const handleRewardedAdClose = useCallback(() => {
    setShowRewardedAd(false);
    // If user closes without watching, still show result (they just miss the "reward" experience)
    if (pendingPlace) {
      revealPlace(pendingPlace);
      setPendingPlace(null);
    }
  }, [pendingPlace, revealPlace]);

  const handleSelectPlace = useCallback((place: Place) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Add to visited
    addVisit({
      id: Date.now().toString(),
      placeId: place.id,
      visitedAt: new Date().toISOString(),
      rating: 0,
      notes: '',
      diningType: 'dine-in',
    });

    // Increment map open count and check if we should show ad
    mapOpenCountRef.current += 1;
    const shouldShowAd = !isPremium && mapOpenCountRef.current >= AD_FREQUENCY;

    if (shouldShowAd) {
      // Reset counter and show interstitial ad
      mapOpenCountRef.current = 0;
      setPendingMapPlace(place);
      setShowInterstitialAd(true);
    } else {
      // Open maps directly (no ad this time)
      openInMaps(place);
    }
  }, [addVisit, openInMaps, isPremium]);

  const handleInterstitialComplete = useCallback(() => {
    if (pendingMapPlace) {
      openInMaps(pendingMapPlace);
      setPendingMapPlace(null);
    }
  }, [pendingMapPlace, openInMaps]);

  const handleShare = useCallback(async (place: Place) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const appStoreLink = 'https://apps.apple.com/app/idk-eats/id6758054447';
    const shareMessage = `🍽️ IDK Eats picked ${place.name} for me!\n\n📍 ${place.address || 'Check it out!'}\n${place.rating ? `⭐ ${place.rating.toFixed(1)} rating` : ''}\n\nDownload IDK Eats to solve "I don't know what to eat" forever!\n${appStoreLink}`;

    try {
      // Use RNShare with URL - iOS will show App Store preview with app icon
      await RNShare.share({
        message: shareMessage,
        url: appStoreLink,
        title: 'IDK EATS',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  }, []);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }, { scale: cardScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const renderPriceLevel = (level: number) => {
    return (
      <Text className="text-emerald-400 font-semibold">
        {'$'.repeat(level)}
        <Text className="text-white/30">{'$'.repeat(4 - level)}</Text>
      </Text>
    );
  };

  const currentCyclingPlace =
    cyclingPlaces.length > 0 ? cyclingPlaces[currentCycleIndex] : null;

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#0f172a']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: isPremium ? insets.bottom + 100 : 160,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-6">
          <Image
            source={idkEatsLogo}
            style={{
              width: 400,
              height: 180,
              marginBottom: 8,
            }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontFamily: fontsLoaded ? 'Pacifico_400Regular' : undefined,
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
            }}
          >
            For when they say, "I don't know."
          </Text>
        </View>

        {/* Dining Type Filter Pills - Multi-select */}
        <View className="flex-row justify-center flex-wrap gap-2 mb-4">
          {FILTER_OPTIONS.map((item) => {
            const isActive = selectedFilters.includes(item.key);
            const Icon = item.icon;
            return (
              <Pressable
                key={item.key}
                onPress={() => toggleFilter(item.key)}
                className={cn(
                  'flex-row items-center px-4 py-2.5 rounded-full',
                  isActive ? 'bg-violet-600' : 'bg-white/10'
                )}
              >
                <Icon
                  size={16}
                  color={isActive ? '#fff' : 'rgba(255,255,255,0.6)'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={cn(
                    'font-medium',
                    isActive ? 'text-white' : 'text-white/60'
                  )}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedFilters.length === 0 && (
          <Text className="text-white/40 text-xs text-center mb-2">
            Tap to filter by type (or leave empty for all)
          </Text>
        )}

        {/* Distance Filter */}
        <View className="mb-8">
          {!locationPermission && (
            <View className="flex-row items-center justify-center mb-3">
              <Text className="text-amber-400/70 text-xs">(Location off)</Text>
            </View>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 8,
              justifyContent: 'center',
              flexGrow: 1,
            }}
            style={{ flexGrow: 0 }}
          >
            {DISTANCE_OPTIONS.map((option) => {
              const isActive = distanceFilter === option.key;
              const isDisabled = !locationPermission;
              const count = getCountForDistance(parseInt(option.key, 10));
              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    if (!isDisabled) {
                      Haptics.selectionAsync();
                      setDistanceFilter(option.key);
                    }
                  }}
                  disabled={isDisabled}
                  className={cn(
                    'px-4 py-2 rounded-full flex-row items-center gap-2',
                    isActive ? 'bg-fuchsia-600' : 'bg-white/10',
                    isDisabled && 'opacity-40'
                  )}
                >
                  <Text
                    className={cn(
                      'font-medium',
                      isActive ? 'text-white' : 'text-white/60'
                    )}
                  >
                    {option.label}
                  </Text>
                  <View className={cn(
                    'px-1.5 py-0.5 rounded-full min-w-[24px] items-center',
                    isActive ? 'bg-white/20' : 'bg-white/10'
                  )}>
                    <Text className={cn(
                      'text-xs font-medium',
                      isActive ? 'text-white' : 'text-white/50'
                    )}>
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View className="items-center py-8 mb-6">
            <ActivityIndicator size="large" color="#a78bfa" />
            <Text className="text-white/50 mt-4">Finding restaurants near you...</Text>
          </View>
        )}

        {/* Cycling Preview (during spin) */}
        {currentCyclingPlace && (
          <View className="bg-white/10 rounded-2xl p-4 border border-white/20 mb-6">
            <View className="flex-row items-center">
              <Image
                source={{ uri: currentCyclingPlace.imageUrl }}
                className="w-16 h-16 rounded-xl"
                resizeMode="cover"
              />
              <View className="ml-4 flex-1">
                <Text className="text-xl font-bold text-white" numberOfLines={1}>
                  {currentCyclingPlace.name}
                </Text>
                <Text className="text-white/50">{currentCyclingPlace.cuisine}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Result Card */}
        {selectedPlace && !isSpinning && (
          <Animated.View style={cardAnimatedStyle} className="mb-6">
            <Pressable onPress={() => handleSelectPlace(selectedPlace)}>
              <View className="bg-white/10 rounded-3xl overflow-hidden border border-white/10">
                <Image
                  source={{ uri: selectedPlace.imageUrl }}
                  className="w-full h-48"
                  resizeMode="cover"
                />
                <View className="p-5">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-2xl font-bold text-white mb-1">
                        {selectedPlace.name}
                      </Text>
                      <View className="flex-row items-center flex-wrap gap-2">
                        <View className="flex-row items-center">
                          <MapPin size={14} color="rgba(255,255,255,0.5)" />
                          <Text className="text-white/50 ml-1 text-sm">
                            {selectedPlace.distance?.toFixed(1)} mi
                          </Text>
                        </View>
                        {selectedPlace.rating && (
                          <View className="flex-row items-center">
                            <Star size={14} color="#fbbf24" fill="#fbbf24" />
                            <Text className="text-white/50 ml-1 text-sm">
                              {selectedPlace.rating.toFixed(1)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="items-end">
                      {renderPriceLevel(selectedPlace.priceLevel)}
                    </View>
                  </View>

                  <Text className="text-white/70 text-base mb-5" numberOfLines={2}>
                    {selectedPlace.address || selectedPlace.description}
                  </Text>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3">
                    {/* Open in Maps Button */}
                    <Pressable
                      onPress={() => handleSelectPlace(selectedPlace)}
                      className="flex-1 bg-violet-600 py-3.5 rounded-xl flex-row items-center justify-center active:opacity-80"
                    >
                      <ExternalLink size={18} color="#fff" />
                      <Text className="text-white font-semibold ml-2">
                        Open in Maps
                      </Text>
                    </Pressable>

                    {/* Share Button */}
                    <Pressable
                      onPress={() => handleShare(selectedPlace)}
                      className="bg-amber-500 py-3.5 px-5 rounded-xl flex-row items-center justify-center active:opacity-80"
                    >
                      <Share size={18} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Empty State */}
        {!selectedPlace && !isSpinning && !currentCyclingPlace && !isLoading && (
          <View className="items-center py-8 mb-6">
            <View className="w-20 h-20 rounded-full bg-white/5 items-center justify-center mb-4">
              <Utensils size={32} color="rgba(255,255,255,0.3)" />
            </View>
            <Text className="text-white/30 text-center">
              {places.length > 0
                ? `${places.length} restaurants found nearby!\nHit the button to pick one!`
                : 'Enable location to find\nrestaurants near you!'}
            </Text>
          </View>
        )}

        {/* Spin Button */}
        <View className="items-center mb-8">
          <Animated.View
            style={[
              glowAnimatedStyle,
              {
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: 150,
                backgroundColor: '#f59e0b',
                shadowColor: '#f59e0b',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 100,
              },
            ]}
          />

          <Pressable onPress={handleSpin} disabled={isSpinning || isLoading || places.length === 0}>
            <Animated.View
              style={[
                buttonAnimatedStyle,
                {
                  width: 260,
                  height: 260,
                  borderRadius: 130,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  opacity: places.length === 0 ? 0.5 : 1,
                },
              ]}
            >
              <View style={{ width: 260, height: 260, borderRadius: 130, overflow: 'hidden' }}>
                <Image
                  source={spinWheelImage}
                  style={{
                    width: 260,
                    height: 260,
                  }}
                  resizeMode="cover"
                />
              </View>
            </Animated.View>
          </Pressable>
          <Text className="text-white/40 mt-4 text-sm">
            {isSpinning ? 'Finding your meal...' : isLoading ? 'Loading...' : 'Tap to spin'}
          </Text>
        </View>
      </ScrollView>

      {/* Banner Ad for non-premium users */}
      {!isPremium && (
        <View style={{ paddingBottom: insets.bottom > 0 ? 0 : 0 }}>
          <BannerAdPlaceholder onRemoveAds={() => router.push('/upgrade')} />
        </View>
      )}

      {/* Premium badge for premium users */}
      {isPremium && (
        <View
          className="absolute right-4 bg-violet-600/20 px-3 py-1.5 rounded-full flex-row items-center"
          style={{ top: insets.top + 8 }}
        >
          <Crown size={14} color="#a78bfa" />
          <Text className="text-violet-400 text-xs font-medium ml-1">Premium</Text>
        </View>
      )}

      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        visible={showRewardedAd}
        onClose={handleRewardedAdClose}
        onRewardEarned={handleRewardEarned}
        title="Watch to Reveal"
        description="Watch a short ad to see your restaurant pick!"
      />

      {/* Interstitial Ad Modal */}
      <InterstitialAdModal
        visible={showInterstitialAd}
        onClose={() => setShowInterstitialAd(false)}
        onAdComplete={handleInterstitialComplete}
        duration={3}
      />
    </View>
  );
}