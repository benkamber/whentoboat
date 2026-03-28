import { useState, useEffect, useCallback } from 'react';
import type { VesselProfile, VesselType } from '@/engine/types';
import { vesselPresets } from '@/data/vessels';
import { useAppStore } from '@/store';

const STORAGE_KEY = 'whentoboat-vessels';

/**
 * Hook for managing multiple saved vessel profiles.
 * Vessels persist in localStorage.
 */
export function useVesselManager() {
  const [savedVessels, setSavedVessels] = useState<VesselProfile[]>([]);
  const { vessel: activeVessel, setVessel } = useAppStore();

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setSavedVessels(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage
  const persist = useCallback((vessels: VesselProfile[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vessels));
    } catch {
      // ignore
    }
  }, []);

  const saveVessel = useCallback((vessel: VesselProfile) => {
    const id = vessel.id || `vessel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const withId = { ...vessel, id };

    setSavedVessels(prev => {
      const existing = prev.findIndex(v => v.id === id);
      let updated: VesselProfile[];
      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = withId;
      } else {
        updated = [...prev, withId];
      }
      persist(updated);
      return updated;
    });

    return withId;
  }, [persist]);

  const deleteVessel = useCallback((id: string) => {
    setSavedVessels(prev => {
      const updated = prev.filter(v => v.id !== id);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const selectVessel = useCallback((vessel: VesselProfile) => {
    setVessel(vessel);
  }, [setVessel]);

  // All available vessels: presets + saved
  const allVessels = [...vesselPresets, ...savedVessels];

  return {
    savedVessels,
    presets: vesselPresets,
    allVessels,
    activeVessel,
    saveVessel,
    deleteVessel,
    selectVessel,
  };
}

/**
 * Template configurations for creating new vessels of each type.
 */
export const vesselTemplates: Record<VesselType, Partial<VesselProfile>> = {
  kayak: {
    type: 'kayak',
    name: 'My Kayak',
    loa: 14,
    cruiseSpeed: 4,
    fuelCapacity: null,
    gph: null,
    draft: 0.5,
    maxEnduranceHours: 2.5,
    hullType: 'sit-on-top',
    engineType: 'paddle',
    passengers: 1,
  },
  sup: {
    type: 'sup',
    name: 'My SUP',
    loa: 11,
    cruiseSpeed: 3,
    fuelCapacity: null,
    gph: null,
    draft: 0.3,
    maxEnduranceHours: 2,
    hullType: 'inflatable',
    engineType: 'paddle',
    passengers: 1,
  },
  powerboat: {
    type: 'powerboat',
    name: 'My Powerboat',
    loa: 21,
    cruiseSpeed: 30,
    fuelCapacity: 66,
    gph: 9,
    draft: 2,
    maxEnduranceHours: null,
    hullType: 'deep-v',
    engineType: 'Outboard',
    passengers: 6,
  },
  sailboat: {
    type: 'sailboat',
    name: 'My Sailboat',
    loa: 30,
    cruiseSpeed: 6,
    fuelCapacity: 20,
    gph: 1.5,
    draft: 5,
    maxEnduranceHours: null,
    hullType: 'displacement',
    keelType: 'fin',
    sailArea: 400,
    engineType: 'Auxiliary inboard',
    passengers: 6,
  },
};
