#!/usr/bin/env npx tsx
/**
 * Check verified route waypoints against a hand-traced SF Bay water boundary.
 *
 * Uses a simplified polygon of the SF Bay water area. Any waypoint OUTSIDE
 * this polygon is on land and must be fixed.
 *
 * Run: npx tsx scripts/check-waypoints.ts
 */

import { booleanPointInPolygon, point, polygon } from '@turf/turf';
import { verifiedRoutes } from '../data/cities/sf-bay/verified-routes';

// Simplified SF Bay water polygon — traces the approximate shoreline.
// Coordinates are [lng, lat]. This covers the main navigable bay from
// the Golden Gate south to Redwood City and north to San Pablo Bay.
// Not pixel-perfect, but catches any waypoint clearly on land.
const SF_BAY_WATER = polygon([[
  // Golden Gate entrance (west)
  [-122.4850, 37.8300],
  // Marin side going east
  [-122.4800, 37.8500],
  [-122.4700, 37.8700],
  [-122.4500, 37.8850],
  // Angel Island / Raccoon Strait
  [-122.4300, 37.8700],
  [-122.4100, 37.8850],
  // North Bay / Richmond
  [-122.3900, 37.9100],
  [-122.3600, 37.9200],
  [-122.3300, 37.9200],
  // San Pablo Bay
  [-122.3000, 37.9300],
  [-122.2700, 37.9600],
  [-122.2500, 37.9900],
  [-122.2500, 38.0200],
  [-122.2700, 38.0500],
  [-122.2500, 38.0800],
  [-122.2400, 38.1100],
  // Carquinez / Benicia
  [-122.2000, 38.0700],
  [-122.1500, 38.0500],
  // Back south — East Bay shoreline
  [-122.2500, 38.0000],
  [-122.2700, 37.9500],
  [-122.3000, 37.9100],
  [-122.3100, 37.8800],
  [-122.3200, 37.8600],
  // Berkeley / Emeryville
  [-122.3000, 37.8500],
  [-122.2900, 37.8300],
  // Oakland
  [-122.2700, 37.8100],
  [-122.2600, 37.7900],
  // Alameda
  [-122.2500, 37.7700],
  [-122.2700, 37.7500],
  // South Bay — east shore
  [-122.2500, 37.7200],
  [-122.2300, 37.6800],
  [-122.2100, 37.6300],
  [-122.1900, 37.5800],
  [-122.1800, 37.5300],
  [-122.1900, 37.5000],
  // Redwood City area
  [-122.2100, 37.4900],
  [-122.2300, 37.5000],
  // South Bay — west shore going north
  [-122.2600, 37.5300],
  [-122.2900, 37.5600],
  [-122.3200, 37.5800],
  [-122.3400, 37.6000],
  [-122.3500, 37.6200],
  [-122.3600, 37.6500],
  // Oyster Point / SFO area
  [-122.3700, 37.6700],
  [-122.3800, 37.6900],
  // Hunters Point / India Basin — CRITICAL: this is where routes cross land
  [-122.3700, 37.7100],
  [-122.3600, 37.7300],
  [-122.3550, 37.7500],
  [-122.3550, 37.7700],
  // SF waterfront (Embarcadero)
  [-122.3650, 37.7800],
  [-122.3800, 37.7900],
  [-122.3900, 37.7950],
  // Pier 39 / Fisherman's Wharf
  [-122.4100, 37.8100],
  // Crissy Field / Presidio waterfront
  [-122.4300, 37.8050],
  [-122.4500, 37.8100],
  // Golden Gate — back to start
  [-122.4700, 37.8200],
  [-122.4850, 37.8300],
]]);

// Also define small island polygons that are LAND inside the bay
const ALCATRAZ = polygon([[
  [-122.4250, 37.8280],
  [-122.4220, 37.8260],
  [-122.4180, 37.8260],
  [-122.4180, 37.8280],
  [-122.4220, 37.8300],
  [-122.4250, 37.8280],
]]);

