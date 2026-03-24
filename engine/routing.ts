import type { City, Destination, VesselProfile, Zone } from './types';

/**
 * Get all zones a route passes through, including transit zones from routing rules.
 * The route's comfort = worst zone. This is the bottleneck rule.
 */
export function getRouteZones(
  origin: Destination,
  destination: Destination,
  city: City
): Zone[] {
  const zoneIds = new Set<string>();

  // Always include origin and destination zones
  zoneIds.add(origin.zone);
  zoneIds.add(destination.zone);

  // Check routing rules for additional transit zones
  for (const rule of city.routingRules) {
    const originInFrom =
      rule.fromAreas.includes(origin.area) || rule.fromAreas.includes(origin.zone);
    const destInTo =
      rule.toAreas.includes(destination.area) || rule.toAreas.includes(destination.zone);
    const originInTo =
      rule.toAreas.includes(origin.area) || rule.toAreas.includes(origin.zone);
    const destInFrom =
      rule.fromAreas.includes(destination.area) || rule.fromAreas.includes(destination.zone);

    // Rules are bidirectional
    if ((originInFrom && destInTo) || (originInTo && destInFrom)) {
      for (const tz of rule.transitZones) {
        zoneIds.add(tz);
      }
    }
  }

  // Convert zone IDs to Zone objects
  return Array.from(zoneIds)
    .map((id) => city.zones.find((z) => z.id === id))
    .filter((z): z is Zone => z !== undefined);
}

/**
 * Transit overhead in minutes.
 * Accounts for: no-wake zone exit (~2 min), acceleration (~1 min),
 * deceleration (~1 min), no-wake zone entry (~2 min), docking (~2 min).
 */
const TRANSIT_OVERHEAD_MIN = 8;

/**
 * Calculate transit time in minutes, including real-world overhead.
 */
export function transitTime(distanceMiles: number, cruiseSpeedMph: number): number {
  if (cruiseSpeedMph <= 0) return Infinity;
  return Math.round((distanceMiles / cruiseSpeedMph) * 60 + TRANSIT_OVERHEAD_MIN);
}

/**
 * Calculate fuel for round trip in gallons.
 * Returns null for human-powered craft.
 */
export function fuelRoundTrip(
  distanceMiles: number,
  gph: number | null,
  cruiseSpeedMph: number
): number | null {
  if (gph === null || gph === 0) return null;
  if (cruiseSpeedMph <= 0) return null;
  const hoursOneWay = distanceMiles / cruiseSpeedMph;
  return Math.round(hoursOneWay * 2 * gph * 10) / 10;
}

/**
 * Check if a destination is within range for the given vessel.
 * For motorized: 80% of fuel capacity (safety margin).
 * For human-powered: endurance hours × cruise speed.
 */
export function isInRange(distanceMiles: number, vessel: VesselProfile): boolean {
  if (vessel.fuelCapacity !== null && vessel.gph !== null && vessel.gph > 0) {
    // Motorized: fuel-limited
    const maxOneWayGallons = (vessel.fuelCapacity * 0.8) / 2; // 80% capacity, split for round trip
    const gallonsNeeded = (distanceMiles / vessel.cruiseSpeed) * vessel.gph;
    return gallonsNeeded <= maxOneWayGallons;
  }

  if (vessel.maxEnduranceHours !== null) {
    // Human-powered: endurance-limited
    const maxOneWayMiles = (vessel.maxEnduranceHours / 2) * vessel.cruiseSpeed;
    return distanceMiles <= maxOneWayMiles;
  }

  return true; // no limits defined
}

/**
 * Check draft clearance at a destination.
 */
export function draftClearance(
  destination: Destination,
  vessel: VesselProfile
): { clear: boolean; warning?: string } {
  if (destination.minDepth === null) {
    return { clear: true };
  }

  if (vessel.draft > destination.minDepth) {
    return {
      clear: false,
      warning: `Draft ${vessel.draft}ft exceeds minimum depth ${destination.minDepth}ft at ${destination.name}. Check tide before entering.`,
    };
  }

  // Close to limit — warn
  if (vessel.draft > destination.minDepth - 2) {
    return {
      clear: true,
      warning: `Draft ${vessel.draft}ft is close to minimum depth ${destination.minDepth}ft at ${destination.name}. Verify tide level.`,
    };
  }

  return { clear: true };
}
