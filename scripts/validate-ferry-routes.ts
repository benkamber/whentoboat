#!/usr/bin/env npx tsx
/**
 * Validate ferry route + shipping lane waypoints against OSM coastline data.
 *
 * Reuses the same land-polygon check as validate-waypoints.ts. Run in
 * report mode to see issues, or with --fix to auto-nudge land-crossing
 * waypoints to the nearest water cell.
 *
 * Usage:
 *   npx tsx scripts/validate-ferry-routes.ts
 *   npx tsx scripts/validate-ferry-routes.ts --fix
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  booleanPointInPolygon,
  point,
} from '@turf/turf';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { ferryRoutes, shippingLanes } from '../data/geo/sf-bay-ferry-routes';

const COASTLINE_PATH = path.join(__dirname, '..', 'data', 'geo', 'sf-bay-coastline.json');
const FERRY_FILE = path.join(__dirname, '..', 'data', 'geo', 'sf-bay-ferry-routes.ts');

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
    if (booleanPointInPolygon(pt, poly)) return true;
  }
  return false;
}

/**
 * Walk away from land in compass directions until we hit water.
 * Up to ~1.5 km at 100 m steps.
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

  for (let step = 1; step <= 15; step++) {
    const delta = step * 0.001;
    for (const [dx, dy] of directions) {
      const testLng = lng + dx * delta;
      const testLat = lat + dy * delta;
      if (!isOnLand(testLng, testLat, landPolygons)) {
        return [Math.round(testLng * 10000) / 10000, Math.round(testLat * 10000) / 10000];
      }
    }
  }
  return null;
}

interface Checkable {
  kind: 'ferry' | 'shipping';
  id: string;
  name: string;
  coordinates: [number, number][];
}

function main() {
  console.log('Loading coastline data...');
  const landPolygons = loadCoastline();
  console.log(`Loaded ${landPolygons.length} land polygons\n`);

  const checks: Checkable[] = [
    ...ferryRoutes.map(r => ({
      kind: 'ferry' as const,
      id: r.name,
      name: r.name,
      coordinates: r.coordinates,
    })),
    ...shippingLanes.map(l => ({
      kind: 'shipping' as const,
      id: l.id,
      name: l.name,
      coordinates: l.coordinates,
    })),
  ];

  console.log('=== Ferry + Shipping Waypoint Validation ===\n');

  let totalWaypoints = 0;
  let landWaypoints = 0;
  let segmentIssues = 0;
  let fixedCount = 0;
  const issuesByRoute: Record<string, string[]> = {};
  const fixMap: Map<string, [number, number][]> = new Map();

  for (const c of checks) {
    const issues: string[] = [];
    const fixedCoords = c.coordinates.map(wp => [...wp] as [number, number]);

    // 1. Check each waypoint
    for (let i = 0; i < c.coordinates.length; i++) {
      const [lng, lat] = c.coordinates[i];
      totalWaypoints++;

      if (isOnLand(lng, lat, landPolygons)) {
        landWaypoints++;
        const fix = doFix ? findNearestWater(lng, lat, landPolygons) : null;
        if (fix) {
          fixedCoords[i] = fix;
          fixedCount++;
          issues.push(`  WP ${i + 1}: [${lng}, ${lat}] ON LAND -> fixed to [${fix[0]}, ${fix[1]}]`);
        } else {
          issues.push(`  WP ${i + 1}: [${lng}, ${lat}] ON LAND${doFix ? ' (no water within 1.5km)' : ''}`);
        }
      }
    }

    // 2. Check segment interior points
    const wps = doFix ? fixedCoords : c.coordinates;
    for (let i = 0; i < wps.length - 1; i++) {
      const [lng1, lat1] = wps[i];
      const [lng2, lat2] = wps[i + 1];
      for (const frac of [0.2, 0.4, 0.5, 0.6, 0.8]) {
        const midLng = lng1 + (lng2 - lng1) * frac;
        const midLat = lat1 + (lat2 - lat1) * frac;
        if (isOnLand(midLng, midLat, landPolygons)) {
          segmentIssues++;
          issues.push(`  Segment ${i + 1}->${i + 2} (${Math.round(frac * 100)}%): [${midLng.toFixed(4)}, ${midLat.toFixed(4)}] ON LAND`);
        }
      }
    }

    if (issues.length > 0) {
      console.log(`FAIL [${c.kind}] ${c.name}`);
      issues.forEach(i => console.log(i));
      console.log();
      issuesByRoute[c.id] = issues;
    } else {
      console.log(`PASS [${c.kind}] ${c.name}`);
    }

    if (doFix) {
      fixMap.set(c.id, fixedCoords);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total waypoints: ${totalWaypoints}`);
  console.log(`On land: ${landWaypoints}`);
  console.log(`Segment midpoints on land: ${segmentIssues}`);
  if (doFix) console.log(`Auto-fixed waypoints: ${fixedCount}`);
  console.log(`Status: ${landWaypoints + segmentIssues === 0 ? 'ALL CLEAR' : 'FIXES NEEDED'}`);

  // Write auto-fixed WPT entries if any waypoint was moved.
  if (doFix && fixedCount > 0) {
    // The ferry file stores coordinates in a const WPT table rather than
    // inline — rewriting specific inline tuples is error-prone. Report
    // what needs updating and let the developer merge it by hand.
    console.log(`\nAuto-fix targets (copy into WPT table):`);
    for (const [id, coords] of fixMap) {
      const orig = checks.find(c => c.id === id)!.coordinates;
      for (let i = 0; i < coords.length; i++) {
        if (orig[i][0] !== coords[i][0] || orig[i][1] !== coords[i][1]) {
          console.log(`  ${id} WP${i + 1}: [${orig[i]}] -> [${coords[i]}]`);
        }
      }
    }
  }

  process.exit(landWaypoints + segmentIssues === 0 ? 0 : 1);
}

main();
