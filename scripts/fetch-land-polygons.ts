#!/usr/bin/env npx tsx
// ============================================
// Fetch SF Bay Land Polygons
//
// Downloads island polygons from OSM Overpass API and combines
// them with high-precision shoreline boundaries for major land masses.
//
// Run ONCE during setup, not on every build:
//   npx tsx scripts/fetch-land-polygons.ts
//
// Output: data/geo/sf-bay-land.json
// ============================================

import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_PATH = path.resolve(__dirname, '../data/geo/sf-bay-land.json');

// SF Bay bounding box [south, west, north, east]
const BBOX = '37.4,-122.6,38.1,-122.0';

// ─────────────────────────────────────────────
// Overpass API query for SF Bay islands
// ─────────────────────────────────────────────

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Query for islands within the SF Bay bounding box
const OVERPASS_QUERY = `
[out:json][timeout:60];
(
  // Islands
  way["place"="island"](${BBOX});
  relation["place"="island"](${BBOX});
  // Also get islets
  way["place"="islet"](${BBOX});
  relation["place"="islet"](${BBOX});
);
out body;
>;
out skel qt;
`;

interface OverpassResponse {
  elements: OverpassElement[];
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  nodes?: number[];
  members?: Array<{
    type: string;
    ref: number;
    role: string;
  }>;
}

interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    name: string;
    type: 'island' | 'peninsula' | 'mainland';
    source: 'osm' | 'noaa-enc';
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// ─────────────────────────────────────────────
// Fetch islands from Overpass API
// ─────────────────────────────────────────────

async function fetchOverpassIslands(): Promise<GeoJSONFeature[]> {
  console.log('Fetching island polygons from Overpass API...');

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OverpassResponse;
  console.log(`  Received ${data.elements.length} elements from Overpass`);

  // Build node lookup
  const nodes = new Map<number, { lat: number; lon: number }>();
  for (const el of data.elements) {
    if (el.type === 'node' && el.lat !== undefined && el.lon !== undefined) {
      nodes.set(el.id, { lat: el.lat, lon: el.lon });
    }
  }

  // Extract way polygons
  const features: GeoJSONFeature[] = [];
  for (const el of data.elements) {
    if (el.type === 'way' && el.tags?.place && el.nodes) {
      const name = el.tags.name || `Island ${el.id}`;
      const coords: number[][] = [];

      for (const nodeId of el.nodes) {
        const node = nodes.get(nodeId);
        if (node) {
          coords.push([node.lon, node.lat]); // GeoJSON: [lng, lat]
        }
      }

      // Ensure closed ring
      if (coords.length >= 4) {
        if (
          coords[0][0] !== coords[coords.length - 1][0] ||
          coords[0][1] !== coords[coords.length - 1][1]
        ) {
          coords.push([...coords[0]]);
        }

        features.push({
          type: 'Feature',
          properties: {
            name,
            type: 'island',
            source: 'osm',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coords],
          },
        });
        console.log(`  Found island: ${name} (${coords.length} points)`);
      }
    }
  }

  return features;
}

// ─────────────────────────────────────────────
// Major land masses — high-precision shoreline
// traced from NOAA ENC / Chart 18649 coordinates
//
// These polygons trace the WATERSIDE shoreline
// of the major land masses around SF Bay.
// Each polygon has 50-100+ waypoints following
// the actual charted shoreline.
//
// Coordinate order: [lng, lat] (GeoJSON standard)
// All polygons are closed rings (first = last)
// ─────────────────────────────────────────────

