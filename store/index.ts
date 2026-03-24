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

  // Vessel
  vessel: VesselProfile;
  setVessel: (v: VesselProfile) => void;
  setVesselPreset: (type: 'kayak' | 'powerboat' | 'sailboat') => void;

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

// Default to kayak preset
const defaultVessel = vesselPresets.find((v) => v.type === 'kayak') ?? vesselPresets[0];

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // Filters — defaults
      activity: 'kayak_sup',
      month: 2, // March (0-indexed) — safe default, no hydration mismatch
      hour: 9, // 9 AM
      setActivity: (activity) => set({ activity }, undefined, 'setActivity'),
      setMonth: (month) => set({ month }, undefined, 'setMonth'),
      setHour: (hour) => set({ hour }, undefined, 'setHour'),

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
