import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Image, ScrollView, Modal, TextInput, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import {
  Star,
  Utensils,
  ShoppingBag,
  Calendar,
  X,
  Clock,
  Trash2,
  HelpCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { usePlacesStore, VisitedPlace, Place } from '@/lib/store';
import { cn } from '@/lib/cn';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedVisit, setSelectedVisit] = useState<VisitedPlace | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const visitedPlaces = usePlacesStore((s) => s.visitedPlaces);
  const places = usePlacesStore((s) => s.places);
  const updateVisitRating = usePlacesStore((s) => s.updateVisitRating);
  const removeVisit = usePlacesStore((s) => s.removeVisit);

  const getPlaceById = useCallback(
    (id: string): Place | undefined => {
      return places.find((p) => p.id === id);
    },
    [places]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const openRatingModal = (visit: VisitedPlace) => {
    setSelectedVisit(visit);
    setRating(visit.rating);
    setNotes(visit.notes);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveRating = () => {
    if (selectedVisit) {
      updateVisitRating(selectedVisit.id, rating, notes);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedVisit(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleDelete = () => {
    if (selectedVisit) {
      removeVisit(selectedVisit.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedVisit(null);
      setShowDeleteConfirm(false);
    }
  };

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    return (
      <View className="flex-row gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => {
              if (interactive) {
                Haptics.selectionAsync();
                setRating(star);
              }
            }}
            disabled={!interactive}
          >
            <Star
              size={interactive ? 32 : 16}
              color={star <= currentRating ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
              fill={star <= currentRating ? '#fbbf24' : 'transparent'}
            />
          </Pressable>
        ))}
      </View>
    );
  };

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
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6 flex-row items-start justify-between">
          <View>
            <Text className="text-3xl font-bold text-white mb-1">Your History</Text>
            <Text className="text-white/60 text-base">
              {visitedPlaces.length} places visited
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/support')}
            className="p-3 rounded-full bg-white/10 active:bg-white/20"
          >
            <HelpCircle size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Visit List */}
        {visitedPlaces.length > 0 ? (
          <View className="gap-4">
            {visitedPlaces.map((visit, index) => {
              const place = getPlaceById(visit.placeId);
              if (!place) return null;

              return (
                <Animated.View
                  key={visit.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                >
                  <Pressable
                    onPress={() => openRatingModal(visit)}
                    className="bg-white/10 rounded-2xl overflow-hidden border border-white/10 active:opacity-80"
                  >
                    <View className="flex-row">
                      <Image
                        source={{ uri: place.imageUrl }}
                        className="w-28 h-28"
                        resizeMode="cover"
                      />
                      <View className="flex-1 p-4 justify-center">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-lg font-semibold text-white flex-1">
                            {place.name}
                          </Text>
                          <View
                            className={cn(
                              'px-2 py-1 rounded-full',
                              visit.diningType === 'dine-in'
                                ? 'bg-violet-600/30'
                                : 'bg-fuchsia-600/30'
                            )}
                          >
                            {visit.diningType === 'dine-in' ? (
                              <Utensils size={12} color="#a78bfa" />
                            ) : (
                              <ShoppingBag size={12} color="#e879f9" />
                            )}
                          </View>
                        </View>

                        <View className="flex-row items-center mb-2">
                          <Clock size={12} color="rgba(255,255,255,0.4)" />
                          <Text className="text-white/40 ml-1 text-xs">
                            {formatDate(visit.visitedAt)}
                          </Text>
                        </View>

                        {visit.rating > 0 ? (
                          renderStars(visit.rating)
                        ) : (
                          <Text className="text-amber-400/70 text-sm">
                            Tap to rate
                          </Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        ) : (
          <View className="items-center py-16">
            <View className="w-24 h-24 rounded-full bg-white/5 items-center justify-center mb-4">
              <Calendar size={40} color="rgba(255,255,255,0.3)" />
            </View>
            <Text className="text-white/30 text-center text-lg mb-2">
              No visits yet
            </Text>
            <Text className="text-white/20 text-center">
              Spin for a place and mark it as visited{'\n'}to start tracking!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={selectedVisit !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          Keyboard.dismiss();
          setSelectedVisit(null);
          setShowDeleteConfirm(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/70 justify-end pb-8 px-6"
            onPress={() => {
              Keyboard.dismiss();
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-3xl w-full p-6 border border-white/10"
            >
              {selectedVisit && (
                <>
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-xl font-bold text-white">Rate Your Visit</Text>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 rounded-full bg-red-500/20"
                      >
                        <Trash2 size={20} color="#ef4444" />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Keyboard.dismiss();
                          setSelectedVisit(null);
                          setShowDeleteConfirm(false);
                        }}
                        className="p-2 rounded-full bg-white/10"
                      >
                        <X size={20} color="#fff" />
                      </Pressable>
                    </View>
                  </View>

                  {showDeleteConfirm ? (
                    <View className="items-center py-4">
                      <Text className="text-white text-lg mb-4 text-center">
                        Delete this visit?
                      </Text>
                      <View className="flex-row gap-3 w-full">
                        <Pressable
                          onPress={() => setShowDeleteConfirm(false)}
                          className="flex-1 bg-white/10 py-3 rounded-xl items-center active:opacity-80"
                        >
                          <Text className="text-white font-semibold">Cancel</Text>
                        </Pressable>
                        <Pressable
                          onPress={handleDelete}
                          className="flex-1 bg-red-500 py-3 rounded-xl items-center active:opacity-80"
                        >
                          <Text className="text-white font-semibold">Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View className="items-center mb-6">
                        <Text className="text-white/60 mb-3">How was it?</Text>
                        {renderStars(rating, true)}
                      </View>

                      <View className="mb-6">
                        <Text className="text-white/60 mb-2">Notes (optional)</Text>
                        <TextInput
                          value={notes}
                          onChangeText={setNotes}
                          placeholder="What did you have? How was the service?"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          multiline
                          numberOfLines={3}
                          className="bg-white/10 rounded-xl p-4 text-white min-h-[100px]"
                          style={{ textAlignVertical: 'top' }}
                          blurOnSubmit={true}
                          returnKeyType="done"
                        />
                      </View>

                      <Pressable
                        onPress={() => {
                          Keyboard.dismiss();
                          saveRating();
                        }}
                        className="bg-violet-600 py-4 rounded-xl items-center active:opacity-80"
                      >
                        <Text className="text-white font-semibold text-base">
                          Save Rating
                        </Text>
                      </Pressable>
                    </>
                  )}
                </>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
