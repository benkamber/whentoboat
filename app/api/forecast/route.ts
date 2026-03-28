import { NextRequest, NextResponse } from 'next/server';

// ============================================
// Live Forecast API
// Combines Open-Meteo weather + marine data
// with NOAA CO-OPS tide predictions
// ============================================

export interface ForecastHour {
  time: string;
  // Wind
  windSpeedKts: number;
  windGustKts: number;
  windDirDeg: number;
  // Waves
  waveHeightFt: number;    // -1 = unavailable
  wavePeriodS: number;
  swellHeightFt: number;
  swellPeriodS: number;
  waveDataAvailable: boolean;
  // Temperature
  airTempF: number;
  waterTempF: number;       // from seasonal data or SST model
  // Atmosphere
  visibilityMi: number;
  cloudCoverPct: number;
  precipitationIn: number;  // hourly precipitation in inches
  precipProbPct: number;    // probability of precipitation %
  // Tides (from NOAA CO-OPS, interpolated to hour)
  tideFt: number;           // height above MLLW
  tidePhase: 'flood' | 'ebb' | 'slack_high' | 'slack_low' | 'unknown';
  // Current data
  // SAFETY-CRITICAL: currentKts === -1 is a SENTINEL meaning "current data
  // unavailable — must be fetched from the /api/currents endpoint or left
  // as unknown." The previous approach of estimating currents from tide height
  // deltas was scientifically invalid. NEVER default -1 to 0, which would
  // falsely imply calm/no current.
  currentKts: number;       // -1 = unavailable (sentinel). Use /api/currents for real data.
  currentDirDeg: number;
  currentDataSource: 'none' | 'coops';  // 'none' = not included, 'coops' = from NOAA CO-OPS
}

export interface ForecastResponse {
  lat: number;
  lng: number;
  hours: ForecastHour[];
  fetchedAt: string;
  marineDataAvailable: boolean;
  tideDataAvailable: boolean;
  sources: string[];
}

// Cache
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 100;
const cache = new Map<string, { data: ForecastResponse; ts: number }>();

function cacheKey(lat: number, lng: number, days: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)},${days}`;
}

function evictCache() {
  const now = Date.now();
  // First: remove expired entries
  for (const [k, v] of cache) {
    if (now - v.ts > CACHE_TTL_MS) cache.delete(k);
  }
  // Second: if still over limit, remove oldest entries
  if (cache.size > MAX_CACHE_SIZE) {
    const sorted = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
    const toRemove = cache.size - MAX_CACHE_SIZE;
    for (let i = 0; i < toRemove; i++) {
      cache.delete(sorted[i][0]);
    }
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

// SF Bay water temperature by month (from NOAA CO-OPS historical)
const WATER_TEMP_BY_MONTH = [52, 52, 53, 54, 56, 58, 59, 61, 63, 62, 57, 53];

// NOAA CO-OPS tide predictions for SF (station 9414290)
async function fetchTidePredictions(days: number): Promise<Map<string, { v: number; type: string }[]> | null> {
  try {
    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const beginDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const endDate = `${end.getFullYear()}${String(end.getMonth() + 1).padStart(2, '0')}${String(end.getDate()).padStart(2, '0')}`;

    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${beginDate}&end_date=${endDate}&station=9414290&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json`;

    const res = await fetchWithTimeout(url, 5000);
    if (!res.ok) return null;
    const data = await res.json();

    // Group predictions by ISO date-hour for easy lookup
    const byHour = new Map<string, { v: number; type: string }[]>();
    for (const pred of data.predictions ?? []) {
      // pred.t format: "2026-03-24 09:00"
      const key = pred.t?.replace(' ', 'T') + ':00'; // approximate ISO
      const existing = byHour.get(key) ?? [];
      existing.push({ v: parseFloat(pred.v), type: 'prediction' });
      byHour.set(key, existing);
    }
    return byHour;
  } catch (err) {
    console.warn('[forecast] Tide API unavailable:', err instanceof Error ? err.message : 'unknown');
    return null;
  }
}

// Estimate tide phase from consecutive tide heights.
// NOTE: This is valid — determining whether the tide is rising or falling
// from height measurements is straightforward physics. What was INVALID
// (and has been removed) was estimateCurrentFromTide(), which tried to
// derive current velocity from tide height deltas. Current velocity depends
// on channel geometry, basin volume, and harmonic constituents — not on
// the rate of water level change at a single station.
// Real current data now comes from NOAA CO-OPS via /api/currents.
function estimateTidePhase(currentHeight: number, prevHeight: number | null): ForecastHour['tidePhase'] {
  if (prevHeight === null) return 'unknown';
  const diff = currentHeight - prevHeight;
  if (Math.abs(diff) < 0.05) {
    return currentHeight > 4 ? 'slack_high' : 'slack_low';
  }
  return diff > 0 ? 'flood' : 'ebb';
}

