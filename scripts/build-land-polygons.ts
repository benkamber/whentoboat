#!/usr/bin/env npx tsx
/**
 * Builds SF Bay land polygons from OSM Overpass coastline data.
 *
 * Downloads natural=coastline ways from OpenStreetMap for the SF Bay area,
 * assembles them into closed land polygons, and saves as GeoJSON.
 *
 * OSM coastline convention: land is on the LEFT side of the way direction.
 * Connected ways form closed rings → land polygons.
 *
 * Output: data/geo/sf-bay-land.json (replaces hand-traced polygons)
 *
 * Run: npx tsx scripts/build-land-polygons.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'geo', 'sf-bay-land.json');

// SF Bay bounding box (slightly expanded to capture full coastline)
const BBOX = '37.55,-122.58,37.97,-122.15';

async function fetchCoastline(): Promise<any> {
  const query = `[out:json][timeout:60];way["natural"="coastline"](${BBOX});out geom;`;

  console.log('Fetching OSM coastline data for SF Bay...');
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!res.ok) throw new Error(`Overpass API returned ${res.status}`);
  return res.json();
}

interface Way {
  id: number;
  geometry: { lat: number; lon: number }[];
  tags?: Record<string, string>;
}

function assemblePolygons(ways: Way[]): GeoJSON.Feature[] {
  const features: GeoJSON.Feature[] = [];

  // Step 1: Find closed ways (islands) — these are already complete polygons
  const closedWays: Way[] = [];
  const openWays: Way[] = [];

  for (const way of ways) {
    const geom = way.geometry;
    if (!geom || geom.length < 3) continue;

    const first = geom[0];
    const last = geom[geom.length - 1];
    const isClosed = Math.abs(first.lat - last.lat) < 0.00001 &&
                     Math.abs(first.lon - last.lon) < 0.00001;

    if (isClosed) {
      closedWays.push(way);
    } else {
      openWays.push(way);
    }
  }

  console.log(`  ${closedWays.length} closed ways (islands/complete coastlines)`);
  console.log(`  ${openWays.length} open ways (coastline segments to assemble)`);

  // Step 2: Convert closed ways to polygons directly
  for (const way of closedWays) {
    const coords: [number, number][] = way.geometry.map(p => [p.lon, p.lat]);
    // Ensure closed ring
    if (coords[0][0] !== coords[coords.length - 1][0] ||
        coords[0][1] !== coords[coords.length - 1][1]) {
      coords.push([...coords[0]] as [number, number]);
    }

    const name = way.tags?.name || way.tags?.place || `coastline-${way.id}`;
    features.push({
      type: 'Feature',
      properties: {
        name,
        osm_id: way.id,
        source: 'osm-coastline',
        type: way.tags?.place === 'island' ? 'island' : 'coastline',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
    });
  }

  // Step 3: Assemble open ways into chains
  // Build a graph of way endpoints
  const chains: Way[][] = [];
  const used = new Set<number>();

  // Index ways by their start and end points (rounded to avoid float comparison issues)
  const pointKey = (lat: number, lon: number) =>
    `${lat.toFixed(6)},${lon.toFixed(6)}`;

  const startIndex = new Map<string, Way[]>();
  const endIndex = new Map<string, Way[]>();

  for (const way of openWays) {
    const geom = way.geometry;
    const startKey = pointKey(geom[0].lat, geom[0].lon);
    const endKey = pointKey(geom[geom.length - 1].lat, geom[geom.length - 1].lon);

    if (!startIndex.has(startKey)) startIndex.set(startKey, []);
    startIndex.get(startKey)!.push(way);

    if (!endIndex.has(endKey)) endIndex.set(endKey, []);
    endIndex.get(endKey)!.push(way);
  }

  // Follow chains: from each unused way, follow connected ways
  for (const startWay of openWays) {
    if (used.has(startWay.id)) continue;

    const chain: { lat: number; lon: number }[] = [...startWay.geometry];
    used.add(startWay.id);

    // Follow forward from end
    let extended = true;
    while (extended) {
      extended = false;
      const lastPoint = chain[chain.length - 1];
      const key = pointKey(lastPoint.lat, lastPoint.lon);

      // Find a way that starts where our chain ends
      const candidates = startIndex.get(key) || [];
      for (const candidate of candidates) {
        if (used.has(candidate.id)) continue;
        // Append (skip first point to avoid duplicate)
        chain.push(...candidate.geometry.slice(1));
        used.add(candidate.id);
        extended = true;
        break;
      }
    }

    // Check if this chain forms a closed ring
    const first = chain[0];
    const last = chain[chain.length - 1];
    const isClosed = Math.abs(first.lat - last.lat) < 0.0001 &&
                     Math.abs(first.lon - last.lon) < 0.0001;

    if (isClosed && chain.length >= 4) {
      const coords: [number, number][] = chain.map(p => [p.lon, p.lat]);
      // Ensure exactly closed
      coords[coords.length - 1] = [...coords[0]] as [number, number];

      features.push({
        type: 'Feature',
        properties: {
          name: `coastline-chain-${startWay.id}`,
          osm_id: startWay.id,
          source: 'osm-coastline-assembled',
          type: 'mainland',
          nodes: coords.length,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      });
    }
  }

  return features;
}

async function main() {
  try {
    const data = await fetchCoastline();
    const ways: Way[] = (data.elements || []).filter((e: any) => e.type === 'way');
    console.log(`  Received ${ways.length} coastline ways from OSM`);

    const features = assemblePolygons(ways);
    console.log(`\nAssembled ${features.length} land polygons:`);

    for (const f of features) {
      const coords = (f.geometry as GeoJSON.Polygon).coordinates[0];
      console.log(`  ${f.properties?.name}: ${coords.length} vertices (${f.properties?.type})`);
    }

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    // Ensure output directory exists
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geojson, null, 2));
    console.log(`\nSaved to ${OUTPUT_FILE} (${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(0)}KB)`);

  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

main();
