import { useState, useEffect, useCallback } from 'react';
import type { BuoyResponse } from '@/app/api/buoy/route';

const STATION_NAMES: Record<string, string> = {
  '46026': 'SF Bar (Offshore)',
  '46237': 'SF Bar Waverider',
  'FTPC1': 'Fort Point',
  'TIBC1': 'Tiburon',
  'RCMC1': 'Richmond',
  'AAMC1': 'Alameda',
  'OBXC1': 'Oakland Bay Bridge',
};

const STATION_URLS: Record<string, string> = {
  '46026': 'https://www.ndbc.noaa.gov/station_page.php?station=46026',
  '46237': 'https://www.ndbc.noaa.gov/station_page.php?station=46237',
  'FTPC1': 'https://www.ndbc.noaa.gov/station_page.php?station=FTPC1',
  'TIBC1': 'https://www.ndbc.noaa.gov/station_page.php?station=TIBC1',
  'RCMC1': 'https://www.ndbc.noaa.gov/station_page.php?station=RCMC1',
  'AAMC1': 'https://www.ndbc.noaa.gov/station_page.php?station=AAMC1',
  'OBXC1': 'https://www.ndbc.noaa.gov/station_page.php?station=OBXC1',
};

export { STATION_NAMES, STATION_URLS };

export function useBuoyObservations() {
  const [data, setData] = useState<BuoyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBuoy = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/buoy', { signal });
      if (!res.ok) {
        setError('Failed to load buoy observations');
        return;
      }
      const json: BuoyResponse = await res.json();
      if (!signal?.aborted) {
        setData(json);
        setError(null);
      }
    } catch {
      if (!signal?.aborted) setError('Unable to reach NOAA buoy service');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchBuoy(controller.signal);
    return () => controller.abort();
  }, [fetchBuoy]);

  return { data, loading, error };
}
