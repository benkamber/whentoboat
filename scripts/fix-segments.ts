#!/usr/bin/env npx tsx
/**
 * Auto-fix route segments that cross land.
 *
 * For each segment between two waypoints, checks if the straight line
 * crosses land. If it does, inserts intermediate waypoints that route
 * around the coastline by:
 *   1. Finding where the segment enters land
 *   2. Walking along the land polygon boundary (staying in water)
 *   3. Rejoining the original track where it re-enters water
 *
 * Simpler fallback when boundary-walking is too complex:
 *   - Sample the segment at fine intervals
 *   - For each sample point on land, nudge it to the nearest water
 *   - Insert the nudged points as intermediate waypoints
 *
 * Run: npx tsx scripts/fix-segments.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { booleanPointInPolygon, point, distance as turfDistance } from '@turf/turf';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { verifiedRoutes, type VerifiedRoute } from '../data/cities/sf-bay/verified-routes';

const COASTLINE_PATH = path.join(__dirname, '..', 'data', 'geo', 'sf-bay-coastline.json');
const ROUTES_PATH = path.join(__dirname, '..', 'data', 'cities', 'sf-bay', 'verified-routes.ts');

function loadCoastline(): Feature<Polygon | MultiPolygon>[] {
  const data = JSON.parse(fs.readFileSync(COASTLINE_PATH, 'utf-8')) as FeatureCollection;
  return data.features as Feature<Polygon | MultiPolygon>[];
}

function isOnLand(lng: number, lat: number, polys: Feature<Polygon | MultiPolygon>[]): boolean {
  const pt = point([lng, lat]);
  for (const poly of polys) {
    if (booleanPointInPolygon(pt, poly)) return true;
  }
  return false;
}

/**
 * Find nearest water point by searching in 16 directions at increasing distances.
 * Prefers directions that are perpendicular to the segment direction (more likely
 * to find water on the "bay side" rather than further inland).
 */
function nudgeToWater(
  lng: number, lat: number,
  segDirLng: number, segDirLat: number,
  polys: Feature<Polygon | MultiPolygon>[]
): [number, number] | null {
  // 16 compass directions, prioritized by perpendicular to segment
  const perpLng = -segDirLat;
  const perpLat = segDirLng;

  // Try perpendicular directions first (more likely to find water), then others
  const directions: [number, number][] = [
    [perpLng, perpLat],
    [-perpLng, -perpLat],
    [perpLng + segDirLng, perpLat + segDirLat],
    [-perpLng + segDirLng, -perpLat + segDirLat],
    [0, 1], [1, 0], [0, -1], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
    [perpLng * 2, perpLat * 2],
    [-perpLng * 2, -perpLat * 2],
  ];

  // Normalize directions
  const normalized = directions.map(([dx, dy]) => {
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return [dx / len, dy / len] as [number, number];
  });

  for (let step = 1; step <= 20; step++) {
    const delta = step * 0.0005; // ~50m per step
    for (const [dx, dy] of normalized) {
      const testLng = lng + dx * delta;
      const testLat = lat + dy * delta;
      if (!isOnLand(testLng, testLat, polys)) {
        return [Math.round(testLng * 10000) / 10000, Math.round(testLat * 10000) / 10000];
      }
    }
  }
  return null;
}

/**
 * Fix a single segment by inserting intermediate waypoints.
 * Samples the segment at fine intervals and nudges any land points to water.
 */
function fixSegment(
  wp1: [number, number],
  wp2: [number, number],
  polys: Feature<Polygon | MultiPolygon>[]
): [number, number][] {
  const [lng1, lat1] = wp1;
  const [lng2, lat2] = wp2;

  // Segment direction (for perpendicular nudging)
  const segDirLng = lng2 - lng1;
  const segDirLat = lat2 - lat1;
  const segLen = Math.sqrt(segDirLng * segDirLng + segDirLat * segDirLat);
  const normDirLng = segDirLng / (segLen || 1);
  const normDirLat = segDirLat / (segLen || 1);

  // Sample at ~200m intervals (0.002 degrees)
  const numSamples = Math.max(5, Math.ceil(segLen / 0.002));
  const result: [number, number][] = [wp1];

  let lastWasLand = false;

  for (let i = 1; i < numSamples; i++) {
    const frac = i / numSamples;
    const sampleLng = lng1 + segDirLng * frac;
    const sampleLat = lat1 + segDirLat * frac;

    if (isOnLand(sampleLng, sampleLat, polys)) {
      // This sample is on land — nudge it to water
      const fixed = nudgeToWater(sampleLng, sampleLat, normDirLng, normDirLat, polys);
      if (fixed) {
        // Only add if it's meaningfully different from the last added point
        const lastPt = result[result.length - 1];
        const dist = Math.sqrt(
          (fixed[0] - lastPt[0]) ** 2 + (fixed[1] - lastPt[1]) ** 2
        );
        if (dist > 0.0005) { // ~50m minimum spacing
          result.push(fixed);
        }
      }
      lastWasLand = true;
    } else if (lastWasLand) {
      // Just re-entered water — add this point to establish clean re-entry
      const cleanPt: [number, number] = [
        Math.round(sampleLng * 10000) / 10000,
        Math.round(sampleLat * 10000) / 10000
      ];
      const lastPt = result[result.length - 1];
      const dist = Math.sqrt(
        (cleanPt[0] - lastPt[0]) ** 2 + (cleanPt[1] - lastPt[1]) ** 2
      );
      if (dist > 0.0005) {
        result.push(cleanPt);
      }
      lastWasLand = false;
    }
  }

  result.push(wp2);
  return result;
}

