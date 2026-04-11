import { useMemo } from 'react';
import { useCurrents } from './useCurrents';

// NOAA CO-OPS current prediction station positions on SF Bay
const CURRENT_STATIONS = [
  { id: 'SFB1201', name: 'Golden Gate', lat: 37.8167, lng: -122.4667, floodDir: 90, ebbDir: 270 },
  { id: 'SFB1203', name: 'Alcatraz', lat: 37.8267, lng: -122.4233, floodDir: 60, ebbDir: 240 },
  { id: 'SFB1205', name: 'Bay Bridge', lat: 37.7983, lng: -122.3717, floodDir: 90, ebbDir: 270 },
  { id: 'SFB1212', name: 'Raccoon Strait', lat: 37.8583, lng: -122.4467, floodDir: 45, ebbDir: 225 },
  { id: 'PCT0261', name: 'Fort Point', lat: 37.8108, lng: -122.4769, floodDir: 80, ebbDir: 260 },
];

/**
 * Generate GeoJSON for current flow arrow indicators at NOAA stations.
 * Shows direction (flood=inward, ebb=outward) and speed.
 */
export function useCurrentFlowGeoJSON() {
  const { currentData } = useCurrents();

  return useMemo(() => {
    const features = CURRENT_STATIONS.map(station => {
      const data = currentData?.[station.id];
      const speed = data?.speed ?? -1;
      const type = data?.type ?? 'slack';
      const rotation = type === 'flood' ? station.floodDir : type === 'ebb' ? station.ebbDir : 0;
      const color = speed < 0 ? '#6b7280' : speed > 3 ? '#ef4444' : speed > 1.5 ? '#f59e0b' : '#10b981';
      const label = speed < 0 ? '--' : `${speed.toFixed(1)} kt`;

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [station.lng, station.lat],
        },
        properties: {
          id: station.id,
          name: station.name,
          speed,
          type,
          rotation,
          color,
          label: `${label} ${type}`,
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [currentData]);
}
