import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActivityType, VesselProfile } from '@/engine/types';
import { vesselPresets } from '@/data/vessels';

// ============================================
// WhenToBoat Global Store
// Persists user preferences to localStorage
// ============================================

export interface SavedRoute {
  originId: string;
  destinationId: string;
  activity: ActivityType;
  savedAt: number; // timestamp
}

interface AppState {
  // Filters
  activity: ActivityType;
  month: number;
  hour: number;
  setActivity: (a: ActivityType) => void;
  setMonth: (m: number) => void;
  setHour: (h: number) => void;

  // Home base
  homeBaseId: string;
  setHomeBase: (id: string) => void;

  // Vessel
  vessel: VesselProfile;
  setVessel: (v: VesselProfile) => void;
  setVesselPreset: (type: string) => void;

  // Saved routes (bookmarks)
  savedRoutes: SavedRoute[];
  saveRoute: (originId: string, destinationId: string, activity: ActivityType) => void;
  removeSavedRoute: (originId: string, destinationId: string) => void;

  // Trajectory (ephemeral — not persisted)
  selectedOriginId: string | null;
  setSelectedOrigin: (id: string | null) => void;
}

const defaultVessel = vesselPresets.find((v) => v.type === 'kayak') ?? vesselPresets[0];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Filters
      activity: 'kayak',
      month: new Date().getMonth(),
      hour: 9,
      setActivity: (activity: ActivityType) => {
        const vesselMap: Record<string, string> = {
          kayak: 'kayak',
          sup: 'sup',
          powerboat_cruise: 'powerboat',
          casual_sail: 'sailboat',
        };
        const vesselType = vesselMap[activity];
        const preset = vesselPresets.find((v) => v.type === vesselType);
        set({ activity, ...(preset ? { vessel: preset } : {}) });
      },
      setMonth: (month: number) => set({ month }),
      setHour: (hour: number) => set({ hour }),

      // Home base
      homeBaseId: 'sau',
      setHomeBase: (id: string) => set({ homeBaseId: id, selectedOriginId: id }),

      // Vessel
      vessel: defaultVessel,
      setVessel: (vessel: VesselProfile) => set({ vessel }),
      setVesselPreset: (type: string) => {
        const preset = vesselPresets.find((v) => v.type === type);
        if (preset) set({ vessel: preset });
      },

      // Saved routes (bookmarks)
      savedRoutes: [],
      saveRoute: (originId, destinationId, activity) => set((state) => {
        const exists = state.savedRoutes.some(r => r.originId === originId && r.destinationId === destinationId);
        if (exists) return state;
        return { savedRoutes: [...state.savedRoutes, { originId, destinationId, activity, savedAt: Date.now() }] };
      }),
      removeSavedRoute: (originId, destinationId) => set((state) => ({
        savedRoutes: state.savedRoutes.filter(r => !(r.originId === originId && r.destinationId === destinationId)),
      })),

      // Trajectory (ephemeral)
      selectedOriginId: null,
      setSelectedOrigin: (id: string | null) => set({ selectedOriginId: id }),
    }),
    {
      name: 'whentoboat-prefs',
      // Only persist user preferences, not ephemeral UI state
      partialize: (state) => ({
        activity: state.activity,
        month: state.month,
        hour: state.hour,
        homeBaseId: state.homeBaseId,
        vessel: state.vessel,
        savedRoutes: state.savedRoutes,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to restore preferences — resetting to defaults');
          try { localStorage.removeItem('whentoboat-prefs'); } catch {}
        }
      },
    }
  )
);
