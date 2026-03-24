import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ActivityType, VesselProfile, TrajectoryAnalysis } from '@/engine/types';
import { vesselPresets } from '@/data/vessels';

// ============================================
// WhenToBoat Global Store
// Persists user preferences to localStorage
// ============================================

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

  // Trajectory (ephemeral — not persisted)
  selectedOriginId: string | null;
  selectedDestinationId: string | null;
  trajectoryAnalysis: TrajectoryAnalysis | null;
  setSelectedOrigin: (id: string | null) => void;
  setSelectedDestination: (id: string | null) => void;
  setTrajectoryAnalysis: (t: TrajectoryAnalysis | null) => void;

  // UI
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const defaultVessel = vesselPresets.find((v) => v.type === 'kayak') ?? vesselPresets[0];

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Filters
        activity: 'kayak',
        month: 2,
        hour: 9,
        setActivity: (activity) => {
          const vesselMap: Record<string, string> = {
            kayak: 'kayak',
            sup: 'sup',
            powerboat_cruise: 'powerboat',
            casual_sail: 'sailboat',
          };
          const vesselType = vesselMap[activity];
          const preset = vesselPresets.find((v) => v.type === vesselType);
          set(
            { activity, ...(preset ? { vessel: preset } : {}) },
            undefined,
            'setActivity'
          );
        },
        setMonth: (month) => set({ month }, undefined, 'setMonth'),
        setHour: (hour) => set({ hour }, undefined, 'setHour'),

        // Home base
        homeBaseId: 'sau',
        setHomeBase: (id) => set({ homeBaseId: id, selectedOriginId: id }, undefined, 'setHomeBase'),

        // Vessel
        vessel: defaultVessel,
        setVessel: (vessel) => set({ vessel }, undefined, 'setVessel'),
        setVesselPreset: (type) => {
          const preset = vesselPresets.find((v) => v.type === type);
          if (preset) set({ vessel: preset }, undefined, 'setVesselPreset');
        },

        // Trajectory (ephemeral)
        selectedOriginId: null,
        selectedDestinationId: null,
        trajectoryAnalysis: null,
        setSelectedOrigin: (id) => set({ selectedOriginId: id }, undefined, 'setSelectedOrigin'),
        setSelectedDestination: (id) =>
          set({ selectedDestinationId: id }, undefined, 'setSelectedDestination'),
        setTrajectoryAnalysis: (t) =>
          set({ trajectoryAnalysis: t }, undefined, 'setTrajectoryAnalysis'),

        // UI
        darkMode: true,
        toggleDarkMode: () =>
          set((state) => {
            const next = !state.darkMode;
            if (typeof document !== 'undefined') {
              document.documentElement.classList.toggle('dark', next);
            }
            return { darkMode: next };
          }, undefined, 'toggleDarkMode'),
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
          darkMode: state.darkMode,
        }),
      }
    ),
    { name: 'WhenToBoat' }
  )
);
