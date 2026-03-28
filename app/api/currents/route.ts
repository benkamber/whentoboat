import { NextRequest, NextResponse } from 'next/server';

// ============================================
// NOAA CO-OPS Tidal Current Predictions API
//
// SAFETY-CRITICAL: This route fetches REAL harmonic current predictions
// from NOAA CO-OPS. These predictions are based on decades of tidal
// harmonic analysis and are the authoritative source for tidal current
// data in US waters.
//
// This replaces the previous estimateCurrentFromTide() function which
// derived current speed from tide height deltas — a scientifically
// invalid approach. Tidal current velocity is governed by channel
// geometry, basin volume, and harmonic constituents, NOT by the rate
// of water level change at a single tide station.
//
// NOAA CO-OPS current predictions API:
// https://api.tidesandcurrents.noaa.gov/api/prod/datagetter
// Documentation: https://tidesandcurrents.noaa.gov/api/
// ============================================

/**
 * A single current prediction event (max flood, max ebb, or slack).
 */
export interface CurrentPredictionEvent {
  time: string;       // ISO timestamp (local daylight time)
  type: 'max_flood' | 'max_ebb' | 'slack';
  velocity: number;   // knots (positive = flood, negative = ebb)
  direction: number;  // degrees true
}

/**
 * Current predictions for a single NOAA station.
 */
export interface CurrentPrediction {
  station: string;
  stationName: string;
  predictions: CurrentPredictionEvent[];
}

/**
 * Response from this API route.
 */
export interface CurrentsResponse {
  stations: CurrentPrediction[];
  dataAvailable: boolean;
  fetchedAt: string;
  source: string;
}

// Key NOAA CO-OPS current prediction stations for SF Bay
const KEY_STATIONS: Record<string, string> = {
  SFB1201: 'Golden Gate (main channel)',
  SFB1203: 'Alcatraz (south side)',
  SFB1205: 'Bay Bridge',
  PCT0261: 'Fort Point',
  SFB1212: 'Raccoon Strait',
};

// Cache: current predictions are harmonic (computed, not observed) so they
// don't change. 6-hour TTL is conservative — they'd be valid for days.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const cache = new Map<string, { data: CurrentsResponse; ts: number; ttl?: number }>();

function cacheKey(stations: string[], days: number): string {
  return `currents:${stations.sort().join(',')}:${days}`;
}

/**
 * Format a Date as YYYYMMDD for NOAA API.
 */
function formatDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Fetch with timeout — NOAA can be slow; don't block the response.
 */
