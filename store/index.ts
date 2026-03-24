import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ActivityType, VesselProfile, TrajectoryAnalysis } from '@/engine/types';
import { vesselPresets } from '@/data/vessels';

// ============================================
// WhenToBoat Global Store
// ============================================

interface AppState {
  // Filters
  activity: ActivityType;
  month: number; // 0-11
  hour: number; // 5-22
  setActivity: (a: ActivityType) => void;
  setMonth: (m: number) => void;
  setHour: (h: number) => void;

  // Home base / origin
  homeBaseId: string; // user's selected departure point
  setHomeBase: (id: string) => void;

  // Vessel
  vessel: VesselProfile;
  setVessel: (v: VesselProfile) => void;
  setVesselPreset: (type: string) => void;

  // Trajectory selection
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
    (set) => ({
      // Filters
      activity: 'kayak',
      month: 2, // March — safe default
      hour: 9,
      setActivity: (activity) => {
        // Auto-switch vessel when activity changes
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

      // Home base — defaults to Sausalito, persisted per session
      homeBaseId: 'sau',
      setHomeBase: (id) => set({ homeBaseId: id, selectedOriginId: id }, undefined, 'setHomeBase'),

      // Vessel
      vessel: defaultVessel,
      setVessel: (vessel) => set({ vessel }, undefined, 'setVessel'),
      setVesselPreset: (type) => {
        const preset = vesselPresets.find((v) => v.type === type);
        if (preset) set({ vessel: preset }, undefined, 'setVesselPreset');
      },

      // Trajectory
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
    { name: 'WhenToBoat' }
  )
);
