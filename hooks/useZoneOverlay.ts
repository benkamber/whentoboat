import { useMemo } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { zoneBoundaries } from '@/data/cities/sf-bay/zone-boundaries';
import { getActivity } from '@/data/activities';
import { getTimeConditions } from '@/engine/interpolation';
import { buildFullConditions, fullConditionsScore } from '@/engine/scoring';
import { scoreToColor } from '@/lib/colors';
import type { ActivityType, VesselProfile } from '@/engine/types';

/**
 * Generate GeoJSON for the zone-based heat overlay.
 * Colors each water zone by comfort score for the current activity/time/vessel.
 *
 * Visual design:
 * - High comfort (8-10): very subtle green wash, barely visible
 * - Medium comfort (5-7): yellow/gold tint, noticeable but not alarming
 * - Low comfort (1-4): red/orange overlay, clearly warning "this area is rough"
 */
export function useZoneOverlay(
  activity: ActivityType,
  month: number,
  hour: number,
  vessel: VesselProfile
) {
  return useMemo(() => {
    const act = getActivity(activity);

    const features = zoneBoundaries.map(({ zoneId, polygon }) => {
      const zone = sfBay.zones.find(z => z.id === zoneId);
      if (!zone) return null;

      const conditions = getTimeConditions(zone, Math.floor(hour), month);
      const fullConds = buildFullConditions(conditions, month, Math.floor(hour));
      const { score } = fullConditionsScore(act, fullConds, vessel);

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [polygon],
        },
        properties: {
          zoneId,
          zoneName: zone.name,
          score,
          color: scoreToColor(score),
          // Opacity: higher score = more transparent (green fades into the water)
          // Lower score = more opaque (red stands out as warning)
          opacity: score >= 8 ? 0.08 : score >= 6 ? 0.15 : score >= 4 ? 0.25 : 0.35,
        },
      };
    }).filter((f): f is NonNullable<typeof f> => f !== null);

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [activity, month, hour, vessel]);
}