async function fetchWithTimeout(url: string, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Classify a NOAA current prediction event.
 *
 * NOAA returns predictions with:
 * - Velocity_Major: speed in knots (positive = flood, negative = ebb)
 * - Type: "slack" or "max" (or sometimes the full event description)
 * - meanFloodDir / meanEbbDir: average direction for flood/ebb at this station
 *
 * Some stations return "Flood", "Ebb", "Slack" in the Type field.
 * Others return velocity-based data where sign indicates direction.
 */
function classifyEvent(
  velocity: number,
  typeField: string,
  meanFloodDir: number,
  meanEbbDir: number
): { type: CurrentPredictionEvent['type']; velocity: number; direction: number } {
  const normalizedType = typeField?.toLowerCase().trim() ?? '';

  if (normalizedType === 'slack' || normalizedType.includes('slack')) {
    return { type: 'slack', velocity: 0, direction: 0 };
  }

  // Positive velocity = flood, negative = ebb (NOAA convention)
  if (velocity > 0 || normalizedType.includes('flood')) {
    return {
      type: 'max_flood',
      velocity: Math.abs(velocity),
      direction: meanFloodDir,
    };
  }

  return {
    type: 'max_ebb',
    velocity: -Math.abs(velocity), // negative = ebb by our convention
    direction: meanEbbDir,
  };
}

/**
 * Fetch current predictions for a single NOAA station.
 *
 * NOAA CO-OPS API returns max/slack predictions with:
 * - Time (local)
 * - Velocity_Major (knots, signed: + flood, - ebb)
 * - Type (slack/flood/ebb)
 * - meanFloodDir, meanEbbDir (degrees true)
 */
async function fetchStationCurrents(
  stationId: string,
  stationName: string,
  beginDate: string,
  endDate: string
): Promise<CurrentPrediction | null> {
  try {
    // NOAA CO-OPS current predictions endpoint
    // product=currents_predictions returns max/slack events (not continuous data)
    // time_zone=lst_ldt returns local time with daylight savings
    // units=english returns knots
    const url =
      `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
      `?begin_date=${beginDate}` +
      `&end_date=${endDate}` +
      `&station=${stationId}` +
      `&product=currents_predictions` +
      `&time_zone=lst_ldt` +
      `&units=english` +
      `&format=json`;

    const res = await fetchWithTimeout(url, 8000);
    if (!res.ok) {
      console.warn(`[currents] NOAA returned ${res.status} for station ${stationId}`);
      return null;
    }

    const data = await res.json();

    // Check for NOAA error response
    if (data.error) {
      console.warn(`[currents] NOAA error for ${stationId}: ${data.error.message}`);
      return null;
    }

    // NOAA returns current_predictions or cp_predictions depending on station type
    const predictions = data.current_predictions?.cp ?? data.predictions ?? [];
    if (!Array.isArray(predictions) || predictions.length === 0) {
      console.warn(`[currents] No predictions returned for station ${stationId}`);
      return null;
    }

    // Extract mean flood/ebb directions from the first prediction or station metadata
    const meanFloodDir = data.current_predictions?.meanFloodDir
      ?? predictions[0]?.meanFloodDir
      ?? 60;  // Default: flood flows inward (~ENE) in SF Bay
    const meanEbbDir = data.current_predictions?.meanEbbDir
      ?? predictions[0]?.meanEbbDir
      ?? 240; // Default: ebb flows outward (~WSW) in SF Bay

    const events: CurrentPredictionEvent[] = [];

    for (const pred of predictions) {
      // pred.Time or pred.t: timestamp
      // pred.Velocity_Major or pred.Velocity: speed in knots
      // pred.Type: "slack", "flood", "ebb", or sometimes "max"
      const timeStr = pred.Time ?? pred.t ?? '';
      const velocity = parseFloat(pred.Velocity_Major ?? pred.Velocity ?? pred.Speed ?? '0');
      const typeField = pred.Type ?? pred.type ?? '';

      if (!timeStr) continue;

      const classified = classifyEvent(
        velocity,
        typeField,
        parseFloat(String(meanFloodDir)),
        parseFloat(String(meanEbbDir))
      );

      // Convert NOAA local time format to ISO-ish format
      // NOAA returns "2026-03-27 09:42" or similar
      const isoTime = timeStr.replace(' ', 'T');

      events.push({
        time: isoTime,
        type: classified.type,
        velocity: Math.round(classified.velocity * 100) / 100,
        direction: classified.direction,
      });
    }

    return {
      station: stationId,
      stationName,
      predictions: events,
    };
  } catch (err) {
    console.warn(
      `[currents] Failed to fetch station ${stationId}:`,
      err instanceof Error ? err.message : 'unknown error'
    );
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Parse query parameters
  const stationParam = searchParams.get('station');
  const days = Math.min(7, Math.max(1, parseInt(searchParams.get('days') ?? '2', 10)));

  // Determine which stations to query
  let stationIds: string[];
  if (stationParam) {
    // Single station or comma-separated list
    stationIds = stationParam.split(',').map(s => s.trim()).filter(Boolean);
    // Validate station IDs (allow any alphanumeric station ID for forward compatibility)
    for (const id of stationIds) {
      if (!/^[A-Za-z0-9_]+$/.test(id)) {
        return NextResponse.json(
          { error: `Invalid station ID: ${id}` },
          { status: 400 }
        );
      }
    }
  } else {
    // Default: all key SF Bay stations
    stationIds = Object.keys(KEY_STATIONS);
  }

  // Check cache
  const key = cacheKey(stationIds, days);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < (cached.ttl ?? CACHE_TTL_MS)) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
        'X-Cache': 'HIT',
      },
    });
  }

  // Calculate date range
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const beginDate = formatDate(now);
  const endDate = formatDate(end);

  // Fetch all stations in parallel
  const results = await Promise.all(
    stationIds.map(id => {
      const name = KEY_STATIONS[id] ?? id;
      return fetchStationCurrents(id, name, beginDate, endDate);
    })
  );

  // Filter out failed stations
  const stations = results.filter((r): r is CurrentPrediction => r !== null);
  const dataAvailable = stations.length > 0;

  if (!dataAvailable) {
    console.warn('[currents] NOAA CO-OPS unavailable — no stations returned data');
  }

  const response: CurrentsResponse = {
    stations,
    dataAvailable,
    fetchedAt: new Date().toISOString(),
    source: 'NOAA CO-OPS Tidal Current Predictions',
  };

  // Cache the response (even empty — avoids hammering NOAA when it's down)
  // Empty responses get a shorter TTL (5 minutes) so we retry sooner
  const ttl = dataAvailable ? CACHE_TTL_MS : 5 * 60 * 1000;
  cache.set(key, { data: response, ts: Date.now(), ttl });
  // Clean up: if cache gets large, remove entries older than TTL
  if (cache.size > 50) {
    const cutoff = Date.now() - CACHE_TTL_MS;
    for (const [k, v] of cache) {
      if (v.ts < cutoff) cache.delete(k);
    }
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': dataAvailable
        ? 'public, s-maxage=21600, stale-while-revalidate=3600'
        : 'public, s-maxage=300',
      'X-Cache': 'MISS',
      'X-Current-Data': dataAvailable ? 'available' : 'unavailable',
      'X-Stations-Returned': String(stations.length),
    },
  });
}
