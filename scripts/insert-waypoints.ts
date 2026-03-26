#!/usr/bin/env npx tsx
/**
 * Automatically inserts intermediate waypoints into routes that have
 * segment crossings with land polygons.
 *
 * For each failing segment (two consecutive waypoints where the line
 * between them clips a land polygon), this script:
 * 1. Finds a safe water point that routes around the land polygon
 * 2. Inserts it between the two waypoints in the route array
 * 3. Re-validates the fixed route
 *
 * Run: npx tsx scripts/insert-waypoints.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  lineString,
  polygon as turfPolygon,
  point as turfPoint,
  booleanIntersects,
  booleanPointInPolygon,
  lineSegment,
  midpoint,
  destination as turfDestination,
  bearing,
  distance,
} from '@turf/turf';
import type { Feature, Polygon } from 'geojson';

import { waterRoutes } from '../data/cities/sf-bay/water-routes';

const LAND_FILE = path.resolve(__dirname, '../data/geo/sf-bay-land.json');
const BUFFER_METERS = -30;

// Load land polygons
function loadLand(): { name: string; poly: Feature<Polygon> }[] {
  const raw = JSON.parse(fs.readFileSync(LAND_FILE, 'utf-8'));
  const features: { name: string; poly: Feature<Polygon> }[] = [];

  for (const f of raw.features) {
    if (f.geometry?.type !== 'Polygon') continue;
    const coords = f.geometry.coordinates[0];
    if (!coords || coords.length < 4) continue;

    try {
      const { buffer } = require('@turf/turf');
      const poly = turfPolygon([coords]);
      const buffered = buffer(poly, BUFFER_METERS, { units: 'meters' });
      if (buffered && buffered.geometry?.type === 'Polygon') {
        features.push({ name: f.properties?.name || 'unknown', poly: buffered as Feature<Polygon> });
      } else if (buffered && buffered.geometry?.type === 'MultiPolygon') {
        // Take largest polygon from multipolygon
        let largest = buffered.geometry.coordinates[0];
        for (const ring of buffered.geometry.coordinates) {
          if (ring[0].length > largest[0].length) largest = ring;
        }
        features.push({ name: f.properties?.name || 'unknown', poly: turfPolygon(largest) as Feature<Polygon> });
      }
    } catch {
      // Skip invalid polygons
    }
  }
  return features;
}

// Find a safe water point between two waypoints that goes around a land mass
function findSafeDetourPoint(
  from: [number, number],
  to: [number, number],
  land: Feature<Polygon>,
  allLand: { name: string; poly: Feature<Polygon> }[]
): [number, number] | null {
  const fromPt = turfPoint(from);
  const toPt = turfPoint(to);

  // Get the midpoint
  const mid = midpoint(fromPt, toPt);
  const midCoord = mid.geometry.coordinates as [number, number];

  // Calculate bearing from → to
  const routeBearing = bearing(fromPt, toPt);

  // Try perpendicular offsets at increasing distances
  const segDist = distance(fromPt, toPt, { units: 'kilometers' });
  const offsets = [0.15, 0.25, 0.4, 0.6, 0.8, 1.0, 1.5]; // km

  for (const offsetKm of offsets) {
    // Try both sides (perpendicular left and right)
    for (const perpAngle of [routeBearing + 90, routeBearing - 90]) {
      const candidate = turfDestination(mid, offsetKm, perpAngle, { units: 'kilometers' });
      const candidateCoord = candidate.geometry.coordinates as [number, number];

      // Check if this point is in water (not in ANY land polygon)
      let inWater = true;
      for (const l of allLand) {
        if (booleanPointInPolygon(candidate, l.poly)) {
          inWater = false;
          break;
        }
      }

      if (!inWater) continue;

      // Check if the two new segments (from→candidate, candidate→to) are clear
      const seg1 = lineString([from, candidateCoord]);
      const seg2 = lineString([candidateCoord, to]);

      let seg1Clear = true;
      let seg2Clear = true;
      for (const l of allLand) {
        if (booleanIntersects(seg1, l.poly)) seg1Clear = false;
        if (booleanIntersects(seg2, l.poly)) seg2Clear = false;
      }

      if (seg1Clear && seg2Clear) {
        return [
          Math.round(candidateCoord[0] * 10000) / 10000,
          Math.round(candidateCoord[1] * 10000) / 10000,
        ];
      }
    }
  }

  return null; // Could not find safe detour
}

async function main() {
  console.log('=== Insert Waypoints for Land Crossings ===\n');

  const land = loadLand();
  console.log(`Loaded ${land.length} land features\n`);

  let totalFixed = 0;
  let totalFailed = 0;
  const fixes: { routeId: string; segIdx: number; insertPoint: [number, number]; landName: string }[] = [];

  // Find all failing segments
  for (const route of waterRoutes) {
    if (route.vesselType !== 'default') continue;

    const waypoints = route.waypoints;
    if (waypoints.length < 2) continue;

    const routeLine = lineString(waypoints);
    const segments = lineSegment(routeLine);
    const rid = `${route.fromId} -> ${route.toId}`;

    for (let segIdx = 0; segIdx < segments.features.length; segIdx++) {
      // Skip terminal segments (dock tolerance)
      if (segIdx === 0 || segIdx === segments.features.length - 1) continue;

      const seg = segments.features[segIdx];

      for (const l of land) {
        if (booleanIntersects(seg, l.poly)) {
          const coords = seg.geometry.coordinates as [number, number][];
          const from = coords[0];
          const to = coords[1];

          const detour = findSafeDetourPoint(from, to, l.poly, land);
          if (detour) {
            fixes.push({ routeId: rid, segIdx, insertPoint: detour, landName: l.name });
            totalFixed++;
          } else {
            console.log(`  COULD NOT FIX: ${rid} segment ${segIdx} crossing ${l.name}`);
            console.log(`    From: [${from}] To: [${to}]`);
            totalFailed++;
          }
          break; // Only fix once per segment
        }
      }
    }
  }

  console.log(`\nFound ${totalFixed + totalFailed} crossings: ${totalFixed} fixable, ${totalFailed} need manual review\n`);

  if (fixes.length === 0) {
    console.log('No fixes to apply.');
    return;
  }

  // Apply fixes to the water routes file
  // Read the raw file
  const routeFile = path.resolve(__dirname, '../data/cities/sf-bay/water-routes.ts');
  let content = fs.readFileSync(routeFile, 'utf-8');

  // Group fixes by route
  const fixesByRoute = new Map<string, typeof fixes>();
  for (const fix of fixes) {
    const key = fix.routeId;
    if (!fixesByRoute.has(key)) fixesByRoute.set(key, []);
    fixesByRoute.get(key)!.push(fix);
  }

  // For each route, find the waypoints array in the file and insert new points
  for (const [routeId, routeFixes] of fixesByRoute) {
    const [fromId, toId] = routeId.split(' -> ');
    const route = waterRoutes.find(r => r.fromId === fromId && r.toId === toId && r.vesselType === 'default');
    if (!route) continue;

    // Sort fixes by segment index DESCENDING (insert from end to preserve indices)
    routeFixes.sort((a, b) => b.segIdx - a.segIdx);

    // Build the new waypoints array
    const newWaypoints = [...route.waypoints];
    for (const fix of routeFixes) {
      // segIdx corresponds to the segment BETWEEN waypoints[segIdx] and waypoints[segIdx+1]
      // Insert the new point at position segIdx+1
      newWaypoints.splice(fix.segIdx + 1, 0, fix.insertPoint);
      console.log(`  ${routeId}: insert [${fix.insertPoint}] at index ${fix.segIdx + 1} (around ${fix.landName})`);
    }

    // Replace the waypoints array in the file content
    // Find this route's waypoints block by matching fromId/toId
    const fromPattern = `fromId: '${fromId}'`;
    const toPattern = `toId: '${toId}'`;

    // Find the route block
    let searchStart = 0;
    while (true) {
      const fromIdx = content.indexOf(fromPattern, searchStart);
      if (fromIdx === -1) break;

      // Check if toId follows within ~200 chars
      const toIdx = content.indexOf(toPattern, fromIdx);
      if (toIdx === -1 || toIdx - fromIdx > 200) {
        searchStart = fromIdx + 1;
        continue;
      }

      // Also check vesselType is 'default'
      const vesselIdx = content.indexOf("vesselType: 'default'", fromIdx);
      if (vesselIdx === -1 || vesselIdx - fromIdx > 200) {
        searchStart = fromIdx + 1;
        continue;
      }

      // Find the waypoints array
      const wpStart = content.indexOf('waypoints: [', toIdx);
      if (wpStart === -1 || wpStart - toIdx > 200) {
        searchStart = fromIdx + 1;
        continue;
      }

      // Find the matching closing bracket — count brackets
      let depth = 0;
      let wpEnd = -1;
      for (let i = wpStart + 'waypoints: '.length; i < content.length; i++) {
        if (content[i] === '[') depth++;
        if (content[i] === ']') {
          depth--;
          if (depth === 0) {
            wpEnd = i + 1;
            break;
          }
        }
      }

      if (wpEnd === -1) {
        searchStart = fromIdx + 1;
        continue;
      }

      // Build new waypoints string
      const indent = '      ';
      const newWpStr = 'waypoints: [\n' +
        newWaypoints.map(wp => `${indent}  [${wp[0]}, ${wp[1]}],`).join('\n') +
        `\n${indent}]`;

      content = content.substring(0, wpStart) + newWpStr + content.substring(wpEnd);
      break;
    }
  }

  // Write the fixed file
  fs.writeFileSync(routeFile, content);
  console.log(`\nApplied ${totalFixed} fixes to water-routes.ts`);

  // Re-validate
  console.log('\n--- Re-validating ---');
  const { execSync } = require('child_process');
  try {
    const result = execSync('npx tsx scripts/validate-routes.ts 2>&1', { encoding: 'utf-8', timeout: 60000 });
    const crossingsMatch = result.match(/Land crossings:\s+(\d+)/);
    const waypointsMatch = result.match(/waypoint/i);
    console.log(`Land crossings after fix: ${crossingsMatch?.[1] ?? 'unknown'}`);
    if (result.includes('PASS: No interior waypoints')) {
      console.log('Waypoints on land: 0');
    }
  } catch (e: any) {
    console.log('Re-validation output:', e.stdout?.slice(-200));
  }
}

main();