function main() {
  console.log('Loading coastline data...');
  const polys = loadCoastline();
  console.log(`Loaded ${polys.length} land polygons\n`);

  const fixedRoutes: Map<string, [number, number][]> = new Map();
  let totalFixed = 0;

  for (const route of verifiedRoutes) {
    let newWaypoints: [number, number][] = [];
    let routeFixed = false;

    for (let i = 0; i < route.waypoints.length - 1; i++) {
      const wp1 = route.waypoints[i] as [number, number];
      const wp2 = route.waypoints[i + 1] as [number, number];

      // Check if this segment crosses land (sample 5 points)
      let crossesLand = false;
      for (const frac of [0.2, 0.4, 0.5, 0.6, 0.8]) {
        const midLng = wp1[0] + (wp2[0] - wp1[0]) * frac;
        const midLat = wp1[1] + (wp2[1] - wp1[1]) * frac;
        if (isOnLand(midLng, midLat, polys)) {
          crossesLand = true;
          break;
        }
      }

      if (crossesLand) {
        // Fix this segment
        const fixed = fixSegment(wp1, wp2, polys);
        // Add all points except the last (it's wp2, which will be added by the next segment)
        for (let j = 0; j < fixed.length - 1; j++) {
          // Deduplicate against what's already in newWaypoints
          if (newWaypoints.length === 0 ||
              newWaypoints[newWaypoints.length - 1][0] !== fixed[j][0] ||
              newWaypoints[newWaypoints.length - 1][1] !== fixed[j][1]) {
            newWaypoints.push(fixed[j]);
          }
        }
        routeFixed = true;
        console.log(`  Fixed segment ${i + 1}→${i + 2} in ${route.name} (added ${fixed.length - 2} intermediate points)`);
      } else {
        // Segment is clean — keep wp1
        if (newWaypoints.length === 0 ||
            newWaypoints[newWaypoints.length - 1][0] !== wp1[0] ||
            newWaypoints[newWaypoints.length - 1][1] !== wp1[1]) {
          newWaypoints.push(wp1);
        }
      }
    }

    // Add the final waypoint
    const lastWp = route.waypoints[route.waypoints.length - 1] as [number, number];
    newWaypoints.push(lastWp);

    if (routeFixed) {
      totalFixed++;
      console.log(`  ${route.name}: ${route.waypoints.length} → ${newWaypoints.length} waypoints\n`);
      fixedRoutes.set(route.id, newWaypoints);
    } else {
      console.log(`  ${route.name}: OK (no segments cross land)`);
    }
  }

  if (totalFixed === 0) {
    console.log('\nAll routes are clean! No fixes needed.');
    process.exit(0);
  }

  // Write fixed routes back to verified-routes.ts
  console.log(`\nWriting ${totalFixed} fixed routes to verified-routes.ts...`);

  let content = fs.readFileSync(ROUTES_PATH, 'utf-8');

  for (const [routeId, waypoints] of fixedRoutes) {
    const route = verifiedRoutes.find(r => r.id === routeId);
    if (!route) continue;

    // Build the old waypoints string pattern
    const oldLines = route.waypoints.map(wp => {
      // Match however the waypoint is formatted in the file
      return `      [${wp[0]}, ${wp[1]}]`;
    }).join(',\n');

    // Build new waypoints string
    const newLines = waypoints.map(wp =>
      `      [${wp[0]}, ${wp[1]}]`
    ).join(',\n');

    if (content.includes(oldLines)) {
      content = content.replace(oldLines, newLines);
    } else {
      console.warn(`  WARNING: Could not find waypoints for ${routeId} in file — manual update needed`);
    }
  }

  fs.writeFileSync(ROUTES_PATH, content);
  console.log('Done. Run validate-waypoints.ts to verify.');
}

main();