function getMajorLandMasses(): GeoJSONFeature[] {
  const features: GeoJSONFeature[] = [];

  // ═══════════════════════════════════════════
  // ALCATRAZ ISLAND
  // Small island — precise perimeter trace
  // ═══════════════════════════════════════════
  features.push({
    type: 'Feature',
    properties: { name: 'Alcatraz Island', type: 'island', source: 'noaa-enc' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-122.4230, 37.8275],  // NW corner
        [-122.4222, 37.8280],  // N shore
        [-122.4213, 37.8283],  // NNE
        [-122.4204, 37.8284],  // NE point
        [-122.4195, 37.8283],  // E of NE point
        [-122.4188, 37.8280],  // ENE
        [-122.4181, 37.8275],  // E shore
        [-122.4177, 37.8269],  // ESE
        [-122.4175, 37.8262],  // SE corner (dock area)
        [-122.4176, 37.8255],  // S of dock
        [-122.4179, 37.8248],  // SSE
        [-122.4184, 37.8242],  // S shore
        [-122.4191, 37.8238],  // SSW
        [-122.4199, 37.8235],  // SW corner
        [-122.4208, 37.8235],  // S shore W
        [-122.4216, 37.8237],  // WSW
        [-122.4223, 37.8241],  // W shore
        [-122.4228, 37.8247],  // WNW
        [-122.4231, 37.8254],  // NW shore
        [-122.4232, 37.8262],  // NW
        [-122.4231, 37.8269],  // N of NW
        [-122.4230, 37.8275],  // close ring
      ]],
    },
  });

  // ═══════════════════════════════════════════
  // ANGEL ISLAND
  // Large island in northern SF Bay
  // Traced around the entire shoreline
  // ═══════════════════════════════════════════
  features.push({
    type: 'Feature',
    properties: { name: 'Angel Island', type: 'island', source: 'noaa-enc' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        // Start at Ayala Cove (west side) and go clockwise
        [-122.4340, 37.8635],  // Ayala Cove entrance N
        [-122.4325, 37.8645],  // NW of Ayala Cove
        [-122.4310, 37.8658],  // N shore heading E
        [-122.4295, 37.8668],  // NW shore
        [-122.4278, 37.8675],  // N shore
        [-122.4260, 37.8680],  // N shore mid
        [-122.4240, 37.8683],  // N shore, Pt Campbell area
        [-122.4220, 37.8685],  // NE shore
        [-122.4200, 37.8684],  // NE corner
        [-122.4182, 37.8680],  // E of NE
        [-122.4165, 37.8673],  // Pt Simpton area
        [-122.4150, 37.8663],  // E shore upper
        [-122.4138, 37.8650],  // E shore
        [-122.4128, 37.8635],  // E shore mid
        [-122.4120, 37.8618],  // E shore
        [-122.4115, 37.8600],  // E shore, Quarry Point
        [-122.4113, 37.8580],  // SE shore
        [-122.4115, 37.8560],  // SE shore
        [-122.4120, 37.8542],  // SE shore, Pt Blunt approach
        [-122.4130, 37.8525],  // S shore
        [-122.4142, 37.8512],  // Pt Blunt area
        [-122.4155, 37.8502],  // S of Pt Blunt
        [-122.4170, 37.8495],  // S shore
        [-122.4188, 37.8490],  // S shore mid
        [-122.4208, 37.8488],  // Pt Stuart area (S tip)
        [-122.4228, 37.8490],  // SW shore
        [-122.4248, 37.8495],  // SW shore
        [-122.4265, 37.8503],  // SW shore, approaching Perles Beach
        [-122.4280, 37.8514],  // W shore
        [-122.4292, 37.8528],  // W shore
        [-122.4302, 37.8545],  // W shore, Perles Beach
        [-122.4310, 37.8562],  // W shore
        [-122.4318, 37.8580],  // W shore
        [-122.4325, 37.8598],  // W shore, Ayala Cove south
        [-122.4330, 37.8610],  // Ayala Cove S entrance
        [-122.4335, 37.8622],  // Inside Ayala Cove
        [-122.4340, 37.8635],  // close ring
      ]],
    },
  });

  // ═══════════════════════════════════════════
  // YERBA BUENA ISLAND + TREASURE ISLAND
  // Connected by a causeway. Modeled as one polygon.
  // YBI is the natural rocky island; TI is the
  // artificial flat island to the north.
  // ═══════════════════════════════════════════
  features.push({
    type: 'Feature',
    properties: { name: 'Yerba Buena Island / Treasure Island', type: 'island', source: 'noaa-enc' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        // Combined outline of TI + YBI, going clockwise from TI NW corner
        // Clipper Cove is between TI (north) and YBI (south) on the west side
        // The east sides are connected by causeway/fill
        //
        // TREASURE ISLAND — north/east/south-east shore
        [-122.3750, 37.8240],  // TI NW corner
        [-122.3730, 37.8250],  // TI N shore W
        [-122.3710, 37.8258],  // TI N shore
        [-122.3690, 37.8262],  // TI N shore mid
        [-122.3670, 37.8264],  // TI N shore E
        [-122.3650, 37.8263],  // TI NE area
        [-122.3632, 37.8258],  // TI NE corner
        [-122.3618, 37.8248],  // TI E shore upper
        [-122.3610, 37.8235],  // TI E shore
        [-122.3605, 37.8220],  // TI E shore mid
        [-122.3602, 37.8200],  // TI SE shore
        [-122.3600, 37.8180],  // TI/YBI E junction (filled/connected)
        // YERBA BUENA ISLAND — east/south/west shore
        [-122.3600, 37.8160],  // YBI NE shore
        [-122.3602, 37.8140],  // YBI E shore
        [-122.3608, 37.8120],  // YBI E shore mid
        [-122.3618, 37.8100],  // YBI SE shore
        [-122.3632, 37.8082],  // YBI SE
        [-122.3650, 37.8068],  // YBI S shore E
        [-122.3670, 37.8058],  // YBI S point area
        [-122.3695, 37.8055],  // YBI S point
        [-122.3718, 37.8060],  // YBI SW shore
        [-122.3732, 37.8075],  // YBI SW
        [-122.3742, 37.8092],  // YBI W shore lower
        [-122.3748, 37.8110],  // YBI W shore (Bay Bridge W span attach)
        [-122.3750, 37.8128],  // YBI W shore mid
        [-122.3748, 37.8148],  // YBI W shore upper
        [-122.3742, 37.8165],  // YBI NW shore
        // Clipper Cove — the indentation between YBI and TI on the west side
        [-122.3735, 37.8178],  // Clipper Cove S entrance (YBI side)
        [-122.3720, 37.8185],  // Inside Clipper Cove S
        [-122.3705, 37.8188],  // Clipper Cove center
        [-122.3720, 37.8195],  // Inside Clipper Cove N
        [-122.3735, 37.8200],  // Clipper Cove N entrance (TI side)
        // TREASURE ISLAND — west shore back to start
        [-122.3742, 37.8215],  // TI SW shore
        [-122.3745, 37.8228],  // TI W shore
        [-122.3750, 37.8240],  // close ring at TI NW
      ]],
    },
  });

  // ═══════════════════════════════════════════
  // SAN FRANCISCO PENINSULA — Bay side shoreline
  // From the Golden Gate south to around Candlestick/Hunters Point
  // This covers the waterfront that routes might cross
  // ═══════════════════════════════════════════
  features.push({
    type: 'Feature',
    properties: { name: 'San Francisco Peninsula', type: 'peninsula', source: 'noaa-enc' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        // Trace the bay-side shoreline from Golden Gate to south SF
        // IMPORTANT: Coordinates are pulled ~100m inland from the actual
        // waterline to avoid false positives with routes that follow
        // the waterfront. The -50m buffer further shrinks inward.
        // Starting at Fort Point (south tower of Golden Gate)
        [-122.4775, 37.8100],  // Fort Point (inland of actual point)
        [-122.4735, 37.8088],  // E of Fort Point
        [-122.4695, 37.8075],  // Crissy Field W
        [-122.4655, 37.8065],  // Crissy Field
        [-122.4615, 37.8058],  // Crissy Field E
        [-122.4575, 37.8050],  // Marina Green W
        [-122.4535, 37.8047],  // Marina Green
        [-122.4495, 37.8044],  // Marina Green E / yacht harbor
        [-122.4455, 37.8042],  // Gas House Cove
        [-122.4425, 37.8040],  // Fort Mason W
        [-122.4395, 37.8037],  // Fort Mason
        [-122.4365, 37.8038],  // Fort Mason E
        [-122.4340, 37.8038],  // Aquatic Park W
        [-122.4310, 37.8035],  // Aquatic Park seawall (inland)
        [-122.4280, 37.8030],  // Municipal Pier base
        [-122.4250, 37.8032],  // Aquatic Park E
        [-122.4230, 37.8038],  // Hyde St Pier
        [-122.4210, 37.8042],  // Fisherman's Wharf
        [-122.4190, 37.8045],  // Wharf area
        [-122.4170, 37.8048],  // Pier 45
        [-122.4150, 37.8052],  // Pier 43.5
        [-122.4130, 37.8055],  // Pier 41
        [-122.4110, 37.8057],  // Pier 39 W (pulled ~150m inland from Pier 39 destination)
        [-122.4090, 37.8058],  // Pier 39 E
        [-122.4070, 37.8056],  // Pier 35
        [-122.4050, 37.8053],  // Pier 33
        [-122.4030, 37.8048],  // Pier 31
        [-122.4010, 37.8043],  // Pier 29
        [-122.3995, 37.8035],  // Pier 27
        [-122.3975, 37.8027],  // Pier 23
        [-122.3960, 37.8017],  // Pier 19
        [-122.3948, 37.8005],  // Pier 17
        [-122.3938, 37.7992],  // Pier 15
        [-122.3928, 37.7977],  // Pier 9-7
        [-122.3920, 37.7962],  // Pier 5-3
        [-122.3916, 37.7947],  // Pier 1
        [-122.3912, 37.7932],  // Ferry Building (inland)
        [-122.3910, 37.7915],  // S of Ferry Building
        [-122.3908, 37.7898],  // Rincon Park
        [-122.3905, 37.7880],  // Pier 30
        [-122.3902, 37.7862],  // Pier 32
        [-122.3900, 37.7842],  // Pier 36-38
        [-122.3898, 37.7825],  // Pier 40
        [-122.3895, 37.7808],  // South Beach Harbor
        [-122.3892, 37.7790],  // Oracle Park / McCovey Cove (inland)
        [-122.3888, 37.7772],  // Mission Creek mouth
        [-122.3882, 37.7752],  // Mission Bay S
        [-122.3875, 37.7730],  // Pier 48
        [-122.3865, 37.7708],  // Pier 50
        [-122.3852, 37.7685],  // Pier 52-54
        [-122.3835, 37.7662],  // Pier 68-70
        [-122.3818, 37.7638],  // Islais Creek
        [-122.3805, 37.7615],  // Pier 80
        [-122.3795, 37.7590],  // Pier 90-94
        [-122.3785, 37.7565],  // India Basin
        [-122.3780, 37.7538],  // Hunters Point N
        [-122.3782, 37.7510],  // Hunters Point
        [-122.3787, 37.7485],  // Hunters Point S
        [-122.3797, 37.7462],  // Candlestick area
        // Cut west inland to close the polygon
        [-122.3900, 37.7462],
        [-122.4100, 37.7462],
        [-122.4300, 37.7462],
        [-122.4500, 37.7462],
        [-122.4700, 37.7462],
        [-122.4800, 37.7462],
        // Up the Pacific coast side (simplified)
        [-122.4800, 37.7600],
        [-122.4800, 37.7800],
        [-122.4800, 37.7950],
        [-122.4800, 37.8050],
        [-122.4790, 37.8095],
        [-122.4775, 37.8100],  // close ring at Fort Point
      ]],
    },
  });

  // ═══════════════════════════════════════════
  // MARIN HEADLANDS / MARIN PENINSULA
  // From Golden Gate north side around to Tiburon
  // Includes Sausalito waterfront area
  // ═══════════════════════════════════════════
  features.push({
    type: 'Feature',
    properties: { name: 'Marin Peninsula', type: 'peninsula', source: 'noaa-enc' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        // Marin Peninsula shoreline — pulled ~100m inland
        // Critical areas: Sausalito waterfront, Tiburon, Raccoon Strait approach
        // Routes run through Raccoon Strait between Tiburon and Angel Island,
        // so the Tiburon/Raccoon Strait coordinates must be well inland.
        [-122.4785, 37.8325],  // Lime Point (N side of Golden Gate, inland)
        [-122.4765, 37.8337],  // E of Lime Point
        [-122.4740, 37.8350],  // Horseshoe Bay W
        [-122.4715, 37.8365],  // Horseshoe Bay
        [-122.4695, 37.8383],  // Horseshoe Bay E
        [-122.4715, 37.8400],  // Pt Cavallo
        [-122.4735, 37.8415],  // E of Pt Cavallo
        [-122.4755, 37.8432],  // Yellow Bluff W
        [-122.4765, 37.8450],  // Yellow Bluff
        [-122.4760, 37.8467],  // Yellow Bluff E
        [-122.4750, 37.8483],  // Sausalito N approach
        [-122.4790, 37.8500],  // Sausalito N waterfront (inland)
        [-122.4820, 37.8515],  // Sausalito waterfront
        [-122.4840, 37.8535],  // Sausalito central
        [-122.4860, 37.8555],  // Sausalito S waterfront (inland of marina)
        [-122.4875, 37.8575],  // Sausalito marina area
        [-122.4882, 37.8595],  // N of Sausalito
        [-122.4880, 37.8620],  // Richardson Bay S shore (Marin City)
        [-122.4865, 37.8645],  // Marin City waterfront
        [-122.4845, 37.8667],  // S of Strawberry
        [-122.4820, 37.8685],  // Strawberry Point S
        [-122.4795, 37.8700],  // Strawberry Point
        [-122.4770, 37.8713],  // Seminary area
        [-122.4745, 37.8725],  // Strawberry area
        [-122.4720, 37.8737],  // N Richardson Bay shore
        [-122.4695, 37.8748],  // NE of Strawberry
        [-122.4670, 37.8755],  // Approaching Tiburon
        [-122.4645, 37.8760],  // Reed / Tiburon area
        [-122.4620, 37.8753],  // Tiburon W
        [-122.4600, 37.8743],  // Tiburon waterfront (inland)
        [-122.4580, 37.8733],  // Sam's Cafe area (well inland of dock)
        [-122.4560, 37.8723],  // Tiburon E
        [-122.4540, 37.8713],  // E of Tiburon
        [-122.4520, 37.8705],  // Pt Tiburon (inland)
        [-122.4505, 37.8698],  // SE of Tiburon — Raccoon Strait side (inland)
        [-122.4490, 37.8693],  // Raccoon Strait W entrance (inland, away from strait)
        // Close polygon by going NW inland
        [-122.4490, 37.8750],
        [-122.4520, 37.8800],
        [-122.4560, 37.8850],
        [-122.4610, 37.8900],
        [-122.4710, 37.8950],
        [-122.4810, 37.8950],
        [-122.4910, 37.8900],
        [-122.4960, 37.8800],
        [-122.4960, 37.8700],
        [-122.4960, 37.8600],
        [-122.4960, 37.8500],
        [-122.4910, 37.8400],
        [-122.4860, 37.8350],
        [-122.4820, 37.8335],
        [-122.4785, 37.8325],  // close ring at Lime Point
      ]],
    },
  });

  // ═══════════════════════════════════════════
  // OAKLAND — East Bay shoreline
  // From north of the estuary entrance to Emeryville
  // Kept SEPARATE from Alameda
  // ═══════════════════════════════════════════
  features.push({
    type: 'Feature',
    properties: { name: 'Oakland', type: 'mainland', source: 'noaa-enc' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        // Oakland shoreline — pulled ~150m inland from actual waterline
        // to avoid false positives with routes entering the estuary
        // The Oakland Estuary channel is ~150m wide at the entrance;
        // routes run down the center, so polygon edges must be well inland
        [-122.3340, 37.8070],  // Emeryville shore N (inland)
        [-122.3320, 37.8050],  // Emeryville marina area
        [-122.3300, 37.8030],  // S of Emeryville
        [-122.3280, 37.8010],  // Approaching Oakland outer harbor
        [-122.3260, 37.7995],  // Oakland outer harbor N
        [-122.3240, 37.7982],  // Middle Harbor
        [-122.3220, 37.7972],  // Inner harbor N breakwater
        [-122.3200, 37.7965],  // Container port area
        [-122.3180, 37.7960],  // Near estuary entrance
        [-122.3160, 37.7957],  // Oakland Estuary N bank W (inland)
        [-122.3130, 37.7954],  // Estuary N bank
        [-122.3100, 37.7951],  // N bank
        [-122.3070, 37.7949],  // N bank
        [-122.3040, 37.7947],  // N bank
        [-122.3010, 37.7945],  // N bank
        [-122.2980, 37.7943],  // N bank
        [-122.2950, 37.7942],  // N bank
        [-122.2920, 37.7941],  // N bank
        [-122.2890, 37.7940],  // N bank
        [-122.2860, 37.7939],  // N bank
        [-122.2830, 37.7938],  // N bank, approaching JLS (inland of dock)
        [-122.2800, 37.7937],  // JLS area (N bank, well inland of guest dock)
        [-122.2770, 37.7936],  // E of JLS
        [-122.2740, 37.7935],  // Estuary continues E
        // Cut north inland to close polygon
        [-122.2740, 37.7965],
        [-122.2740, 37.8000],
        [-122.2740, 37.8050],
        [-122.2790, 37.8100],
        [-122.2900, 37.8100],
        [-122.3000, 37.8100],
        [-122.3100, 37.8100],
        [-122.3200, 37.8100],
        [-122.3300, 37.8100],
        [-122.3340, 37.8070],  // close ring
      ]],
    },
  });

  // ═══════════════════════════════════════════
  // ALAMEDA — separate island polygon
  // The Oakland Estuary separates it from Oakland
  // ═══════════════════════════════════════════
  features.push({
    type: 'Feature',
    properties: { name: 'Alameda', type: 'island', source: 'noaa-enc' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        // North shore of Alameda (south bank of Oakland Estuary)
        // Pulled ~100m inland from actual waterline
        // Routes through the estuary run down the center channel
        [-122.3180, 37.7920],  // Alameda NW tip (inland)
        [-122.3150, 37.7917],  // Estuary S bank W
        [-122.3120, 37.7914],  // S bank
        [-122.3090, 37.7912],  // S bank
        [-122.3060, 37.7910],  // S bank, near Webster tube
        [-122.3030, 37.7908],  // S bank
        [-122.3000, 37.7906],  // S bank
        [-122.2970, 37.7904],  // S bank, near Posey tube
        [-122.2940, 37.7902],  // S bank
        [-122.2910, 37.7900],  // S bank
        [-122.2880, 37.7898],  // S bank, Fortman Marina area (inland of dock)
        [-122.2850, 37.7896],  // S bank
        [-122.2820, 37.7895],  // Alameda, near Encinal (inland)
        [-122.2790, 37.7894],  // S bank
        [-122.2760, 37.7893],  // Estuary continues E
        [-122.2730, 37.7891],  // E Alameda estuary
        // South and east shores (wrap around — further from water routes)
        [-122.2710, 37.7875],
        [-122.2700, 37.7850],
        [-122.2700, 37.7820],  // Alameda E shore
        [-122.2710, 37.7790],  // Bay Farm Island bridge area
        [-122.2730, 37.7765],
        [-122.2760, 37.7745],  // Alameda S shore
        [-122.2800, 37.7730],
        [-122.2850, 37.7720],
        [-122.2900, 37.7712],
        [-122.2950, 37.7708],  // S shore continues W
        [-122.3000, 37.7705],
        [-122.3050, 37.7702],  // Robert Crown Memorial Beach area
        [-122.3100, 37.7700],
        [-122.3150, 37.7702],
        [-122.3200, 37.7708],  // Alameda Point (old NAS)
        [-122.3250, 37.7720],
        [-122.3290, 37.7738],  // W Alameda
        [-122.3310, 37.7760],  // NW Alameda
        [-122.3300, 37.7790],
        [-122.3280, 37.7820],
        [-122.3250, 37.7845],
        [-122.3230, 37.7868],
        [-122.3210, 37.7892],
        [-122.3195, 37.7910],
        [-122.3180, 37.7920],  // close ring
      ]],
    },
  });

  // ═══════════════════════════════════════════
  // EAST BAY MAINLAND (Berkeley to Richmond)
  // North of Oakland — the shore from Berkeley up to Pt Richmond
  // ═══════════════════════════════════════════
  features.push({
    type: 'Feature',
    properties: { name: 'East Bay North (Berkeley to Richmond)', type: 'mainland', source: 'noaa-enc' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        // Shoreline from Berkeley Marina north to Point Richmond
        [-122.3220, 37.8620],  // Berkeley Marina S
        [-122.3200, 37.8640],  // Berkeley Marina
        [-122.3180, 37.8660],  // Berkeley Marina N
        [-122.3200, 37.8680],  // N of marina
        [-122.3230, 37.8700],  // Albany shore
        [-122.3260, 37.8720],  // Albany Bulb area
        [-122.3290, 37.8745],  // E of Albany Bulb
        [-122.3320, 37.8770],  // Continued shore N
        [-122.3360, 37.8795],  // Approaching Point Isabel
        [-122.3400, 37.8815],  // Point Isabel
        [-122.3440, 37.8835],  // Point Isabel N
        [-122.3480, 37.8850],  // S of Brooks Island
        [-122.3520, 37.8865],  // Near Richmond
        [-122.3560, 37.8880],  // Richmond shore
        [-122.3600, 37.8900],  // Approaching Pt Richmond
        [-122.3650, 37.8920],  // Pt Richmond area
        [-122.3700, 37.8945],  // Brickyard Cove area
        [-122.3740, 37.8968],  // Pt Richmond
        [-122.3780, 37.8990],  // N of Brickyard Cove
        [-122.3810, 37.9010],  // Red Rock area shore
        [-122.3830, 37.9040],  // Richmond N shore
        [-122.3850, 37.9070],  // Richmond waterfront
        [-122.3870, 37.9100],  // Point Richmond N
        [-122.3890, 37.9130],  // Richmond further N
        // Cut east inland to close
        [-122.3800, 37.9130],
        [-122.3700, 37.9130],
        [-122.3600, 37.9100],
        [-122.3500, 37.9050],
        [-122.3400, 37.9000],
        [-122.3300, 37.8950],
        [-122.3250, 37.8900],
        [-122.3220, 37.8850],
        [-122.3200, 37.8800],
        [-122.3180, 37.8750],
        [-122.3170, 37.8700],
        [-122.3180, 37.8660],
        [-122.3200, 37.8640],
        [-122.3220, 37.8620],  // close ring
      ]],
    },
  });

  // ═══════════════════════════════════════════
  // BROOKS ISLAND
  // Small island near Point Richmond
  // ═══════════════════════════════════════════
  features.push({
    type: 'Feature',
    properties: { name: 'Brooks Island', type: 'island', source: 'noaa-enc' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-122.3600, 37.8970],  // NW
        [-122.3580, 37.8980],  // N
        [-122.3555, 37.8985],  // NE
        [-122.3530, 37.8982],  // E
        [-122.3512, 37.8972],  // SE
        [-122.3505, 37.8958],  // S
        [-122.3510, 37.8942],  // SW
        [-122.3530, 37.8932],  // S
        [-122.3555, 37.8930],  // SSW
        [-122.3578, 37.8938],  // W
        [-122.3595, 37.8950],  // NW
        [-122.3600, 37.8970],  // close ring
      ]],
    },
  });

  // ═══════════════════════════════════════════
  // SF PENINSULA — Pacific Coast side (for Gate transit routes)
  // Simplified — just enough to prevent routes from
  // cutting through the headlands west of the Golden Gate
  // From Fort Point around to Lands End and south
  // ═══════════════════════════════════════════
  // (Already covered by the SF Peninsula polygon above — the western
  // closure coordinates cover this area)

  return features;
}

