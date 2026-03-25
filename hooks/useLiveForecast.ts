import { useState, useEffect, useCallback } from 'react';
import type { FullConditions } from '@/engine/types';
import type { ForecastHour, ForecastResponse } from '@/app/api/forecast/route';

const SF_BAY_LAT = 37.8;
const SF_BAY_LNG = -122.4;

/**
 * Hook that fetches live forecast and converts it to FullConditions
 * for direct use in the scoring engine.
 *
 * When live data is available, it replaces historical zone averages
 * for the corresponding date/hour.
 */
export function useLiveForecast() {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/forecast?lat=${SF_BAY_LAT}&lng=${SF_BAY_LNG}&days=7`,
        { signal }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ForecastResponse = await res.json();
      if (!signal?.aborted) setForecast(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load forecast');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchForecast(controller.signal);
    return () => controller.abort();
  }, [fetchForecast]);

  /**
   * Get FullConditions for a specific date and hour from live forecast.
   * Returns null if forecast data is not available for that time.
   */
  const getConditionsForHour = useCallback(
    (date: Date, hour: number): FullConditions | null => {
      if (!forecast?.hours.length) return null;

      // Find the forecast hour closest to the requested date/hour
      const targetDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const targetHourStr = `${targetDateStr}T${String(Math.floor(hour)).padStart(2, '0')}:00`;

      const match = forecast.hours.find(h => h.time.startsWith(targetHourStr));
      if (!match) return null;

      return forecastHourToFullConditions(match);
    },
    [forecast]
  );

  /**
   * Get all FullConditions for a specific date (all hours).
   */
  const getConditionsForDate = useCallback(
    (date: Date): { hour: number; conditions: FullConditions }[] => {
      if (!forecast?.hours.length) return [];

      const targetDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      return forecast.hours
        .filter(h => h.time.startsWith(targetDateStr))
        .map(h => ({
          hour: new Date(h.time).getHours(),
          conditions: forecastHourToFullConditions(h),
        }));
    },
    [forecast]
  );

  /**
   * Check if we have live forecast data for a given date.
   */
  const hasLiveDataForDate = useCallback(
    (date: Date): boolean => {
      if (!forecast?.hours.length) return false;
      const targetDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return forecast.hours.some(h => h.time.startsWith(targetDateStr));
    },
    [forecast]
  );

  return {
    forecast,
    loading,
    error,
    getConditionsForHour,
    getConditionsForDate,
    hasLiveDataForDate,
    sources: forecast?.sources ?? [],
    marineDataAvailable: forecast?.marineDataAvailable ?? false,
    tideDataAvailable: forecast?.tideDataAvailable ?? false,
  };
}

/**
 * Convert a ForecastHour to FullConditions for the scoring engine.
 */
function forecastHourToFullConditions(h: ForecastHour): FullConditions {
  return {
    windKts: h.windSpeedKts,
    windDirDeg: h.windDirDeg,
    waveHtFt: h.waveHeightFt >= 0 ? h.waveHeightFt : 1.5, // conservative fallback
    wavePeriodS: h.wavePeriodS > 0 ? h.wavePeriodS : 3,
    waterTempF: h.waterTempF,
    airTempF: h.airTempF,
    currentKts: h.currentKts,
    currentDirDeg: h.currentDirDeg,
    visibilityMi: h.visibilityMi,
    tideFt: h.tideFt >= 0 ? h.tideFt : 3,
    tidePhase: h.tidePhase === 'unknown' ? 'flood' : h.tidePhase,
    isLiveForecast: true,
    isMissingWaveData: !h.waveDataAvailable,
  };
}
