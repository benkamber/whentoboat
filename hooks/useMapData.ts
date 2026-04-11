import { useMemo } from 'react';
import * as turf from '@turf/turf';
import { sfBay } from '@/data/cities/sf-bay';
import { hazards } from '@/data/cities/sf-bay/hazards';
import { getActivity } from '@/data/activities';
import { getEventsForTrip } from '@/lib/event-relevance';
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
 * Route lines are disabled — destinations show as colored markers only.
 * Ferry routes and shipping lanes are shown via separate overlays.
 * Route lines were removed because auto-generated paths sometimes cross
 * land, creating a misleading visual that implies navigable water routes.
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
    // Route lines disabled — show only destination markers with colors.
    // Ferry/shipping routes shown separately via ferryGeoJSON overlay.
    return {
      type: 'FeatureCollection' as const,
      features: [] as GeoJSON.Feature[],
    };
  }, [activity, month, hour, vessel, selectedOriginId, selectedDestinationId]);
}

// Route lines removed — destinations show as colored markers only.
// Ferry/shipping routes remain as separate map overlays.

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

/**
 * Generate GeoJSON circle for SUP paddling radius around origin.
 * Shows the practical one-way range (~1.5 mi / 2.4 km) as a circle.
 */
export function useSupRadiusGeoJSON(
  activity: ActivityType,
  selectedOriginId: string | null
) {
  return useMemo(() => {
    if (activity !== 'sup') {
      return { type: 'FeatureCollection' as const, features: [] };
    }

    const origin = selectedOriginId
      ? sfBay.destinations.find(d => d.id === selectedOriginId)
      : sfBay.destinations[0];
    if (!origin) return { type: 'FeatureCollection' as const, features: [] };

    // SUP practical range: 2.5 mph × 1 hr one-way with safety buffer = ~1.5 mi = ~2.4 km
    const circle = turf.circle([origin.lng, origin.lat], 2.4, { units: 'kilometers', steps: 64 });

    return {
      type: 'FeatureCollection' as const,
      features: [{
        ...circle,
        properties: { ...circle.properties, originId: origin.id },
      }],
    };
  }, [activity, selectedOriginId]);
}
