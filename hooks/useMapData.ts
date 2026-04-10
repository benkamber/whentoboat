import { useMemo } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { getWaterRoute } from '@/data/cities/sf-bay/water-routes';
import { hazards } from '@/data/cities/sf-bay/hazards';
import { getActivity } from '@/data/activities';
import { verifiedRoutes } from '@/data/cities/sf-bay/verified-routes';
import { getEventsForTrip } from '@/lib/event-relevance';
import { haversineDistanceMi } from '@/engine/scoring';
import { routeComfort, COMFORT_COLORS } from '@/lib/route-comfort';
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

      const color = dest.id === origin?.id ? '#3b82f6' :
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
        // Straight-line fallback — safe within the Bay, dangerous across land.
        // If either endpoint is an ocean zone, the line would cross the
        // Peninsula or Marin headlands. Require validated waypoints for those.
        const fromOcean = fromDest.zone.startsWith('ocean');
        const toOcean = toDest.zone.startsWith('ocean');
        if (fromOcean || toOcean) continue; // Would draw through land

        coordinates = [[fromDest.lng, fromDest.lat], [toDest.lng, toDest.lat]];
        distanceMi = Math.round(haversineDistanceMi(fromDest.lat, fromDest.lng, toDest.lat, toDest.lng) * 10) / 10;
        isApproximate = true;
      }

      const isSelected = selectedDestinationId === toId;
      const hasSelection = !!selectedDestinationId;

      const transitMinutes = vessel.cruiseSpeed > 0 ? Math.round((distanceMi / vessel.cruiseSpeed) * 60) : 0;

      // Comfort-tier color lets users eyeball plausibility at a glance,
      // especially for approximate routes with no validated waypoints.
      const tier = routeComfort(distanceMi, vessel, currentActivity, toDest.minDepth);
      const tierColor = COMFORT_COLORS[tier];

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
          color: isSelected ? '#f59e0b' : tierColor,
          opacity: isApproximate
            ? (hasSelection ? (isSelected ? 0.85 : 0.2) : 0.45)
            : (hasSelection ? (isSelected ? 0.9 : 0.18) : 0.7),
          lineWidth: isApproximate ? 1.5 : (isSelected ? 4 : 2.5),
          isApproximate,
          comfort: tier,
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

/**
 * Generate GeoJSON for Bay events with lat/lng.
 * Color-coded by sentiment: red (avoid), amber (caution), green (fun).
 */
export function useEventGeoJSON(month: number, activity: ActivityType) {
  return useMemo(() => {
    const events = getEventsForTrip(month + 1, activity)
      .filter(e => e.lat != null && e.lng != null && e.sentiment !== 'neutral');

    const SENTIMENT_COLORS: Record<string, string> = {
      avoid: '#ef4444',
      caution: '#f59e0b',
      fun: '#10b981',
    };

    return {
      type: 'FeatureCollection' as const,
      features: events.map(e => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [e.lng!, e.lat!] },
        properties: {
          id: e.id,
          name: e.name,
          sentiment: e.sentiment,
          reason: e.reason,
          schedule: e.schedule,
          color: SENTIMENT_COLORS[e.sentiment] ?? '#6b7280',
          restrictedZone: e.restrictedZone,
        },
      })),
    };
  }, [month, activity]);
}
