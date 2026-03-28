import { NextRequest, NextResponse } from 'next/server';

// ============================================
// NDBC Buoy Observations API
// Fetches real-time observations from NOAA NDBC
// stations near SF Bay via ERDDAP JSON API.
//
// Key stations:
// - 46026: SF Bar (18nm west, offshore buoy)
// - 46237: SF Bar waverider (at bay entrance)
// - FTPC1: Fort Point (inside Golden Gate)
// - TIBC1: Tiburon
// - RCMC1: Richmond
// - AAMC1: Alameda
// ============================================

export interface BuoyObservation {
  station: string;
  time: string;
  windSpeedKts: number | null;
  windDirDeg: number | null;
  windGustKts: number | null;
  waveHeightFt: number | null;
  wavePeriodS: number | null;
  waveDirDeg: number | null;
  waterTempF: number | null;
  airTempF: number | null;
  pressureHpa: number | null;
  visibilityNm: number | null;
  dewpointF: number | null;
}

export interface BuoyResponse {
  observations: BuoyObservation[];
  fetchedAt: string;
  stations: string[];
}

// SF Bay area NDBC stations
const SF_BAY_STATIONS = ['46026', '46237', 'FTPC1', 'TIBC1', 'RCMC1', 'AAMC1', 'OBXC1'];

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
let cache: { data: BuoyResponse; ts: number } | null = null;

async function fetchWithTimeout(url: string, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'WhenToBoat/1.0 (recreational boating planning app)' },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// Convert Celsius to Fahrenheit
function cToF(c: number | null): number | null {
  return c != null && !isNaN(c) ? Math.round((c * 9/5 + 32) * 10) / 10 : null;
}

// Convert m/s to knots
function msToKts(ms: number | null): number | null {
  return ms != null && !isNaN(ms) ? Math.round(ms * 1.944 * 10) / 10 : null;
}

// Convert meters to feet
function mToFt(m: number | null): number | null {
  return m != null && !isNaN(m) ? Math.round(m * 3.281 * 10) / 10 : null;
}

export async function GET(_request: NextRequest) {
  // Return cached data if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { 'Cache-Control': 'public, s-maxage=900', 'X-Cache': 'HIT' },
    });
  }

  try {
    // Query ERDDAP for latest observations from all SF Bay stations
    // Get the last 3 hours of data to ensure we have recent readings
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const url =
      `https://coastwatch.pfeg.noaa.gov/erddap/tabledap/cwwcNDBCMet.json` +
      `?station,time,wtmp,atmp,wspd,wd,gst,wvht,dpd,mwd,bar,vis,dewp` +
      `&station=~"${SF_BAY_STATIONS.join('|')}"` +
      `&time>=${threeHoursAgo.toISOString()}` +
      `&orderBy("station,time")`;

    const res = await fetchWithTimeout(url, 8000);
    if (!res.ok) {
      throw new Error(`ERDDAP returned ${res.status}`);
    }

    const data = await res.json();
    const rows = data.table?.rows ?? [];
    const cols = data.table?.columnNames ?? [];

    // Map column indices
    const colIdx: Record<string, number> = {};
    cols.forEach((name: string, i: number) => { colIdx[name] = i; });

    // Get the most recent observation per station
    const latestByStation = new Map<string, any[]>();
    for (const row of rows) {
      const station = row[colIdx['station']];
      latestByStation.set(station, row); // last row per station (ordered by time)
    }

    const observations: BuoyObservation[] = [];
    for (const [station, row] of latestByStation) {
      observations.push({
        station,
        time: row[colIdx['time']] ?? '',
        windSpeedKts: msToKts(row[colIdx['wspd']]),
        windDirDeg: row[colIdx['wd']] ?? null,
        windGustKts: msToKts(row[colIdx['gst']]),
        waveHeightFt: mToFt(row[colIdx['wvht']]),
        wavePeriodS: row[colIdx['dpd']] ?? null,
        waveDirDeg: row[colIdx['mwd']] ?? null,
        waterTempF: cToF(row[colIdx['wtmp']]),
        airTempF: cToF(row[colIdx['atmp']]),
        pressureHpa: row[colIdx['bar']] ?? null,
        visibilityNm: row[colIdx['vis']] ?? null,
        dewpointF: cToF(row[colIdx['dewp']]),
      });
    }

    const result: BuoyResponse = {
      observations,
      fetchedAt: new Date().toISOString(),
      stations: observations.map(o => o.station),
    };

    cache = { data: result, ts: Date.now() };

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=900', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error('[buoy] Error fetching NDBC data:', err);
    return NextResponse.json({
      observations: [],
      fetchedAt: new Date().toISOString(),
      stations: [],
    } satisfies BuoyResponse, {
      headers: { 'Cache-Control': 'no-cache' },
    });
  }
}
