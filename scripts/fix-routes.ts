#!/usr/bin/env npx tsx
// ============================================
// Auto-Fix Water Routes
//
// Attempts to automatically fix routes that cross land
// by rerouting around obstacles using turf.shortestPath.
//
// Run:  npx tsx scripts/fix-routes.ts
// ============================================

import * as fs from 'fs';
import * as path from 'path';
import {
  lineString,
  polygon as turfPolygon,
  point as turfPoint,
  featureCollection,
  booleanIntersects,
  booleanPointInPolygon,
  lineSegment,
  buffer,
  shortestPath,
  distance as turfDistance,
  length as turfLength,
} from '@turf/turf';
import type { Feature, Polygon, FeatureCollection, Point } from 'geojson';

import { waterRoutes, type WaterRoute } from '../data/cities/sf-bay/water-routes';

// ─── Constants ───

const LAND_FILE = path.resolve(__dirname, '../data/geo/sf-bay-land.json');
const OUTPUT_FILE = path.resolve(__dirname, '../data/cities/sf-bay/water-routes-fixed.ts');
const BUFFER_METERS = -50;
const DETOUR_RATIO_THRESHOLD = 2.0; // flag if detour > 2x original segment
const PATHFINDING_RESOLUTION = 500; // grid resolution for A* pathfinding (meters)

// ─── Types ───

interface LandFeature {
  name: string;
  polygon: Feature<Polygon>;
  buffered: Feature<Polygon>;
}

interface SegmentFailure {
  routeIndex: number;
  routeId: string;
  segmentIndex: number;
  landMassName: string;
  startCoord: [number, number];
  endCoord: [number, number];
}

interface FixResult {
  routeIndex: number;
  routeId: string;
  originalWaypoints: [number, number][];
  fixedWaypoints: [number, number][];
  segmentsFixed: number;
  needsHumanReview: boolean;
  reviewReasons: string[];
}

// ─── Load land polygons ───

