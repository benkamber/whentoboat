import { useState, useEffect, useCallback } from 'react';

/**
 * Hook that fetches live tidal current predictions from NOAA CO-OPS
 * via /api/currents. Returns current speed for a given zone.
 *
 * When available, the current data replaces the -1 sentinel in scoring,
 * which eliminates the "current data unavailable" penalty and warning.
 */
export function useCurrents() {
  const [currentData, setCurrentData] = useState<Record<string, { speed: number; direction: number }> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrents = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/currents', { signal });
      if (!res.ok) return;
      const data = await res.json();
      if (signal?.aborted) return;

      if (!data.dataAvailable) {
        setLoading(false);
        return;
      }

      // Build a zone → current mapping from station predictions
      // The /api/currents response has stations with predictions
      const zoneCurrents: Record<string, { speed: number; direction: number }> = {};
      const now = new Date();

      for (const [stationId, stationData] of Object.entries(data.stations ?? {})) {
        const predictions = (stationData as any)?.predictions ?? [];
        if (predictions.length === 0) continue;

        // Find the prediction closest to now
        let closest = predictions[0];
        let closestDiff = Infinity;
        for (const pred of predictions) {
          const diff = Math.abs(new Date(pred.time).getTime() - now.getTime());
          if (diff < closestDiff) {
            closestDiff = diff;
            closest = pred;
          }
        }

        // Map station to zone (from current-stations.ts mapping)
        const stationToZone: Record<string, string> = {
          'SFB1201': 'central_bay',
          'SFB1203': 'central_bay',
          'PCT0261': 'richardson',
          'SFB1213': 'san_pablo',
          's06010': 'north_bay',
        };

        const zone = stationToZone[stationId];
        if (zone && closest.speed_kts != null) {
          zoneCurrents[zone] = {
            speed: Math.abs(closest.speed_kts),
            direction: closest.direction_deg ?? 0,
          };
        }
      }

      setCurrentData(Object.keys(zoneCurrents).length > 0 ? zoneCurrents : null);
    } catch {
      // Silent failure — currents are supplementary
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchCurrents(controller.signal);
    return () => controller.abort();
  }, [fetchCurrents]);

  /**
   * Get current speed for a zone. Returns -1 (sentinel) if unavailable.
   */
  const getCurrentForZone = useCallback((zoneId: string): { speed: number; direction: number } => {
    if (!currentData || !currentData[zoneId]) {
      return { speed: -1, direction: 0 };
    }
    return currentData[zoneId];
  }, [currentData]);

  return {
    currentData,
    loading,
    getCurrentForZone,
    hasCurrentData: currentData !== null,
  };
}
