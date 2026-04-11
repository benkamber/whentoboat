#!/usr/bin/env npx tsx
/**
 * Validate all verified route waypoints against OSM coastline data.
 *
 * A waypoint is "on land" if it falls inside any land polygon from
 * sf-bay-coastline.json. A segment "crosses land" if intermediate
 * points along it are on land.
 *
 * Run: npx tsx scripts/validate-waypoints.ts
 * Run with auto-fix: npx tsx scripts/validate-waypoints.ts --fix
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  booleanPointInPolygon,
  point,
  nearestPointOnLine,
  lineString,
  polygon as turfPolygon,
} from '@turf/turf';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { verifiedRoutes } from '../data/cities/sf-bay/verified-routes';

const COASTLINE_PATH = path.join(__dirname, '..', 'data', 'geo', 'sf-bay-coastline.json');

const doFix = process.argv.includes('--fix');

function loadCoastline(): Feature<Polygon | MultiPolygon>[] {
  if (!fs.existsSync(COASTLINE_PATH)) {
    console.error(`Coastline data not found at ${COASTLINE_PATH}`);
    console.error('Run: npx tsx scripts/build-coastline.ts');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(COASTLINE_PATH, 'utf-8')) as FeatureCollection;
  return data.features as Feature<Polygon | MultiPolygon>[];
}

function isOnLand(lng: number, lat: number, landPolygons: Feature<Polygon | MultiPolygon>[]): boolean {
  const pt = point([lng, lat]);
  for (const poly of landPolygons) {
    if (booleanPointInPolygon(pt, poly)) {
      return true;
    }
  }
  return false;
}

/**
 * Find the nearest water point by moving away from land.
 * Strategy: try points in 8 compass directions at increasing distances
 * until we find one that's in water.
 */
function findNearestWater(
  lng: number,
  lat: number,
  landPolygons: Feature<Polygon | MultiPolygon>[],
): [number, number] | null {
  const directions = [
    [0, 1], [1, 1], [1, 0], [1, -1],
    [0, -1], [-1, -1], [-1, 0], [-1, 1],
  ];

  // Try at 0.001° increments (~100m) up to 0.01° (~1km)
  for (let step = 1; step <= 10; step++) {
    const delta = step * 0.001;
    for (const [dx, dy] of directions) {
      const testLng = lng + dx * delta;
      const testLat = lat + dy * delta;
      if (!isOnLand(testLng, testLat, landPolygons)) {
        return [Math.round(testLng * 10000) / 10000, Math.round(testLat * 10000) / 10000];
      }
    }
  }
  return null; // Couldn't find water within 1km
}

function main() {
  console.log('Loading coastline data...');
  const landPolygons = loadCoastline();
  console.log(`Loaded ${landPolygons.length} land polygons\n`);

  console.log('=== Waypoint Validation Report ===\n');

  let totalWaypoints = 0;
  let landWaypoints = 0;
  let segmentIssues = 0;
  let fixedCount = 0;
  const routeFixes: Map<string, [number, number][]> = new Map();

  for (const route of verifiedRoutes.filter(r => r.validated)) {
    const issues: string[] = [];
    const fixedWaypoints = [...route.waypoints.map(wp => [...wp] as [number, number])];

    // Check each waypoint
    for (let i = 0; i < route.waypoints.length; i++) {
      const [lng, lat] = route.waypoints[i];
      totalWaypoints++;

      if (isOnLand(lng, lat, landPolygons)) {
        landWaypoints++;
        const fix = doFix ? findNearestWater(lng, lat, landPolygons) : null;
        if (fix) {
          fixedWaypoints[i] = fix;
          fixedCount++;
          issues.push(`  WP ${i + 1}: [${lng}, ${lat}] ON LAND → fixed to [${fix[0]}, ${fix[1]}]`);
        } else {
          issues.push(`  WP ${i + 1}: [${lng}, ${lat}] ON LAND${doFix ? ' (no water found within 1km!)' : ''}`);
        }
      }
    }

    // Check segment midpoints (using fixed waypoints if auto-fix is on)
    const wps = doFix ? fixedWaypoints : route.waypoints;
    for (let i = 0; i < wps.length - 1; i++) {
      const [lng1, lat1] = wps[i];
      const [lng2, lat2] = wps[i + 1];

      for (const frac of [0.25, 0.5, 0.75]) {
        const midLng = lng1 + (lng2 - lng1) * frac;
        const midLat = lat1 + (lat2 - lat1) * frac;

        if (isOnLand(midLng, midLat, landPolygons)) {
          segmentIssues++;
          issues.push(`  Segment ${i + 1}→${i + 2} (${Math.round(frac * 100)}%): [${midLng.toFixed(4)}, ${midLat.toFixed(4)}] ON LAND`);
        }
      }
    }

    if (issues.length > 0) {
      console.log(`FAIL: ${route.name} (${route.id})`);
      issues.forEach(i => console.log(i));
      console.log();
    } else {
      console.log(`PASS: ${route.name}`);
    }

    if (doFix) {
      routeFixes.set(route.id, fixedWaypoints);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total waypoints: ${totalWaypoints}`);
  console.log(`On land: ${landWaypoints}`);
  console.log(`Segment midpoints on land: ${segmentIssues}`);
  if (doFix) {
    console.log(`Auto-fixed waypoints: ${fixedCount}`);
  }
  console.log(`Status: ${landWaypoints + segmentIssues === 0 ? 'ALL CLEAR' : 'FIXES NEEDED'}`);

  // Write fixed routes if auto-fix enabled
  if (doFix && fixedCount > 0) {
    const routesPath = path.join(__dirname, '..', 'data', 'cities', 'sf-bay', 'verified-routes.ts');
    let content = fs.readFileSync(routesPath, 'utf-8');

    for (const [routeId, waypoints] of routeFixes) {
      const route = verifiedRoutes.find(r => r.id === routeId);
      if (!route) continue;

      // Build old and new waypoint strings
      const oldWps = route.waypoints
        .map(wp => `      [${wp[0]}, ${wp[1]}]`)
        .join(',\n');
      const newWps = waypoints
        .map(wp => `      [${wp[0]}, ${wp[1]}]`)
        .join(',\n');

      if (oldWps !== newWps) {
        content = content.replace(oldWps, newWps);
      }
    }

    fs.writeFileSync(routesPath, content);
    console.log(`\nWrote fixed waypoints to verified-routes.ts`);
  }

  process.exit(landWaypoints + segmentIssues === 0 ? 0 : 1);
}

main();