// REMOVED: estimateCurrentFromTide()
// This function was scientifically invalid and has been deleted.
// It estimated tidal current speed from the rate of tide height change,
// which has no valid physical basis. Tidal current velocity in SF Bay
// ranges from 0-5.5kt and is governed by channel constrictions (Golden
// Gate, Raccoon Strait, Carquinez) and basin geometry — NOT by the
// derivative of water level at a single tide gauge.
//
// Real current predictions are now served by /api/currents, which
// fetches harmonic predictions directly from NOAA CO-OPS.

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');
  const days = Math.min(16, Math.max(1, parseInt(searchParams.get('days') ?? '7', 10)));

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Missing or invalid lat/lng parameters' }, { status: 400 });
  }

  const key = cacheKey(lat, lng, days);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800', 'X-Cache': 'HIT' },
    });
  }

  try {
    // Fetch ALL data sources in parallel
    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,cloud_cover,precipitation,precipitation_probability` +
      `&forecast_days=${days}&temperature_unit=fahrenheit&wind_speed_unit=kn`;

    const marineUrl =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
      `&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_period` +
      `&forecast_days=${days}`;

    const [weatherRes, marineRes, tideData] = await Promise.all([
      fetchWithTimeout(weatherUrl, 5000),
      fetchWithTimeout(marineUrl, 5000).catch((err) => {
        console.warn('[forecast] Marine API unavailable:', err?.message ?? 'timeout');
        return null;
      }),
      fetchTidePredictions(days),
    ]);

    if (!weatherRes.ok) {
      throw new Error(`Weather API returned ${weatherRes.status}`);
    }

    const weather = await weatherRes.json();
    const marine = marineRes?.ok ? await marineRes.json() : null;
    const marineDataAvailable = marine !== null;
    const tideDataAvailable = tideData !== null;

    const weatherHourly = weather.hourly ?? {};
    const marineHourly = marine?.hourly ?? {};
    const times: string[] = weatherHourly.time ?? [];

    const sources = ['Open-Meteo Weather API'];
    if (marineDataAvailable) sources.push('Open-Meteo Marine API');
    if (tideDataAvailable) sources.push('NOAA CO-OPS Tide Predictions (Station 9414290)');

    let prevTideHeight: number | null = null;

    const hours: ForecastHour[] = times.map((time: string, i: number) => {
      const hasWaveData = marineHourly.wave_height?.[i] != null;

      // Tide lookup
      const tideKey = time + ':00';
      const tidePreds = tideData?.get(tideKey);
      const tideFt = tidePreds?.[0]?.v ?? -1;
      const tidePhase = tideFt >= 0 ? estimateTidePhase(tideFt, prevTideHeight) : 'unknown';
      if (tideFt >= 0) prevTideHeight = tideFt;

      // Water temp from monthly average (Open-Meteo doesn't provide SST for bays)
      const monthFromTime = new Date(time).getMonth();
      const waterTempF = WATER_TEMP_BY_MONTH[monthFromTime] ?? 58;

      return {
        time,
        // Wind
        windSpeedKts: weatherHourly.wind_speed_10m?.[i] ?? 0,
        windGustKts: weatherHourly.wind_gusts_10m?.[i] ?? 0,
        windDirDeg: weatherHourly.wind_direction_10m?.[i] ?? 0,
        // Waves
        waveHeightFt: hasWaveData ? marineHourly.wave_height[i] * 3.281 : -1,
        wavePeriodS: marineHourly.wave_period?.[i] ?? 0,
        swellHeightFt: marineHourly.swell_wave_height?.[i] != null
          ? marineHourly.swell_wave_height[i] * 3.281 : -1,
        swellPeriodS: marineHourly.swell_wave_period?.[i] ?? 0,
        waveDataAvailable: hasWaveData,
        // Temperature
        airTempF: weatherHourly.temperature_2m?.[i] ?? 0,
        waterTempF,
        // Atmosphere
        visibilityMi: (weatherHourly.visibility?.[i] ?? 0) / 1609,
        cloudCoverPct: weatherHourly.cloud_cover?.[i] ?? 0,
        precipitationIn: (weatherHourly.precipitation?.[i] ?? 0) / 25.4, // mm to inches
        precipProbPct: weatherHourly.precipitation_probability?.[i] ?? 0,
        // Tides
        tideFt: tideFt >= 0 ? Math.round(tideFt * 10) / 10 : -1,
        tidePhase,
        // Current: SENTINEL VALUE — this forecast does NOT include current data.
        // SAFETY-CRITICAL: -1 means "unknown/unavailable." The scoring engine
        // MUST treat this as uncertain, NOT as 0kt (which would falsely imply calm).
        // Real current data must be fetched separately from /api/currents,
        // which queries NOAA CO-OPS harmonic current predictions.
        currentKts: -1,
        currentDirDeg: 0,
        currentDataSource: 'none' as const,
      };
    });

    const data: ForecastResponse = {
      lat, lng, hours,
      fetchedAt: new Date().toISOString(),
      marineDataAvailable,
      tideDataAvailable,
      sources,
    };

    evictCache();
    cache.set(key, { data, ts: Date.now() });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        'X-Cache': 'MISS',
        'X-Marine-Data': marineDataAvailable ? 'available' : 'unavailable',
        'X-Tide-Data': tideDataAvailable ? 'available' : 'unavailable',
      },
    });
  } catch (err) {
    console.error('[forecast] Error fetching forecast:', err);
    return NextResponse.json({
      lat, lng, hours: [],
      fetchedAt: new Date().toISOString(),
      marineDataAvailable: false,
      tideDataAvailable: false,
      sources: [],
    } satisfies ForecastResponse, {
      headers: { 'Cache-Control': 'no-cache', 'X-Forecast-Error': 'true' },
    });
  }
}
