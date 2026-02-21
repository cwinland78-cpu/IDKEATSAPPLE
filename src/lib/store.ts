import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchNearbyRestaurants } from './restaurantService';

export type DiningType = 'dine-in' | 'takeout' | 'bar' | 'both';

export interface Place {
  id: string;
  name: string;
  cuisine: string;
  diningType: DiningType;
  priceLevel: 1 | 2 | 3 | 4;
  imageUrl: string;
  description: string;
  latitude: number;
  longitude: number;
  distance?: number;
  address?: string;
  rating?: number;
  isBar?: boolean;
}

export interface VisitedPlace {
  id: string;
  placeId: string;
  visitedAt: string;
  rating: number;
  notes: string;
  diningType: 'dine-in' | 'takeout' | 'bar';
}

export type DistanceFilter = '2' | '4' | '8';

export type FilterType = 'dine-in' | 'takeout' | 'bar';

interface PlacesState {
  places: Place[];
  visitedPlaces: VisitedPlace[];
  recentlySelectedIds: string[]; // Track recently selected to improve randomness
  isLoading: boolean;
  error: string | null;
  cachedLocation: {
    latitude: number;
    longitude: number;
    timestamp: number;
  } | null;
  setPlaces: (places: Place[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addVisit: (visit: VisitedPlace) => void;
  removeVisit: (visitId: string) => void;
  updateVisitRating: (visitId: string, rating: number, notes?: string) => void;
  getRandomPlace: (
    filters?: FilterType[],
    maxDistance?: number
  ) => Place | null;
  getFilteredPlaces: (
    filters?: FilterType[],
    maxDistance?: number
  ) => Place[];
  fetchRealRestaurants: (userLat: number, userLng: number) => Promise<void>;
  setCachedLocation: (latitude: number, longitude: number) => void;
  getCachedLocation: () => { latitude: number; longitude: number } | null;
}

// Haversine formula to calculate distance between two points in miles
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const usePlacesStore = create<PlacesState>()(
  persist(
    (set, get) => ({
      places: [],
      visitedPlaces: [],
      recentlySelectedIds: [],
      isLoading: false,
      error: null,
      cachedLocation: null,

      setPlaces: (places) => set({ places }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      setCachedLocation: (latitude: number, longitude: number) => {
        set({
          cachedLocation: {
            latitude,
            longitude,
            timestamp: Date.now(),
          },
        });
      },

      getCachedLocation: () => {
        const { cachedLocation } = get();
        if (!cachedLocation) return null;

        // Check if cache is less than 15 minutes old
        const fifteenMinutes = 15 * 60 * 1000;
        const isValid = Date.now() - cachedLocation.timestamp < fifteenMinutes;

        if (isValid) {
          return {
            latitude: cachedLocation.latitude,
            longitude: cachedLocation.longitude,
          };
        }

        return null;
      },

      addVisit: (visit) =>
        set((state) => ({
          visitedPlaces: [visit, ...state.visitedPlaces],
        })),

      removeVisit: (visitId) =>
        set((state) => ({
          visitedPlaces: state.visitedPlaces.filter((v) => v.id !== visitId),
        })),

      updateVisitRating: (visitId, rating, notes) =>
        set((state) => ({
          visitedPlaces: state.visitedPlaces.map((v) =>
            v.id === visitId ? { ...v, rating, notes: notes ?? v.notes } : v
          ),
        })),

      fetchRealRestaurants: async (userLat: number, userLng: number) => {
        set({ isLoading: true, error: null, recentlySelectedIds: [] }); // Clear history on fresh fetch

        try {
          const restaurants = await fetchNearbyRestaurants(userLat, userLng, 15);

          if (restaurants.length === 0) {
            set({
              places: [],
              isLoading: false,
              error: 'No restaurants found nearby. Try a different location.',
            });
            return;
          }

          // Shuffle the restaurants on load for variety
          const shuffled = [...restaurants];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          set({ places: shuffled, isLoading: false, error: null });
        } catch (error) {
          console.error('Failed to fetch restaurants:', error);
          set({
            isLoading: false,
            error: 'Failed to load restaurants. Please try again.',
          });
        }
      },

      getFilteredPlaces: (filters, maxDistance) => {
        const { places } = get();
        let filtered = [...places];

        // If filters are provided, filter by them (multiple can be selected)
        if (filters && filters.length > 0) {
          filtered = filtered.filter((p) => {
            // If place is 'both', it matches dine-in and takeout
            if (p.diningType === 'both') {
              return filters.includes('dine-in') || filters.includes('takeout');
            }
            // Check if place's dining type is in the selected filters
            return filters.includes(p.diningType as FilterType);
          });
        }

        // Distance filter - within X miles
        if (maxDistance !== undefined && maxDistance > 0) {
          filtered = filtered.filter((p) => (p.distance ?? 0) <= maxDistance);
        }

        return filtered;
      },

      getRandomPlace: (filters, maxDistance) => {
        const { getFilteredPlaces, recentlySelectedIds } = get();
        const filtered = getFilteredPlaces(filters, maxDistance);

        if (filtered.length === 0) return null;

        // Track 80% of available places to ensure we cycle through almost all of them
        // before repeating. For 34 places, this means tracking ~27 places.
        const maxHistory = Math.max(5, Math.floor(filtered.length * 0.8));

        // Get the last selected place ID (most recently picked)
        const lastSelectedId = recentlySelectedIds.length > 0 ? recentlySelectedIds[0] : null;

        // Filter out ALL recently selected places for true variety
        let candidates = filtered.filter(
          (p) => !recentlySelectedIds.slice(0, maxHistory).includes(p.id)
        );

        // If we've gone through all places, reset but still exclude the last one
        if (candidates.length === 0) {
          candidates = filtered.filter((p) => p.id !== lastSelectedId);
          // If still empty (only 1 place), use all
          if (candidates.length === 0) {
            candidates = filtered;
          }
          // Clear history since we're starting fresh
          set({ recentlySelectedIds: lastSelectedId ? [lastSelectedId] : [] });
        }

        // Simple but effective random selection
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const selectedPlace = candidates[randomIndex];

        // Track this selection
        const newRecentlySelected = [
          selectedPlace.id,
          ...recentlySelectedIds.filter((id) => id !== selectedPlace.id),
        ].slice(0, maxHistory);
        set({ recentlySelectedIds: newRecentlySelected });

        return selectedPlace;
      },
    }),
    {
      name: 'places-storage-v4',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ visitedPlaces: state.visitedPlaces }),
    }
  )
);