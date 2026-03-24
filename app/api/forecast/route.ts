import { NextRequest, NextResponse } from 'next/server';

// ============================================
// Live Forecast API
// Fetches from Open-Meteo (no API key required)
// ============================================

export interface ForecastHour {
  time: string;           // ISO timestamp
  windSpeedKts: number;
  windGustKts: number;
  windDirDeg: number;
  waveHeightFt: number;   // converted from meters: * 3.281
  wavePeriodS: number;
  swellHeightFt: number;
  swellPeriodS: number;
  tempF: number;
  visibilityMi: number;   // converted from meters: / 1609
  cloudCoverPct: number;
}

export interface ForecastResponse {
  lat: number;
  lng: number;
  hours: ForecastHour[];
  fetchedAt: string;
}

// Cache responses for 1 hour
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { data: ForecastResponse; ts: number }>();

function cacheKey(lat: number, lng: number, days: number): string {
  // Round to 1 decimal to cluster nearby requests
  return `${lat.toFixed(1)},${lng.toFixed(1)},${days}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');
  const days = Math.min(16, Math.max(1, parseInt(searchParams.get('days') ?? '7', 10)));

  if (isNaN(lat) || isNaN(lng)) {
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

    // Fetch weather and marine in parallel
    const [weatherRes, marineRes] = await Promise.all([
      fetch(weatherUrl, { next: { revalidate: 3600 } }),
      fetch(marineUrl, { next: { revalidate: 3600 } }).catch(() => null),
    ]);

    if (!weatherRes.ok) {
      throw new Error(`Weather API returned ${weatherRes.status}`);
    }

    const weather = await weatherRes.json();
    const marine = marineRes?.ok ? await marineRes.json() : null;

    const weatherHourly = weather.hourly ?? {};
    const marineHourly = marine?.hourly ?? {};
    const times: string[] = weatherHourly.time ?? [];

    const hours: ForecastHour[] = times.map((time: string, i: number) => ({
      time,
      windSpeedKts: weatherHourly.wind_speed_10m?.[i] ?? 0,
      windGustKts: weatherHourly.wind_gusts_10m?.[i] ?? 0,
      windDirDeg: weatherHourly.wind_direction_10m?.[i] ?? 0,
      waveHeightFt: (marineHourly.wave_height?.[i] ?? 0) * 3.281,
      wavePeriodS: marineHourly.wave_period?.[i] ?? 0,
      swellHeightFt: (marineHourly.swell_wave_height?.[i] ?? 0) * 3.281,
      swellPeriodS: marineHourly.swell_wave_period?.[i] ?? 0,
      tempF: weatherHourly.temperature_2m?.[i] ?? 0,
      visibilityMi: (weatherHourly.visibility?.[i] ?? 0) / 1609,
      cloudCoverPct: weatherHourly.cloud_cover?.[i] ?? 0,
    }));

    const data: ForecastResponse = {
      lat,
      lng,
      hours,
      fetchedAt: new Date().toISOString(),
    };

    // Update cache
    cache.set(key, { data, ts: Date.now() });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        'X-Cache': 'MISS',
      },
    });
  } catch (err) {
    console.error('[forecast] Error fetching forecast:', err);

    // Return empty but valid response rather than 500
    const fallback: ForecastResponse = {
      lat,
      lng,
      hours: [],
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(fallback, {
      headers: {
        'Cache-Control': 'no-cache',
        'X-Forecast-Error': 'true',
      },
    });
  }
}
