import type { VesselType } from '@/engine/types';
import { verifiedRoutes } from './verified-routes';
import { generatedRoutes } from './generated-routes';

// ============================================
// Water Route Lookup
//
// Priority: verified routes (hand-charted) > generated routes (auto-pathfinding)
// Verified routes have source attribution and expert validation.
// Generated routes use visibility-graph pathfinding against OSM coastline.
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
  if (verified) {
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

  // Fallback: auto-generated route from visibility graph pathfinding
  const generated = generatedRoutes.find(
    (r) =>
      (r.from === fromId && r.to === toId) ||
      (r.from === toId && r.to === fromId),
  );
  if (!generated) return null;

  const isGenReversed = generated.from !== fromId;
  return {
    fromId: isGenReversed ? generated.to : generated.from,
    toId: isGenReversed ? generated.from : generated.to,
    vesselType: 'default',
    waypoints: isGenReversed
      ? ([...generated.waypoints].reverse() as [number, number][])
      : generated.waypoints,
    distance: generated.distanceNm,
    zones: [],
    notes: 'Auto-generated route. Verify with nautical charts before navigating.',
  };
}
