import { useMemo } from 'react';
import { useAppStore } from '@/store';
import { zoneBoundaries } from '@/data/cities/sf-bay/zone-boundaries';
import { zones } from '@/data/cities/sf-bay/zones';

const COMFORT_FILLS: Record<string, string> = {
  great:   '#10b981', // green — comfort 7-10
  ok:      '#f59e0b', // amber — comfort 4-6
  poor:    '#ef4444', // red   — comfort 1-3
};

function comfortColor(comfort: number): string {
  if (comfort >= 7) return COMFORT_FILLS.great;
  if (comfort >= 4) return COMFORT_FILLS.ok;
  return COMFORT_FILLS.poor;
}

/**
 * Generate GeoJSON for zone comfort overlay polygons.
 * Colors zones by comfort score for the selected month and time of day.
 */
export function useZoneOverlayGeoJSON() {
  const { month, hour } = useAppStore();
  const isAM = hour < 12;

  return useMemo(() => {
    const features = zoneBoundaries.map(zb => {
      const zone = zones.find(z => z.id === zb.zoneId);
      const mc = zone?.monthlyConditions[month];
      const conditions = mc ? (isAM ? mc.am : mc.pm) : null;
      const comfort = conditions?.comfort ?? 5;

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [zb.polygon],
        },
        properties: {
          zoneId: zb.zoneId,
          zoneName: zone?.name ?? zb.zoneId,
          comfort,
          color: comfortColor(comfort),
          windKts: conditions?.windKts ?? 0,
          waveHtFt: conditions?.waveHtFt ?? 0,
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [month, isAM]);
}

/**
 * Generate GeoJSON for wind arrow indicators at zone centroids.
 * Shows wind speed and prevailing direction for each zone.
 */
export function useWindArrowsGeoJSON() {
  const { month, hour } = useAppStore();
  const isAM = hour < 12;

  return useMemo(() => {
    const features = zoneBoundaries
      .filter(zb => !zb.zoneId.startsWith('ocean')) // Only Bay zones
      .map(zb => {
        const zone = zones.find(z => z.id === zb.zoneId);
        const mc = zone?.monthlyConditions[month];
        const conditions = mc ? (isAM ? mc.am : mc.pm) : null;
        const windKts = conditions?.windKts ?? 0;

        // Compute centroid from polygon vertices
        const coords = zb.polygon;
        const n = coords.length - 1; // Exclude closing vertex
        let cLng = 0, cLat = 0;
        for (let i = 0; i < n; i++) {
          cLng += coords[i][0];
          cLat += coords[i][1];
        }
        cLng /= n;
        cLat /= n;

        // SF Bay prevailing wind is westerly (270°) — varies slightly by zone
        // Summer: strong NW (300-315°), Winter: variable (180-270°)
        const isSummer = month >= 3 && month <= 8;
        const rotation = isSummer ? 305 : 250; // degrees, 0=N clockwise

        const color = windKts > 15 ? '#ef4444' : windKts > 8 ? '#f59e0b' : '#10b981';

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [cLng, cLat],
          },
          properties: {
            zoneId: zb.zoneId,
            zoneName: zone?.name ?? zb.zoneId,
            windKts,
            windLabel: `${windKts} kt`,
            rotation,
            color,
          },
        };
      });

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [month, isAM]);
}
