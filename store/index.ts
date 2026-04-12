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
  savedAt: number;
}

export interface InboxItem {
  id: string;
  type: 'perfect-day' | 'alert' | 'feedback-thanks' | 'event-reminder' | 'system';
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  archived: boolean;
  /** Link to open when tapped */
  href?: string;
  /** Activity this relates to */
  activity?: ActivityType;
}

export interface FeedbackEntry {
  date: string; // ISO date
  activity: ActivityType;
  originId: string;
  predictedTier: string;
  actualRating: 'better' | 'about-right' | 'worse';
  timestamp: number;
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

  // Inbox (notifications)
  inbox: InboxItem[];
  addInboxItem: (item: Omit<InboxItem, 'id' | 'timestamp' | 'read' | 'archived'>) => void;
  markRead: (id: string) => void;
  archiveItem: (id: string) => void;
  deleteItem: (id: string) => void;
  // Accuracy feedback
  feedbackLog: FeedbackEntry[];
  addFeedback: (entry: Omit<FeedbackEntry, 'timestamp'>) => void;

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
          fishing_boat: 'powerboat',
          fishing_kayak: 'kayak',
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

      // Inbox
      inbox: [],
      addInboxItem: (item) => set((state) => ({
        inbox: [{ ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: Date.now(), read: false, archived: false }, ...state.inbox].slice(0, 100),
      })),
      markRead: (id) => set((state) => ({
        inbox: state.inbox.map(i => i.id === id ? { ...i, read: true } : i),
      })),
      archiveItem: (id) => set((state) => ({
        inbox: state.inbox.map(i => i.id === id ? { ...i, archived: true } : i),
      })),
      deleteItem: (id) => set((state) => ({
        inbox: state.inbox.filter(i => i.id !== id),
      })),

      // Accuracy feedback
      feedbackLog: [],
      addFeedback: (entry: Omit<FeedbackEntry, 'timestamp'>) => set((state) => ({
        feedbackLog: [{ ...entry, timestamp: Date.now() }, ...state.feedbackLog].slice(0, 200),
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
        inbox: state.inbox,
        feedbackLog: state.feedbackLog,
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
