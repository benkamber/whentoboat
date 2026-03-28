import { useMemo } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { getActivity } from '@/data/activities';
import { routeComfort } from '@/engine/scoring';
import { scoreToColor, scoreToOpacity } from '@/lib/colors';
import type { ActivityType, VesselProfile } from '@/engine/types';

/**
 * Generate GeoJSON for destination markers.
 */
export function useDestinationGeoJSON(
  activity: ActivityType,
  month: number,
  hour: number,
  vessel: VesselProfile,
  selectedOriginId: string | null
) {
  return useMemo(() => {
    const act = getActivity(activity);
    const origin = selectedOriginId
      ? sfBay.destinations.find((d) => d.id === selectedOriginId)
      : sfBay.destinations[0];

    const features = sfBay.destinations.map((dest) => {
      let score = 5;
      if (origin && dest.id !== origin.id) {
        const scored = routeComfort(origin, dest, month, hour, act, vessel, sfBay);
        score = scored.score;
      } else if (dest.id === origin?.id) {
        score = 10; // origin always green
      }

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [dest.lng, dest.lat],
        },
        properties: {
          id: dest.id,
          name: dest.name,
          code: dest.code,
          score,
          color: scoreToColor(score),
          isOrigin: dest.id === origin?.id,
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [activity, month, hour, vessel, selectedOriginId]);
}

/**
 * Generate GeoJSON for route lines between destinations.
 */
export function useRouteGeoJSON(
  activity: ActivityType,
  month: number,
  hour: number,
  vessel: VesselProfile,
  selectedOriginId: string | null
) {
  return useMemo(() => {
    const act = getActivity(activity);
    const features: GeoJSON.Feature[] = [];
    const origin = selectedOriginId
      ? sfBay.destinations.find((d) => d.id === selectedOriginId)
      : null;

    // Only show route lines from the selected origin — no spider web of all routes
    // This avoids the visual problem of lines crossing land
    // The map focuses on destination markers (colored dots) which are always accurate
    const pairs: [string, string][] = [];

    if (origin) {
      for (const dest of sfBay.destinations) {
        if (dest.id === origin.id) continue;
        if (!dest.activityTags.includes(activity)) continue;
        const key = `${origin.id}-${dest.id}`;
        const revKey = `${dest.id}-${origin.id}`;
        if (sfBay.distances[key] !== undefined || sfBay.distances[revKey] !== undefined) {
          pairs.push([origin.id, dest.id]);
        }
      }
    }
    // When no origin selected, show NO route lines — just destination markers

    for (const [fromId, toId] of pairs) {
      const fromDest = sfBay.destinations.find((d) => d.id === fromId);
      const toDest = sfBay.destinations.find((d) => d.id === toId);
      if (!fromDest || !toDest) continue;

      const scored = routeComfort(fromDest, toDest, month, hour, act, vessel, sfBay);

      // Straight lines — honest abstract transit-map style
      const coordinates = [[fromDest.lng, fromDest.lat], [toDest.lng, toDest.lat]];

      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {
          fromId,
          toId,
          fromName: fromDest.name,
          toName: toDest.name,
          score: scored.score,
          color: scoreToColor(scored.score),
          opacity: scoreToOpacity(scored.score),
          distance: scored.distance,
          transitMinutes: scored.transitMinutes,
          wind: scored.riskFactors.length > 0 ? '⚠' : '✓',
        },
      });
    }

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [activity, month, hour, vessel, selectedOriginId]);
}
// Build trigger: 1774471568
