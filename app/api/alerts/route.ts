import { NextRequest, NextResponse } from 'next/server';

// ============================================
// NWS Marine Weather Alerts API
// Fetches active alerts for SF Bay marine zones
// from the National Weather Service API.
//
// Zones: PZZ530 (SF Bay north), PZZ531 (SF Bay south),
//        PZZ545 (coastal waters Pt Reyes to Pigeon Pt)
// ============================================

export interface MarineAlert {
  id: string;
  event: string;         // e.g., "Small Craft Advisory", "Gale Warning"
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  headline: string;
  description: string;
  instruction: string | null;
  onset: string;         // ISO 8601
  expires: string;       // ISO 8601
  zones: string[];
}

export interface AlertsResponse {
  alerts: MarineAlert[];
  fetchedAt: string;
  hasActiveAlerts: boolean;
  hasGaleWarning: boolean;
  hasSmallCraftAdvisory: boolean;
  hasFogAdvisory: boolean;
}

const SF_BAY_ZONES = ['PZZ530', 'PZZ531', 'PZZ545'];
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let cache: { data: AlertsResponse; ts: number } | null = null;

async function fetchWithTimeout(url: string, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'WhenToBoat/1.0 (recreational boating planning app)',
        'Accept': 'application/geo+json',
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(_request: NextRequest) {
  // Return cached data if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { 'Cache-Control': 'public, s-maxage=600', 'X-Cache': 'HIT' },
    });
  }

  try {
    // Fetch alerts for all SF Bay marine zones in parallel
    const responses = await Promise.all(
      SF_BAY_ZONES.map(zone =>
        fetchWithTimeout(`https://api.weather.gov/alerts/active/zone/${zone}`, 5000)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      )
    );

    const alerts: MarineAlert[] = [];
    const seenIds = new Set<string>();

    for (const data of responses) {
      if (!data?.features) continue;
      for (const feature of data.features) {
        const props = feature.properties;
        if (!props || seenIds.has(props.id)) continue;
        seenIds.add(props.id);

        // Strip HTML tags from NWS text fields to prevent XSS
        const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '');

        alerts.push({
          id: props.id,
          event: stripHtml(props.event ?? 'Unknown'),
          severity: props.severity ?? 'Unknown',
          headline: stripHtml(props.headline ?? ''),
          description: stripHtml(props.description ?? ''),
          instruction: props.instruction ? stripHtml(props.instruction) : null,
          onset: props.onset ?? props.effective ?? '',
          expires: props.expires ?? '',
          zones: props.affectedZones?.map((z: string) => z.split('/').pop()) ?? [],
        });
      }
    }

    const result: AlertsResponse = {
      alerts,
      fetchedAt: new Date().toISOString(),
      hasActiveAlerts: alerts.length > 0,
      hasGaleWarning: alerts.some(a => a.event.toLowerCase().includes('gale')),
      hasSmallCraftAdvisory: alerts.some(a => a.event.toLowerCase().includes('small craft')),
      hasFogAdvisory: alerts.some(a => a.event.toLowerCase().includes('fog') || a.event.toLowerCase().includes('dense fog')),
    };

    cache = { data: result, ts: Date.now() };

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=600', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error('[alerts] Error fetching NWS alerts:', err);
    return NextResponse.json({
      alerts: [],
      fetchedAt: new Date().toISOString(),
      hasActiveAlerts: false,
      hasGaleWarning: false,
      hasSmallCraftAdvisory: false,
      hasFogAdvisory: false,
    } satisfies AlertsResponse, {
      headers: { 'Cache-Control': 'no-cache' },
    });
  }
}