const ANGEL_ISLAND = polygon([[
  [-122.4380, 37.8580],
  [-122.4250, 37.8680],
  [-122.4150, 37.8680],
  [-122.4100, 37.8620],
  [-122.4200, 37.8550],
  [-122.4300, 37.8530],
  [-122.4380, 37.8580],
]]);

const YERBA_BUENA = polygon([[
  [-122.3750, 37.8100],
  [-122.3680, 37.8100],
  [-122.3650, 37.8150],
  [-122.3650, 37.8230],
  [-122.3700, 37.8260],
  [-122.3750, 37.8230],
  [-122.3770, 37.8150],
  [-122.3750, 37.8100],
]]);

console.log('=== Waypoint Validation Report ===\n');

let totalWaypoints = 0;
let landWaypoints = 0;
let islandWaypoints = 0;

for (const route of verifiedRoutes) {
  const issues: string[] = [];

  for (let i = 0; i < route.waypoints.length; i++) {
    const [lng, lat] = route.waypoints[i];
    const pt = point([lng, lat]);
    totalWaypoints++;

    // Check if point is in the bay water polygon
    const inWater = booleanPointInPolygon(pt, SF_BAY_WATER);

    // Check if point is on a known island
    const onAlcatraz = booleanPointInPolygon(pt, ALCATRAZ);
    const onAngel = booleanPointInPolygon(pt, ANGEL_ISLAND);
    const onYBI = booleanPointInPolygon(pt, YERBA_BUENA);
    const onIsland = onAlcatraz || onAngel || onYBI;

    if (!inWater) {
      landWaypoints++;
      issues.push(`  WP ${i + 1}: [${lng}, ${lat}] — OUTSIDE BAY WATER POLYGON (on land or outside coverage)`);
    } else if (onIsland) {
      islandWaypoints++;
      const islandName = onAlcatraz ? 'Alcatraz' : onAngel ? 'Angel Island' : 'Yerba Buena Island';
      issues.push(`  WP ${i + 1}: [${lng}, ${lat}] — ON ISLAND (${islandName})`);
    }
  }

  if (issues.length > 0) {
    console.log(`FAIL: ${route.name} (${route.id})`);
    issues.forEach(i => console.log(i));
    console.log();
  } else {
    console.log(`PASS: ${route.name}`);
  }
}

// Also check for segments that cross land by checking midpoints
console.log('\n=== Segment Midpoint Check ===\n');

let segmentIssues = 0;
for (const route of verifiedRoutes) {
  for (let i = 0; i < route.waypoints.length - 1; i++) {
    const [lng1, lat1] = route.waypoints[i];
    const [lng2, lat2] = route.waypoints[i + 1];

    // Check 3 intermediate points along each segment
    for (const frac of [0.25, 0.5, 0.75]) {
      const midLng = lng1 + (lng2 - lng1) * frac;
      const midLat = lat1 + (lat2 - lat1) * frac;
      const midPt = point([midLng, midLat]);

      const inWater = booleanPointInPolygon(midPt, SF_BAY_WATER);
      if (!inWater) {
        console.log(`SEGMENT FAIL: ${route.name} — segment ${i + 1}→${i + 2}, ${Math.round(frac * 100)}% point [${midLng.toFixed(4)}, ${midLat.toFixed(4)}] is outside water`);
        segmentIssues++;
      }
    }
  }
}

console.log(`\n=== Summary ===`);
console.log(`Total waypoints: ${totalWaypoints}`);
console.log(`On land: ${landWaypoints}`);
console.log(`On islands: ${islandWaypoints}`);
console.log(`Segment midpoints on land: ${segmentIssues}`);
console.log(`Status: ${landWaypoints + segmentIssues === 0 ? 'ALL CLEAR' : 'FIXES NEEDED'}`);

process.exit(landWaypoints + segmentIssues > 0 ? 1 : 0);
