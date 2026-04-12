'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { useAppStore } from '@/store';

// Import generated city data
import * as pugetSound from '@/data/cities/puget-sound';

/**
 * City context — provides the active city's data to all components.
 *
 * Currently supports SF Bay (full) and Salish Sea (auto-generated).
 * Components use `useCity()` instead of importing `sfBay` directly.
 */

export interface CityData {
  id: string;
  name: string;
  center: [number, number];
  defaultZoom: number;
  destinations: any[];
  zones: any[];
  distances: Record<string, number>;
  verifyLinks: any[];
}

const CITY_DATA: Record<string, CityData> = {
  'sf-bay': {
    id: 'sf-bay',
    name: 'San Francisco Bay',
    center: sfBay.center as [number, number],
    defaultZoom: sfBay.defaultZoom,
    destinations: sfBay.destinations,
    zones: sfBay.zones,
    distances: sfBay.distances,
    verifyLinks: sfBay.verifyLinks,
  },
  'puget-sound': {
    id: 'puget-sound',
    name: 'Salish Sea',
    center: [48.0, -122.6],
    defaultZoom: 9,
    destinations: pugetSound.puget_sound?.destinations ?? [],
    zones: pugetSound.puget_sound?.zones ?? [],
    distances: pugetSound.puget_sound?.distances ?? {},
    verifyLinks: pugetSound.puget_sound?.verifyLinks ?? [],
  },
};

export const AVAILABLE_CITIES = Object.values(CITY_DATA).map(c => ({
  id: c.id,
  name: c.name,
}));

const CityContext = createContext<CityData>(CITY_DATA['sf-bay']);

export function CityProvider({ children }: { children: ReactNode }) {
  const cityId = useAppStore(s => s.cityId ?? 'sf-bay');
  const city = useMemo(() => CITY_DATA[cityId] ?? CITY_DATA['sf-bay'], [cityId]);

  return (
    <CityContext.Provider value={city}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity(): CityData {
  return useContext(CityContext);
}
