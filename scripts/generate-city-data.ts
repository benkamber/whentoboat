#!/usr/bin/env npx tsx
/**
 * Auto-generate city data from NOAA + OSM.
 *
 * Takes a CityConfig and produces a complete data directory:
 *   data/cities/{city-id}/destinations.ts
 *   data/cities/{city-id}/zones.ts
 *   data/cities/{city-id}/distances.ts
 *   data/cities/{city-id}/index.ts
 *
 * Usage:
 *   npx tsx scripts/generate-city-data.ts puget-sound
 *   npx tsx scripts/generate-city-data.ts miami
 *   npx tsx scripts/generate-city-data.ts --all
 *
 * Data sources (all free, no API keys):
 *   - NOAA NDBC via ERDDAP: monthly wind/wave/temp averages
 *   - NOAA CO-OPS: tide + current station metadata
 *   - OSM Overpass: marinas, launch ramps, yacht clubs
 *   - NWS: marine forecast zone names
 */

import fs from 'fs';
import path from 'path';
import { cityRegistry, type CityConfig } from '../engine/city-config';

const ERDDAP_BASE = 'https://coastwatch.pfeg.noaa.gov/erddap/tabledap/cwwcNDBCMet.json';
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const COOPS_BASE = 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchJSON(url: string, label: string): Promise<any> {
  console.log(`  Fetching ${label}...`);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) {
      console.warn(`  ⚠ ${label}: HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (e: any) {
    console.warn(`  ⚠ ${label}: ${e.message}`);
    return null;
  }
}

function msToKts(ms: number): number { return Math.round(ms * 1.944 * 10) / 10; }
function mToFt(m: number): number { return Math.round(m * 3.281 * 10) / 10; }
function cToF(c: number): number { return Math.round((c * 9/5 + 32) * 10) / 10; }

// ── Step 1: Discover NDBC stations in bounding box ──────────────────────────

async function discoverStations(bbox: [number, number, number, number]): Promise<string[]> {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const url = `${ERDDAP_BASE}?station,latitude,longitude` +
    `&latitude>=${minLat}&latitude<=${maxLat}` +
    `&longitude>=${minLng}&longitude<=${maxLng}` +
    `&distinct()&orderBy("station")`;

  const data = await fetchJSON(url, 'NDBC stations');
  if (!data?.table?.rows) return [];

  const stations = data.table.rows.map((r: any[]) => r[0] as string);
  console.log(`  Found ${stations.length} NDBC stations in bbox`);
  return stations;
}

// ── Step 2: Fetch monthly averages from ERDDAP ─────────────────────────────

interface MonthlyAvg {
  month: number; // 0-11
  amWindKts: number;
  pmWindKts: number;
  amWaveHtFt: number;
  pmWaveHtFt: number;
  waterTempF: number;
}

async function fetchMonthlyAverages(stationIds: string[]): Promise<MonthlyAvg[]> {
  // Try each station for wind data
  let windData: Map<number, { am: number; pm: number }> = new Map();
  let waveData: Map<number, { am: number; pm: number }> = new Map();
  let tempData: Map<number, number> = new Map();

  for (const station of stationIds) {
    // Monthly averages with AM/PM split
    const url = `${ERDDAP_BASE}?station,time,wspd,wvht,wtmp` +
      `&station="${station}"` +
      `&time>=2020-01-01T00:00:00Z&time<=2025-12-31T23:59:59Z` +
      `&orderByMean("station,time/1month")`;

    const data = await fetchJSON(url, `monthly avg ${station}`);
    if (!data?.table?.rows) continue;

    const colNames = data.table.columnNames as string[];
    const timeIdx = colNames.indexOf('time');
    const wspdIdx = colNames.indexOf('wspd');
    const wvhtIdx = colNames.indexOf('wvht');
    const wtmpIdx = colNames.indexOf('wtmp');

    for (const row of data.table.rows) {
      const time = row[timeIdx] as string;
      const month = new Date(time).getMonth();
      const wspd = row[wspdIdx] as number | null;
      const wvht = row[wvhtIdx] as number | null;
      const wtmp = row[wtmpIdx] as number | null;

      if (wspd !== null && !isNaN(wspd) && !windData.has(month)) {
        // Use same value for AM/PM as default — refine with 12hr query if available
        windData.set(month, { am: msToKts(wspd * 0.7), pm: msToKts(wspd) });
      }
      if (wvht !== null && !isNaN(wvht) && !waveData.has(month)) {
        waveData.set(month, { am: mToFt(wvht * 0.6), pm: mToFt(wvht) });
      }
      if (wtmp !== null && !isNaN(wtmp) && !tempData.has(month)) {
        tempData.set(month, cToF(wtmp));
      }
    }

    if (windData.size >= 10 && waveData.size >= 10) break; // Enough data
  }

  // Build 12-month array
  const result: MonthlyAvg[] = [];
  for (let m = 0; m < 12; m++) {
    result.push({
      month: m,
      amWindKts: windData.get(m)?.am ?? 5,
      pmWindKts: windData.get(m)?.pm ?? 10,
      amWaveHtFt: waveData.get(m)?.am ?? 0.5,
      pmWaveHtFt: waveData.get(m)?.pm ?? 1.5,
      waterTempF: tempData.get(m) ?? 60,
    });
  }

  console.log(`  Generated ${result.length} monthly averages (wind from ${windData.size} months, waves from ${waveData.size} months)`);
  return result;
}

// ── Step 3: Discover destinations from OSM Overpass ─────────────────────────

interface RawDestination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'marina' | 'slipway' | 'yacht_club' | 'boat_rental';
}

async function discoverDestinations(bbox: [number, number, number, number]): Promise<RawDestination[]> {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const query = `[out:json][timeout:30];
(
  node["leisure"="marina"](${minLat},${minLng},${maxLat},${maxLng});
  way["leisure"="marina"](${minLat},${minLng},${maxLat},${maxLng});
  node["leisure"="slipway"](${minLat},${minLng},${maxLat},${maxLng});
  node["leisure"="yacht_club"](${minLat},${minLng},${maxLat},${maxLng});
  node["amenity"="boat_rental"](${minLat},${minLng},${maxLat},${maxLng});
);
out center;`;

  const res = await fetch(OVERPASS_API, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    console.warn(`  ⚠ Overpass API: HTTP ${res.status}`);
    return [];
  }

  const data = await res.json();
  const results: RawDestination[] = [];
  const seen = new Set<string>();

  for (const el of data.elements ?? []) {
    const name = el.tags?.name;
    if (!name) continue;

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!lat || !lng) continue;

    // Dedupe by name (different OSM elements for same marina)
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);

    const type = el.tags?.leisure === 'marina' ? 'marina' as const
      : el.tags?.leisure === 'slipway' ? 'slipway' as const
      : el.tags?.leisure === 'yacht_club' ? 'yacht_club' as const
      : 'boat_rental' as const;

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').slice(0, 20);

    results.push({ id, name, lat, lng, type });
  }

  console.log(`  Found ${results.length} destinations from OSM`);
  return results;
}

// ── Step 4: Generate output files ───────────────────────────────────────────

function generateZonesFile(config: CityConfig, monthlyData: MonthlyAvg[]): string {
  // Create a single default zone for the city (can be refined later)
  const zoneName = config.name;
  const zoneId = config.id.replace(/-/g, '_');

  const monthlyConditions = monthlyData.map(m => {
    const amComfort = Math.max(1, Math.min(10, Math.round(10 - (m.amWindKts / 3 + m.amWaveHtFt * 2))));
    const pmComfort = Math.max(1, Math.min(10, Math.round(10 - (m.pmWindKts / 3 + m.pmWaveHtFt * 2))));
    return `      { month: ${m.month}, am: { windKts: ${m.amWindKts}, waveHtFt: ${m.amWaveHtFt}, wavePeriodS: 4, comfort: ${amComfort} }, pm: { windKts: ${m.pmWindKts}, waveHtFt: ${m.pmWaveHtFt}, wavePeriodS: 4, comfort: ${pmComfort} } },`;
  }).join('\n');

  return `// AUTO-GENERATED from NOAA NDBC buoy data
// Stations: ${config.buoyStations.join(', ')}
// Generated: ${new Date().toISOString().split('T')[0]}
// Comfort scores are default formula — refine with local knowledge.

import type { Zone } from '@/engine/types';

export const zones: Zone[] = [
  {
    id: '${zoneId}',
    name: '${zoneName}',
    characteristics: '${config.notes}',
    monthlyConditions: [
${monthlyConditions}
    ],
  },
];
`;
}

function generateDestinationsFile(config: CityConfig, destinations: RawDestination[]): string {
  const entries = destinations.map(d => {
    const activityTags = config.activities.map(a => `'${a}'`).join(', ');
    return `  {
    id: '${d.id}',
    name: '${d.name}',
    code: '${d.id.toUpperCase().slice(0, 3)}',
    lat: ${d.lat},
    lng: ${d.lng},
    zone: '${config.id.replace(/-/g, '_')}',
    area: '${d.type}',
    dockInfo: '${d.type === 'marina' ? 'Marina' : d.type === 'slipway' ? 'Launch ramp' : d.type === 'yacht_club' ? 'Yacht club' : 'Boat rental'}',
    activityTags: [${activityTags}] as ActivityType[],
    ${d.type === 'slipway' ? `launchRamp: {
      name: '${d.name}',
      type: 'public' as const,
      hours: 'Dawn to dusk',
      fee: 'Check locally',
      parking: 'Check locally',
      maxBoatLength: null,
      source: 'OpenStreetMap',
    },` : `launchRamp: null,`}
    minDepth: null,
    notes: 'Auto-discovered from OpenStreetMap. Verify details locally.',
  },`;
  }).join('\n');

  return `// AUTO-GENERATED from OpenStreetMap Overpass API
// Region: ${config.name}
// Generated: ${new Date().toISOString().split('T')[0]}
// Verify dock details, fees, and hours locally.

import type { Destination, ActivityType } from '@/engine/types';

export const destinations: Destination[] = [
${entries}
];
`;
}

function generateDistancesFile(destinations: RawDestination[]): string {
  // Compute haversine distances between all pairs
  function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const ids = destinations.map(d => `'${d.id}'`).join(', ');
  const pairs: string[] = [];

  for (let i = 0; i < destinations.length; i++) {
    for (let j = i + 1; j < destinations.length; j++) {
      const dist = Math.round(haversine(
        destinations[i].lat, destinations[i].lng,
        destinations[j].lat, destinations[j].lng
      ) * 10) / 10;
      if (dist < 50) { // Only include pairs within 50 miles
        pairs.push(`  ['${destinations[i].id}', '${destinations[j].id}', ${dist}],`);
      }
    }
  }

  return `// AUTO-GENERATED haversine distances
// Generated: ${new Date().toISOString().split('T')[0]}

import type { DistanceMatrix } from '@/engine/types';

const ids = [${ids}] as const;

const raw: [string, string, number][] = [
${pairs.join('\n')}
];

// Build symmetric distance matrix
export const distances: DistanceMatrix = {};
for (const [from, to, dist] of raw) {
  distances[\`\${from}-\${to}\`] = dist;
  distances[\`\${to}-\${from}\`] = dist;
}
`;
}

function generateIndexFile(config: CityConfig): string {
  return `// AUTO-GENERATED city index
// ${config.name} (${config.region})
// Generated: ${new Date().toISOString().split('T')[0]}

import { destinations } from './destinations';
import { zones } from './zones';
import { distances } from './distances';
import type { City } from '@/engine/types';

export const ${config.id.replace(/-/g, '_')}: City = {
  id: '${config.id}',
  name: '${config.name}',
  center: [${config.center[0]}, ${config.center[1]}],
  defaultZoom: ${config.defaultZoom},
  destinations,
  zones,
  distances,
  verifyLinks: [
    { label: 'NOAA Marine Forecast', url: 'https://www.weather.gov/marine', type: 'forecast' as const },
    { label: 'Tide Predictions', url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=${config.tideStation}', type: 'tide' as const },
  ],
};
`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function generateCity(config: CityConfig) {
  console.log(`\n═══ Generating ${config.name} ═══\n`);

  const outDir = path.join(__dirname, '..', 'data', 'cities', config.id);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Step 1: Discover all NDBC stations in the area
  const allStations = await discoverStations(config.bbox);
  const stationsToUse = config.buoyStations.length > 0 ? config.buoyStations : allStations.slice(0, 8);
  console.log(`  Using stations: ${stationsToUse.join(', ')}`);

  // Step 2: Fetch monthly averages
  const monthlyData = await fetchMonthlyAverages(stationsToUse);

  // Step 3: Discover destinations from OSM
  const destinations = await discoverDestinations(config.bbox);

  // Step 4: Generate output files
  console.log(`\n  Writing files to ${outDir}/`);

  fs.writeFileSync(path.join(outDir, 'zones.ts'), generateZonesFile(config, monthlyData));
  console.log(`  ✓ zones.ts (${monthlyData.length} months of conditions)`);

  fs.writeFileSync(path.join(outDir, 'destinations.ts'), generateDestinationsFile(config, destinations));
  console.log(`  ✓ destinations.ts (${destinations.length} destinations)`);

  fs.writeFileSync(path.join(outDir, 'distances.ts'), generateDistancesFile(destinations));
  console.log(`  ✓ distances.ts`);

  fs.writeFileSync(path.join(outDir, 'index.ts'), generateIndexFile(config));
  console.log(`  ✓ index.ts`);

  console.log(`\n  ✅ ${config.name} complete!`);
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: npx tsx scripts/generate-city-data.ts <city-id>');
  console.log('       npx tsx scripts/generate-city-data.ts --all');
  console.log('\nAvailable cities:');
  cityRegistry.forEach(c => console.log(`  ${c.id} — ${c.name} (${c.region})`));
  process.exit(0);
}

(async () => {
  const cities = args[0] === '--all'
    ? cityRegistry.filter(c => c.id !== 'sf-bay') // Skip SF Bay (already manually curated)
    : cityRegistry.filter(c => args.includes(c.id));

  if (cities.length === 0) {
    console.error(`No matching cities found for: ${args.join(', ')}`);
    process.exit(1);
  }

  for (const city of cities) {
    await generateCity(city);
  }

  console.log(`\nDone! Generated data for ${cities.length} city/cities.`);
  console.log('Review the output, then add the city to the app router.');
})();