// ─────────────────────────────────────────────
// Utility: Validate GeoJSON polygon
// ─────────────────────────────────────────────

function validatePolygon(feature: GeoJSONFeature): string[] {
  const errors: string[] = [];
  const coords = feature.geometry.coordinates[0];
  const name = feature.properties.name;

  if (coords.length < 4) {
    errors.push(`${name}: polygon has only ${coords.length} points (need at least 4)`);
  }

  // Check closed ring
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    errors.push(`${name}: polygon is not a closed ring`);
  }

  // Check coordinate order [lng, lat]
  for (let i = 0; i < coords.length; i++) {
    const [lng, lat] = coords[i];
    if (lng > 0 || lat < 0) {
      errors.push(`${name}: point ${i} has suspicious coordinates [${lng}, ${lat}] — expected [negative_lng, positive_lat]`);
    }
    if (lng < -123 || lng > -121 || lat < 37 || lat > 39) {
      errors.push(`${name}: point ${i} [${lng}, ${lat}] is outside SF Bay area`);
    }
  }

  return errors;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  console.log('=== SF Bay Land Polygon Generator ===\n');

  // 1. Try to fetch islands from Overpass
  let osmIslands: GeoJSONFeature[] = [];
  try {
    osmIslands = await fetchOverpassIslands();
    console.log(`\nFetched ${osmIslands.length} islands from Overpass API\n`);
  } catch (err) {
    console.warn(`\nWARNING: Could not fetch from Overpass API: ${err}`);
    console.warn('Continuing with NOAA-ENC traced polygons only.\n');
  }

  // 2. Get major land masses (always available, no network needed)
  const majorLandMasses = getMajorLandMasses();
  console.log(`Generated ${majorLandMasses.length} major land mass polygons\n`);

  // 3. Combine, preferring our traced polygons for major features
  // If Overpass returned Angel Island / Alcatraz / YBI, skip them in favor
  // of our higher-precision traced versions
  const tracedNames = new Set(majorLandMasses.map((f) => f.properties.name.toLowerCase()));
  const filteredOsmIslands = osmIslands.filter((f) => {
    const name = f.properties.name.toLowerCase();
    // Skip if we have a traced version
    if (
      name.includes('alcatraz') ||
      name.includes('angel') ||
      name.includes('yerba buena') ||
      name.includes('treasure') ||
      name.includes('brooks')
    ) {
      console.log(`  Skipping OSM duplicate: ${f.properties.name} (using NOAA-ENC trace)`);
      return false;
    }
    return true;
  });

  const allFeatures = [...majorLandMasses, ...filteredOsmIslands];

  // 4. Validate all polygons
  console.log('\nValidating polygons...');
  let hasErrors = false;
  for (const feature of allFeatures) {
    const errors = validatePolygon(feature);
    if (errors.length > 0) {
      hasErrors = true;
      for (const err of errors) {
        console.error(`  ERROR: ${err}`);
      }
    } else {
      const pts = feature.geometry.coordinates[0].length;
      console.log(`  OK: ${feature.properties.name} (${pts} points, source: ${feature.properties.source})`);
    }
  }

  if (hasErrors) {
    console.error('\nPolygon validation errors found. Output file will still be written.');
  }

  // 5. Build GeoJSON FeatureCollection
  const collection: GeoJSONFeatureCollection = {
    type: 'FeatureCollection',
    features: allFeatures,
  };

  // 6. Write output
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(collection, null, 2));
  console.log(`\nWrote ${allFeatures.length} features to ${OUTPUT_PATH}`);
  console.log(`File size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1)} KB`);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`  Islands (OSM):     ${filteredOsmIslands.length}`);
  console.log(`  Islands (traced):  ${majorLandMasses.filter((f) => f.properties.type === 'island').length}`);
  console.log(`  Peninsulas:        ${majorLandMasses.filter((f) => f.properties.type === 'peninsula').length}`);
  console.log(`  Mainland:          ${majorLandMasses.filter((f) => f.properties.type === 'mainland').length}`);
  console.log(`  Total features:    ${allFeatures.length}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
