import { NextRequest, NextResponse } from 'next/server';

// ============================================
// Astronomical Data API
// Fetches sunrise/sunset/twilight/moon data
// from the US Naval Observatory API.
//
// Moon phase affects tidal amplitude:
// - New/Full moon = spring tides (strongest currents)
// - Quarter moons = neap tides (weakest currents)
// ============================================

export interface AstroData {
  date: string;
  sunrise: string | null;
  sunset: string | null;
  civilTwilightBegin: string | null;
  civilTwilightEnd: string | null;
  moonPhase: string | null;       // "New Moon", "First Quarter", "Full Moon", "Last Quarter"
  moonIllumination: number | null; // 0-1
  isSpringTide: boolean;           // within 2 days of new/full moon = stronger currents
  dayLengthHours: number | null;
}

export interface AstroResponse {
  data: AstroData | null;
  fetchedAt: string;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours (astro data changes daily)
const MAX_CACHE_SIZE = 30;
const cache = new Map<string, { data: AstroResponse; ts: number }>();

async function fetchWithTimeout(url: string, timeoutMs: number = 5000): Promise<Response> {
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dateStr = searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const lat = parseFloat(searchParams.get('lat') ?? '37.7749');
  const lng = parseFloat(searchParams.get('lng') ?? '-122.4194');

  const cacheKey = `${dateStr},${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, s-maxage=21600', 'X-Cache': 'HIT' },
    });
  }

  try {
    // Fetch from US Naval Observatory API
    // Compute timezone offset dynamically to handle DST
    const tzOffset = -new Date(dateStr + 'T12:00:00').getTimezoneOffset() / 60;
    const url = `https://aa.usno.navy.mil/api/rstt/oneday?date=${dateStr}&coords=${lat},${lng}&tz=${tzOffset}`;

    const res = await fetchWithTimeout(url, 5000);
    if (!res.ok) throw new Error(`USNO API returned ${res.status}`);

    const json = await res.json();
    const props = json.properties ?? {};
    const sunData = props.data?.sundata ?? [];
    const moonData = props.data?.moondata ?? [];
    const curPhase = props.data?.curphase ?? null;
    const fracIllum = props.data?.fracillum != null
      ? parseFloat(String(props.data.fracillum).replace('%', '')) / 100
      : null;

    // Extract sun times
    const findTime = (arr: any[], phen: string) =>
      arr.find((d: any) => d.phen === phen)?.time ?? null;

    const sunrise = findTime(sunData, 'Rise');
    const sunset = findTime(sunData, 'Set');
    const twilightBegin = findTime(sunData, 'BC'); // civil twilight begin
    const twilightEnd = findTime(sunData, 'EC');   // civil twilight end

    // Compute day length
    let dayLengthHours: number | null = null;
    if (sunrise && sunset) {
      const parseTime = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h + m / 60;
      };
      dayLengthHours = Math.round((parseTime(sunset) - parseTime(sunrise)) * 10) / 10;
    }

    // Determine spring tide (new or full moon ± 2 days)
    const phaseName = curPhase ?? '';
    const isSpringTide = phaseName.toLowerCase().includes('new') ||
                         phaseName.toLowerCase().includes('full');

    const astroData: AstroData = {
      date: dateStr,
      sunrise,
      sunset,
      civilTwilightBegin: twilightBegin,
      civilTwilightEnd: twilightEnd,
      moonPhase: curPhase,
      moonIllumination: fracIllum,
      isSpringTide,
      dayLengthHours,
    };

    const result: AstroResponse = {
      data: astroData,
      fetchedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, { data: result, ts: Date.now() });
    // Evict oldest entries when cache exceeds limit
    if (cache.size > MAX_CACHE_SIZE) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
      for (let i = 0; i < cache.size - MAX_CACHE_SIZE; i++) cache.delete(oldest[i][0]);
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=21600', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error('[astro] Error fetching USNO data:', err);
    return NextResponse.json({
      data: null,
      fetchedAt: new Date().toISOString(),
    } satisfies AstroResponse, {
      headers: { 'Cache-Control': 'no-cache' },
    });
  }
}
