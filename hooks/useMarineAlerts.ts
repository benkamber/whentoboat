import { useState, useEffect, useCallback } from 'react';
import type { AlertsResponse } from '@/app/api/alerts/route';

/**
 * Hook that fetches active NWS marine weather alerts for SF Bay.
 * Returns alerts with convenience flags for small craft advisories,
 * gale warnings, and fog advisories.
 *
 * Alerts should trigger automatic score caps in the UI:
 * - Gale warning → cap all scores at 3/10
 * - Small craft advisory → cap paddlecraft at 5/10
 * - Fog advisory → add fog warning to all routes
 */
export function useMarineAlerts() {
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/alerts', { signal });
      if (!res.ok) return;
      const data: AlertsResponse = await res.json();
      if (!signal?.aborted) setAlerts(data);
    } catch {
      // Silent failure — alerts are supplementary, not critical
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAlerts(controller.signal);
    return () => controller.abort();
  }, [fetchAlerts]);

  return {
    alerts: alerts?.alerts ?? [],
    hasActiveAlerts: alerts?.hasActiveAlerts ?? false,
    hasGaleWarning: alerts?.hasGaleWarning ?? false,
    hasSmallCraftAdvisory: alerts?.hasSmallCraftAdvisory ?? false,
    hasFogAdvisory: alerts?.hasFogAdvisory ?? false,
    loading,
  };
}
