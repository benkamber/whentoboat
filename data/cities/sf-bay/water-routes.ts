import type { VesselType } from '@/engine/types';
import { verifiedRoutes } from './verified-routes';

// ============================================
// Water Route Lookup
//
// Routes are defined in verified-routes.ts with source attribution.
// This file provides the lookup function used by the map renderer.
// Only routes with validated: true are returned.
// ============================================

export interface WaterRoute {
  fromId: string;
  toId: string;
  vesselType: VesselType | 'default';
  waypoints: [number, number][];
  distance: number;
  zones: string[];
  notes: string;
}

/**
 * Look up a validated water route between two destinations.
 * Returns null if no validated route exists for this pair.
 */
export function getWaterRoute(
  fromId: string,
  toId: string,
  _vesselType?: VesselType,
): WaterRoute | null {
  const verified = verifiedRoutes.find(
    (r) =>
      r.validated &&
      ((r.from === fromId && r.to === toId) ||
        (r.from === toId && r.to === fromId)),
  );
  if (!verified) return null;

  const isReversed = verified.from !== fromId;
  return {
    fromId: isReversed ? verified.to : verified.from,
    toId: isReversed ? verified.from : verified.to,
    vesselType: 'default',
    waypoints: isReversed
      ? ([...verified.waypoints].reverse() as [number, number][])
      : verified.waypoints,
    distance: verified.distanceNm,
    zones: [],
    notes: verified.notes,
  };
}
