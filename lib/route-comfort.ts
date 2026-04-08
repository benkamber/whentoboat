/**
 * Route comfort classification — shared between map rendering (useMapData)
 * and the sidebar route list (page.tsx) so the color tier a user sees on
 * the map matches what gets sent in analytics events.
 *
 * All routes passed in here are already feasibility-filtered — this judges
 * margin-of-safety and effort, so users can pick the easy one.
 */

import type { ActivityProfile, VesselProfile } from '@/engine/types';

export type ComfortTier = 'comfortable' | 'marginal' | 'challenging';

// Comfort palette for route lines and destination markers.
export const COMFORT_COLORS: Record<ComfortTier, string> = {
  comfortable: '#10b981', // green
  marginal:    '#f59e0b', // amber
  challenging: '#ef4444', // red
};

/**
 * Classify how comfortable a one-way route is for a given vessel/activity.
 * Returns the *worst* tier across all applicable signals (distance, fuel,
 * endurance, draft).
 */
export function routeComfort(
  distanceMi: number,
  vessel: VesselProfile,
  activity: ActivityProfile,
  destMinDepth: number | null,
): ComfortTier {
  let worst: ComfortTier = 'comfortable';
  const bump = (t: ComfortTier) => {
    if (t === 'challenging') worst = 'challenging';
    else if (t === 'marginal' && worst === 'comfortable') worst = 'marginal';
  };

  // 1. Distance vs. round-trip range limit (human-powered craft)
  if (activity.maxRangeRoundTripMi != null) {
    const usedFraction = (distanceMi * 2) / activity.maxRangeRoundTripMi;
    if (usedFraction > 0.75) bump('challenging');
    else if (usedFraction > 0.5) bump('marginal');
  }

  // 2. Fuel usage vs. tank capacity (powered craft)
  if (vessel.fuelCapacity != null && vessel.gph && vessel.cruiseSpeed > 0) {
    const fuelRT = (distanceMi * 2 / vessel.cruiseSpeed) * vessel.gph;
    const usedFraction = fuelRT / vessel.fuelCapacity;
    if (usedFraction > 0.7) bump('challenging');
    else if (usedFraction > 0.5) bump('marginal');
  }

  // 3. Endurance vs. paddler stamina (one-way should leave energy for return)
  if (vessel.maxEnduranceHours != null && vessel.cruiseSpeed > 0) {
    const oneWayHrs = distanceMi / vessel.cruiseSpeed;
    const usedFraction = oneWayHrs / vessel.maxEnduranceHours;
    if (usedFraction > 0.4) bump('challenging');
    else if (usedFraction > 0.25) bump('marginal');
  }

  // 4. Draft vs. destination depth
  if (destMinDepth != null && vessel.draft > 0) {
    const clearance = destMinDepth - vessel.draft;
    if (clearance < 1) bump('challenging');
    else if (clearance < 2) bump('marginal');
  }

  // 5. For sailboat with no hard range limit, rank by pure distance.
  if (activity.maxRangeRoundTripMi == null && vessel.fuelCapacity == null) {
    if (distanceMi > 20) bump('marginal');
    if (distanceMi > 40) bump('challenging');
  }

  return worst;
}
