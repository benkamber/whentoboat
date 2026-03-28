import { useMemo } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { getActivity } from '@/data/activities';
import { routeComfort } from '@/engine/scoring';
import { scoreToColor, scoreToOpacity } from '@/lib/colors';
import { getWaterRoute } from '@/data/cities/sf-bay/water-routes';
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
  selectedOriginId: string | null,
  selectedDestinationId?: string | null
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

      // Use validated water route waypoints — these follow actual navigable
      // channels and go around land masses. If no water route exists for this
      // pair, DON'T draw a line at all — a straight line through land is worse
      // than no line. The destination dot still shows with its score.
      const waterRoute = getWaterRoute(fromId, toId, vessel.type);
      if (!waterRoute) continue; // skip pairs without validated water routes
      const coordinates = waterRoute.waypoints.map(wp => [wp[0], wp[1]]);

      const isSelected = selectedDestinationId === toId;
      const hasSelection = !!selectedDestinationId;

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
          color: isSelected ? scoreToColor(scored.score) : scoreToColor(scored.score),
          // When a route is selected, bold it and dim all others
          opacity: hasSelection ? (isSelected ? 1.0 : 0.12) : scoreToOpacity(scored.score),
          lineWidth: isSelected ? 4.0 : 2.5,
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
  }, [activity, month, hour, vessel, selectedOriginId, selectedDestinationId]);
}
