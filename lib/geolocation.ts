/**
 * Browser-geolocation helper for picking the best default origin.
 *
 * Privacy notes:
 * - Triggers the browser's geolocation permission prompt — only call from
 *   a user-context surface like onboarding.
 * - Returns null silently on denial, timeout, or any error.
 * - Coordinates never leave the device — we compare locally against
 *   `sfBay.destinations` and return only the matching id.
 */

import { sfBay } from '@/data/cities/sf-bay';
import { haversineDistanceMi } from '@/engine/scoring';

/**
 * Find the launch ramp closest to the user's current position.
 *
 * Returns the destination id of the nearest launch ramp, or null if:
 * - The browser does not support geolocation
 * - The user denies the permission prompt
 * - The location request times out (~2.5s)
 * - No launch ramps are defined for the city
 */
export async function getNearestLaunchRamp(): Promise<string | null> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return null;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 3000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        const ramps = sfBay.destinations.filter((d) => d.launchRamp != null);
        if (ramps.length === 0) {
          resolve(null);
          return;
        }

        let bestId = ramps[0].id;
        let bestDist = Infinity;
        for (const ramp of ramps) {
          const dist = haversineDistanceMi(
            pos.coords.latitude,
            pos.coords.longitude,
            ramp.lat,
            ramp.lng,
          );
          if (dist < bestDist) {
            bestDist = dist;
            bestId = ramp.id;
          }
        }

        // Sanity check: if the user is more than 50 mi from any launch ramp,
        // they're probably outside SF Bay — fall back to the existing default
        // rather than dropping them at a random Bay ramp.
        if (bestDist > 50) {
          resolve(null);
          return;
        }

        resolve(bestId);
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
      { timeout: 2500, maximumAge: 5 * 60 * 1000 },
    );
  });
}