function loadLandPolygons(): LandFeature[] {
  if (!fs.existsSync(LAND_FILE)) {
    console.error(`ERROR: Land polygon file not found: ${LAND_FILE}`);
    console.error('Run "npx tsx scripts/fetch-land-polygons.ts" first.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(LAND_FILE, 'utf-8'));
  const features: LandFeature[] = [];

  for (const feature of raw.features) {
    const poly = turfPolygon(feature.geometry.coordinates);
    let buffered: Feature<Polygon>;
    try {
      const b = buffer(poly, BUFFER_METERS, { units: 'meters' });
      if (b && b.geometry && b.geometry.type === 'Polygon') {
        buffered = b as Feature<Polygon>;
      } else if (b && b.geometry && b.geometry.type === 'MultiPolygon') {
        const mp = b.geometry as any;
        let largest = mp.coordinates[0];
        for (const ring of mp.coordinates) {
          if (ring[0].length > largest[0].length) largest = ring;
        }
        buffered = turfPolygon(largest);
      } else {
        continue;
      }
    } catch {
      buffered = poly;
    }

    features.push({
      name: feature.properties.name,
      polygon: poly,
      buffered,
    });
  }

  return features;
}

// ─── Find failures ───

function findFailures(landFeatures: LandFeature[]): SegmentFailure[] {
  const failures: SegmentFailure[] = [];

  for (let ri = 0; ri < waterRoutes.length; ri++) {
    const route = waterRoutes[ri];
    const rid = `${route.fromId} -> ${route.toId}`;
    const waypoints = route.waypoints;
    if (waypoints.length < 2) continue;

    const routeLine = lineString(waypoints);
    const segments = lineSegment(routeLine);

    for (let si = 0; si < segments.features.length; si++) {
      const seg = segments.features[si];
      for (const land of landFeatures) {
        if (booleanIntersects(seg, land.buffered)) {
          const coords = seg.geometry.coordinates;
          failures.push({
            routeIndex: ri,
            routeId: rid,
            segmentIndex: si,
            landMassName: land.name,
            startCoord: coords[0] as [number, number],
            endCoord: coords[1] as [number, number],
          });
        }
      }
    }
  }

  return failures;
}

// ─── Build obstacle collection for shortestPath ───

function buildObstacles(landFeatures: LandFeature[]): FeatureCollection<Polygon> {
  // Use the buffered (shrunk) polygons as obstacles
  return featureCollection(
    landFeatures.map((f) => f.buffered),
  ) as FeatureCollection<Polygon>;
}

// ─── Fix a single route ───

function fixRoute(
  route: WaterRoute,
  routeIndex: number,
  failures: SegmentFailure[],
  obstacles: FeatureCollection<Polygon>,
): FixResult {
  const rid = `${route.fromId} -> ${route.toId}`;
  const originalWaypoints = [...route.waypoints] as [number, number][];
  const reviewReasons: string[] = [];
  let segmentsFixed = 0;
  let needsHumanReview = false;

  // Group failures by segment index (descending so we can splice safely)
  const segmentFailures = new Map<number, SegmentFailure[]>();
  for (const f of failures) {
    if (!segmentFailures.has(f.segmentIndex)) {
      segmentFailures.set(f.segmentIndex, []);
    }
    segmentFailures.get(f.segmentIndex)!.push(f);
  }

  // Process segments in reverse order to maintain indices
  const sortedSegments = [...segmentFailures.keys()].sort((a, b) => b - a);
  let fixedWaypoints = [...originalWaypoints];

  for (const segIdx of sortedSegments) {
    const segFailures = segmentFailures.get(segIdx)!;
    const startCoord = segFailures[0].startCoord;
    const endCoord = segFailures[0].endCoord;
    const landNames = segFailures.map((f) => f.landMassName).join(', ');

    console.log(`    Segment ${segIdx}: [${startCoord[0].toFixed(4)}, ${startCoord[1].toFixed(4)}] -> [${endCoord[0].toFixed(4)}, ${endCoord[1].toFixed(4)}] crosses "${landNames}"`);

    // Calculate original segment distance
    const originalDist = turfDistance(turfPoint(startCoord), turfPoint(endCoord), {
      units: 'kilometers',
    });

    // Try to find a path around the obstacle
    try {
      const start = turfPoint(startCoord);
      const end = turfPoint(endCoord);

      const detour = shortestPath(start, end, {
        obstacles,
        resolution: PATHFINDING_RESOLUTION,
      });

      if (detour && detour.geometry && detour.geometry.coordinates.length > 0) {
        const detourCoords = detour.geometry.coordinates as [number, number][];
        const detourDist = turfLength(detour, { units: 'kilometers' });

        // Check detour ratio
        const ratio = originalDist > 0 ? detourDist / originalDist : 1;

        if (ratio > DETOUR_RATIO_THRESHOLD) {
          needsHumanReview = true;
          reviewReasons.push(
            `Segment ${segIdx} detour is ${ratio.toFixed(1)}x original distance (${originalDist.toFixed(2)}km -> ${detourDist.toFixed(2)}km)`,
          );
          console.log(`      WARNING: Detour is ${ratio.toFixed(1)}x original — flagged for human review`);
        }

        // Splice the detour into the waypoints
        // Remove the segment endpoints (they're duplicated in the detour)
        // and replace with the detour path
        const detourMiddle = detourCoords.slice(1, -1); // skip first/last (== start/end)

        if (detourMiddle.length > 0) {
          // Insert detour points between segIdx and segIdx+1
          fixedWaypoints.splice(segIdx + 1, 0, ...detourMiddle);
          segmentsFixed++;
          console.log(`      Fixed: inserted ${detourMiddle.length} detour waypoints`);
        } else {
          console.log(`      Detour has no intermediate points — segment may be borderline`);
        }
      } else {
        needsHumanReview = true;
        reviewReasons.push(`Segment ${segIdx}: shortestPath returned no result`);
        console.log(`      FAILED: Could not find alternative path`);
      }
    } catch (err) {
      needsHumanReview = true;
      reviewReasons.push(`Segment ${segIdx}: pathfinding error — ${err}`);
      console.log(`      ERROR: Pathfinding failed: ${err}`);
    }
  }

  return {
    routeIndex,
    routeId: rid,
    originalWaypoints,
    fixedWaypoints,
    segmentsFixed,
    needsHumanReview,
    reviewReasons,
  };
}

// ─── Re-validate a fixed route ───

function revalidateRoute(
  waypoints: [number, number][],
  landFeatures: LandFeature[],
): { crossings: number; pointsOnLand: number } {
  if (waypoints.length < 2) return { crossings: 0, pointsOnLand: 0 };

  const routeLine = lineString(waypoints);
  const segments = lineSegment(routeLine);
  let crossings = 0;
  let pointsOnLand = 0;

  for (const seg of segments.features) {
    for (const land of landFeatures) {
      if (booleanIntersects(seg, land.buffered)) {
        crossings++;
      }
    }
  }

  // Check interior waypoints
  for (let i = 1; i < waypoints.length - 1; i++) {
    const pt = turfPoint(waypoints[i]);
    for (const land of landFeatures) {
      if (booleanPointInPolygon(pt, land.buffered)) {
        pointsOnLand++;
      }
    }
  }

  return { crossings, pointsOnLand };
}

// ─── Generate output ───

function generateOutput(fixResults: FixResult[]): string {
  const lines: string[] = [
    '// ============================================',
    '// FIXED Water Routes (auto-generated)',
    '// Generated by: npx tsx scripts/fix-routes.ts',
    `// Generated at: ${new Date().toISOString()}`,
    '//',
    '// This file contains waypoint patches for routes',
    '// that crossed land in the original water-routes.ts.',
    '// Apply these patches to fix navigational integrity.',
    '// ============================================',
    '',
    'export interface RoutePatch {',
    '  fromId: string;',
    '  toId: string;',
    '  originalWaypointCount: number;',
    '  fixedWaypoints: [number, number][];',
    '  needsHumanReview: boolean;',
    '  reviewReasons: string[];',
    '}',
    '',
    'export const routePatches: RoutePatch[] = [',
  ];

  for (const fix of fixResults) {
    if (fix.segmentsFixed === 0 && !fix.needsHumanReview) continue;

    const [fromId, toId] = fix.routeId.split(' -> ');
    lines.push('  {');
    lines.push(`    fromId: '${fromId.trim()}',`);
    lines.push(`    toId: '${toId.trim()}',`);
    lines.push(`    originalWaypointCount: ${fix.originalWaypoints.length},`);
    lines.push('    fixedWaypoints: [');
    for (const wp of fix.fixedWaypoints) {
      lines.push(`      [${wp[0]}, ${wp[1]}],`);
    }
    lines.push('    ],');
    lines.push(`    needsHumanReview: ${fix.needsHumanReview},`);
    lines.push(`    reviewReasons: [${fix.reviewReasons.map((r) => `'${r.replace(/'/g, "\\'")}'`).join(', ')}],`);
    lines.push('  },');
  }

  lines.push('];');
  return lines.join('\n');
}

// ─── Main ───

async function main() {
  console.log('=== Auto-Fix Water Routes ===\n');

  // 1. Load land polygons
  console.log('Loading land polygons...');
  const landFeatures = loadLandPolygons();
  console.log(`  Loaded ${landFeatures.length} land features\n`);

  // 2. Find failures
  console.log('Finding route failures...');
  const failures = findFailures(landFeatures);
  console.log(`  Found ${failures.length} segment-land intersections\n`);

  if (failures.length === 0) {
    console.log('All routes pass validation. No fixes needed.');
    process.exit(0);
  }

  // Group by route
  const failuresByRoute = new Map<number, SegmentFailure[]>();
  for (const f of failures) {
    if (!failuresByRoute.has(f.routeIndex)) {
      failuresByRoute.set(f.routeIndex, []);
    }
    failuresByRoute.get(f.routeIndex)!.push(f);
  }

  console.log(`  ${failuresByRoute.size} route(s) need fixing:\n`);

  // 3. Build obstacles
  const obstacles = buildObstacles(landFeatures);

  // 4. Fix each route
  const fixResults: FixResult[] = [];
  let fixedCount = 0;
  let reviewCount = 0;

  for (const [routeIdx, routeFailures] of failuresByRoute) {
    const route = waterRoutes[routeIdx];
    const rid = `${route.fromId} -> ${route.toId}`;
    console.log(`  Fixing: ${rid} (${routeFailures.length} failing segments)`);

    const result = fixRoute(route, routeIdx, routeFailures, obstacles);
    fixResults.push(result);

    // Re-validate
    const recheck = revalidateRoute(result.fixedWaypoints, landFeatures);
    if (recheck.crossings > 0 || recheck.pointsOnLand > 0) {
      result.needsHumanReview = true;
      result.reviewReasons.push(
        `Re-validation: still ${recheck.crossings} crossings and ${recheck.pointsOnLand} points on land`,
      );
      console.log(
        `      RE-CHECK: Still has ${recheck.crossings} crossings, ${recheck.pointsOnLand} points on land — needs human review`,
      );
    } else if (result.segmentsFixed > 0) {
      console.log(`      RE-CHECK: Fixed route passes validation`);
    }

    if (result.segmentsFixed > 0) fixedCount++;
    if (result.needsHumanReview) reviewCount++;
    console.log();
  }

  // 5. Write output
  const output = generateOutput(fixResults);
  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`Wrote patch file: ${OUTPUT_FILE}\n`);

  // 6. Summary
  console.log('═══ SUMMARY ═══');
  console.log(`  Total routes:         ${waterRoutes.length}`);
  console.log(`  Routes with issues:   ${failuresByRoute.size}`);
  console.log(`  Routes auto-fixed:    ${fixedCount}`);
  console.log(`  Need human review:    ${reviewCount}`);
  console.log();

  if (reviewCount > 0) {
    console.log('Routes needing human review:');
    for (const result of fixResults) {
      if (result.needsHumanReview) {
        console.log(`  ${result.routeId}:`);
        for (const reason of result.reviewReasons) {
          console.log(`    - ${reason}`);
        }
      }
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
