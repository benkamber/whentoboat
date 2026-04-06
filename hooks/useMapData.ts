import { useMemo } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { getWaterRoute } from '@/data/cities/sf-bay/water-routes';
import { hazards } from '@/data/cities/sf-bay/hazards';
import type { ActivityType, VesselProfile } from '@/engine/types';

/**
 * Generate GeoJSON for destination markers.
 * Static version — all destinations shown in fixed teal, no scoring.
 */
export function useDestinationGeoJSON(
  activity: ActivityType,
  month: number,
  hour: number,
  vessel: VesselProfile,
  selectedOriginId: string | null
) {
  return useMemo(() => {
    const origin = selectedOriginId
      ? sfBay.destinations.find((d) => d.id === selectedOriginId)
      : sfBay.destinations[0];

    const features = sfBay.destinations.map((dest) => {
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
          color: dest.id === origin?.id ? '#14b8a6' : '#14b8a6',
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
 * Static version — fixed teal color, no scoring.
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
    const features: GeoJSON.Feature[] = [];
    const origin = selectedOriginId
      ? sfBay.destinations.find((d) => d.id === selectedOriginId)
      : null;

    // Only show route lines from the selected origin
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

    for (const [fromId, toId] of pairs) {
      const fromDest = sfBay.destinations.find((d) => d.id === fromId);
      const toDest = sfBay.destinations.find((d) => d.id === toId);
      if (!fromDest || !toDest) continue;

      // Use validated water route waypoints
      const waterRoute = getWaterRoute(fromId, toId, vessel.type);
      if (!waterRoute) continue;
      const coordinates = waterRoute.waypoints.map(wp => [wp[0], wp[1]]);

      const isSelected = selectedDestinationId === toId;
      const hasSelection = !!selectedDestinationId;

      // Distance is in statute miles from the water route
      const distanceMi = waterRoute.distance;
      const transitMinutes = vessel.cruiseSpeed > 0 ? Math.round((distanceMi / vessel.cruiseSpeed) * 60) : 0;

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
          color: '#22d3ee',
          opacity: hasSelection ? (isSelected ? 0.8 : 0.15) : 0.5,
          lineWidth: isSelected ? 3 : 2,
          distance: Math.round(distanceMi * 10) / 10,
          transitMinutes,
        },
      });
    }

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [activity, month, hour, vessel, selectedOriginId, selectedDestinationId]);
}

/**
 * Generate GeoJSON for navigation hazard markers.
 * Static data from NOAA charts and Coast Pilot.
 */
export function useHazardGeoJSON() {
  return useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: hazards.map(h => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [h.lng, h.lat] },
      properties: {
        id: h.id,
        name: h.name,
        description: h.description,
        severity: h.severity,
        depthFt: h.depthFt ?? null,
      },
    })),
  }), []);
}
