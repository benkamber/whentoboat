import { useMemo } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { getWaterRoute } from '@/data/cities/sf-bay/water-routes';
import { hazards } from '@/data/cities/sf-bay/hazards';
import { getActivity } from '@/data/activities';
import { verifiedRoutes } from '@/data/cities/sf-bay/verified-routes';
import { haversineDistanceMi } from '@/engine/scoring';
import type { ActivityType, VesselProfile } from '@/engine/types';

/**
 * Generate GeoJSON for destination markers.
 * Color-coded by distance from origin: green (close) -> teal -> amber -> gray (far).
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
      // Compute distance from origin for color coding
      const distKey = `${origin?.id}-${dest.id}`;
      const revKey = `${dest.id}-${origin?.id}`;
      const dist = sfBay.distances[distKey] ?? sfBay.distances[revKey] ??
        (origin ? haversineDistanceMi(origin.lat, origin.lng, dest.lat, dest.lng) : 999);

      const color = dest.id === origin?.id ? '#14b8a6' :
        dist < 3 ? '#10b981' :
        dist < 8 ? '#14b8a6' :
        dist < 15 ? '#f59e0b' :
        '#6b7280';

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
          color,
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
    const currentActivity = getActivity(activity);

    if (origin) {
      for (const dest of sfBay.destinations) {
        if (dest.id === origin.id) continue;
        if (!dest.activityTags.includes(activity)) continue;
        const key = `${origin.id}-${dest.id}`;
        const revKey = `${dest.id}-${origin.id}`;
        if (sfBay.distances[key] === undefined && sfBay.distances[revKey] === undefined) continue;

        // Enforce max range for human-powered craft
        if (currentActivity.maxRangeRoundTripMi !== null) {
          const matrixDist = sfBay.distances[key] ?? sfBay.distances[revKey];
          const distance = matrixDist ?? Math.round(haversineDistanceMi(origin.lat, origin.lng, dest.lat, dest.lng) * 10) / 10;
          if (distance * 2 > currentActivity.maxRangeRoundTripMi) continue;
        }

        // Activities that cannot cross shipping lanes (kayak, SUP)
        if (!currentActivity.requiresOpenWaterCrossing) {
          const vr = verifiedRoutes.find(r =>
            (r.from === origin.id && r.to === dest.id) ||
            (r.to === origin.id && r.from === dest.id)
          );
          if (vr?.crossesTss) continue;
          // No verified route to check — conservatively assume TSS crossing for human-powered craft
          if (!vr) continue;
        }

        pairs.push([origin.id, dest.id]);
      }
    }

    for (const [fromId, toId] of pairs) {
      const fromDest = sfBay.destinations.find((d) => d.id === fromId);
      const toDest = sfBay.destinations.find((d) => d.id === toId);
      if (!fromDest || !toDest) continue;

      // Use validated water route waypoints, or fall back to straight-line approximation
      const waterRoute = getWaterRoute(fromId, toId, vessel.type);
      let coordinates: number[][];
      let distanceMi: number;
      let isApproximate = false;

      if (waterRoute) {
        coordinates = waterRoute.waypoints.map(wp => [wp[0], wp[1]]);
        distanceMi = waterRoute.distance;
      } else {
        // Straight-line approximate connection
        coordinates = [[fromDest.lng, fromDest.lat], [toDest.lng, toDest.lat]];
        distanceMi = Math.round(haversineDistanceMi(fromDest.lat, fromDest.lng, toDest.lat, toDest.lng) * 10) / 10;
        isApproximate = true;
      }

      const isSelected = selectedDestinationId === toId;
      const hasSelection = !!selectedDestinationId;

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
          color: isApproximate ? '#6b7280' : (isSelected ? '#f59e0b' : '#22d3ee'),
          opacity: isApproximate ? 0.25 : (hasSelection ? (isSelected ? 0.9 : 0.12) : 0.5),
          lineWidth: isApproximate ? 1 : (isSelected ? 4 : 2),
          isApproximate,
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
