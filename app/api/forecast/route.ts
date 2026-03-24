import { NextRequest, NextResponse } from 'next/server';

// ============================================
// Live Forecast API
// Fetches from Open-Meteo (no API key required)
// ============================================

export interface ForecastHour {
  time: string;
  windSpeedKts: number;
  windGustKts: number;
  windDirDeg: number;
  waveHeightFt: number;    // -1 means "data unavailable"
  wavePeriodS: number;
  swellHeightFt: number;
  swellPeriodS: number;
  tempF: number;
  visibilityMi: number;
  cloudCoverPct: number;
  waveDataAvailable: boolean;
}

export interface ForecastResponse {
  lat: number;
  lng: number;
  hours: ForecastHour[];
  fetchedAt: string;
  marineDataAvailable: boolean;  // false = wave data is missing, show warning
}

// Cache responses for 1 hour
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 100;
const cache = new Map<string, { data: ForecastResponse; ts: number }>();

function cacheKey(lat: number, lng: number, days: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)},${days}`;
}

// Evict expired cache entries
function evictCache() {
  if (cache.size <= MAX_CACHE_SIZE) return;
  const now = Date.now();
  for (const [k, v] of cache) {
    if (now - v.ts > CACHE_TTL_MS) cache.delete(k);
  }
  // If still over limit, drop oldest
  if (cache.size > MAX_CACHE_SIZE) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
    for (let i = 0; i < oldest.length - MAX_CACHE_SIZE; i++) {
      cache.delete(oldest[i][0]);
    }
  }
}

// Fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');
  const days = Math.min(16, Math.max(1, parseInt(searchParams.get('days') ?? '7', 10)));

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json(
      { error: 'Missing or invalid lat/lng parameters' },
      { status: 400 }
    );
  }

  // Check cache
  const key = cacheKey(lat, lng, days);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,cloud_cover` +
      `&forecast_days=${days}&temperature_unit=fahrenheit&wind_speed_unit=kn`;

    const marineUrl =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
      `&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_period` +
      `&forecast_days=${days}`;

    // Fetch weather and marine in parallel, both with 5s timeout
    const [weatherRes, marineRes] = await Promise.all([
      fetchWithTimeout(weatherUrl, 5000),
      fetchWithTimeout(marineUrl, 5000).catch((err) => {
        console.warn('[forecast] Marine API unavailable:', err?.message ?? 'timeout');
        return null;
      }),
    ]);

    if (!weatherRes.ok) {
      throw new Error(`Weather API returned ${weatherRes.status}`);
    }

    const weather = await weatherRes.json();
    const marine = marineRes?.ok ? await marineRes.json() : null;
    const marineDataAvailable = marine !== null;

    const weatherHourly = weather.hourly ?? {};
    const marineHourly = marine?.hourly ?? {};
    const times: string[] = weatherHourly.time ?? [];

    const hours: ForecastHour[] = times.map((time: string, i: number) => {
      const hasWaveData = marineHourly.wave_height?.[i] != null;
      return {
        time,
        windSpeedKts: weatherHourly.wind_speed_10m?.[i] ?? 0,
        windGustKts: weatherHourly.wind_gusts_10m?.[i] ?? 0,
        windDirDeg: weatherHourly.wind_direction_10m?.[i] ?? 0,
        // CRITICAL: -1 sentinel means "no wave data" — never default to 0 (false calm)
        waveHeightFt: hasWaveData ? marineHourly.wave_height[i] * 3.281 : -1,
        wavePeriodS: marineHourly.wave_period?.[i] ?? 0,
        swellHeightFt: marineHourly.swell_wave_height?.[i] != null
          ? marineHourly.swell_wave_height[i] * 3.281
          : -1,
        swellPeriodS: marineHourly.swell_wave_period?.[i] ?? 0,
        tempF: weatherHourly.temperature_2m?.[i] ?? 0,
        visibilityMi: (weatherHourly.visibility?.[i] ?? 0) / 1609,
        cloudCoverPct: weatherHourly.cloud_cover?.[i] ?? 0,
        waveDataAvailable: hasWaveData,
      };
    });

    const data: ForecastResponse = {
      lat,
      lng,
      hours,
      fetchedAt: new Date().toISOString(),
      marineDataAvailable,
    };

    // Update cache with eviction
    evictCache();
    cache.set(key, { data, ts: Date.now() });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        'X-Cache': 'MISS',
        'X-Marine-Data': marineDataAvailable ? 'available' : 'unavailable',
      },
    });
  } catch (err) {
    console.error('[forecast] Error fetching forecast:', err);

    const fallback: ForecastResponse = {
      lat,
      lng,
      hours: [],
      fetchedAt: new Date().toISOString(),
      marineDataAvailable: false,
    };

    return NextResponse.json(fallback, {
      headers: {
        'Cache-Control': 'no-cache',
        'X-Forecast-Error': 'true',
      },
    });
  }
}
