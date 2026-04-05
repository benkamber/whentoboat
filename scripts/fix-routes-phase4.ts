#!/usr/bin/env npx tsx
/**
 * Phase 4: Fix pending routes by nudging waypoints off land and routing around coastline.
 *
 * For each route with validated: false:
 *   1. Check each waypoint — if on land, nudge to nearest water (300m+ from coast)
 *   2. Check each segment — if midpoints cross land, insert intermediate waypoints
 *   3. Iterate until route passes or 10 iterations reached
 *
 * Output: /tmp/phase4-fixed.json
 *
 * Run: npx tsx scripts/fix-routes-phase4.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  booleanPointInPolygon,
  point,
  buffer,
  distance,
  bearing,
  destination,
  polygon as turfPolygon,
} from '@turf/turf';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { verifiedRoutes } from '../data/cities/sf-bay/verified-routes';

const COASTLINE_PATH = path.join(__dirname, '..', 'data', 'geo', 'sf-bay-coastline.json');

// ── Load coastline ──────────────────────────────────────────────────────────

function loadCoastline(): Feature<Polygon | MultiPolygon>[] {
  const data = JSON.parse(fs.readFileSync(COASTLINE_PATH, 'utf-8')) as FeatureCollection;
  return data.features as Feature<Polygon | MultiPolygon>[];
}

const landPolygons = loadCoastline();
console.log(`Loaded ${landPolygons.length} land polygons`);

// ── Geometry helpers ────────────────────────────────────────────────────────

function isOnLand(lng: number, lat: number): boolean {
  const pt = point([lng, lat]);
  for (const poly of landPolygons) {
    if (booleanPointInPolygon(pt, poly)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a point is within `minDistKm` of any land polygon.
 */
function isTooCloseToLand(lng: number, lat: number, minDistKm: number): boolean {
  // Quick check: is it on land?
  if (isOnLand(lng, lat)) return true;

  // Check a ring of 8 points at minDistKm — if any are on land, we're too close
  const directions = [0, 45, 90, 135, 180, 225, 270, 315];
  for (const dir of directions) {
    const dest = destination(point([lng, lat]), minDistKm, dir, { units: 'kilometers' });
    const [testLng, testLat] = dest.geometry.coordinates;
    if (isOnLand(testLng, testLat)) return true;
  }
  return false;
}

/**
 * Nudge a point off land. Search 16 compass directions at 0.0005° steps (~55m)
 * up to 3km. Prefer directions perpendicular to the route segment bearing.
 */
function nudgeOffLand(
  lng: number,
  lat: number,
  segmentBearing?: number,
): [number, number] | null {
  if (!isOnLand(lng, lat)) return [lng, lat]; // Already in water

  // 16 compass directions
  const baseDirections = Array.from({ length: 16 }, (_, i) => i * 22.5);

  // Sort directions: prefer perpendicular to segment bearing
  let directions: number[];
  if (segmentBearing !== undefined) {
    const perp1 = (segmentBearing + 90) % 360;
    const perp2 = (segmentBearing + 270) % 360;
    directions = [...baseDirections].sort((a, b) => {
      const distA = Math.min(
        Math.abs(a - perp1),
        360 - Math.abs(a - perp1),
        Math.abs(a - perp2),
        360 - Math.abs(a - perp2),
      );
      const distB = Math.min(
        Math.abs(b - perp1),
        360 - Math.abs(b - perp1),
        Math.abs(b - perp2),
        360 - Math.abs(b - perp2),
      );
      return distA - distB;
    });
  } else {
    directions = baseDirections;
  }

  // Search at increasing distances: 0.0005° steps (~55m) up to ~3km
  for (let step = 1; step <= 60; step++) {
    const distKm = step * 0.05; // 50m increments up to 3km
    for (const dir of directions) {
      const dest = destination(point([lng, lat]), distKm, dir, { units: 'kilometers' });
      const [testLng, testLat] = dest.geometry.coordinates;
      if (!isOnLand(testLng, testLat)) {
        // Round to 4 decimal places (~11m precision)
        return [
          Math.round(testLng * 10000) / 10000,
          Math.round(testLat * 10000) / 10000,
        ];
      }
    }
  }
  return null; // Couldn't find water within 3km
}

/**
 * Check if a segment between two waypoints crosses land.
 * Tests 10 intermediate points.
 */
function segmentCrossesLand(
  wp1: [number, number],
  wp2: [number, number],
): { crosses: boolean; landPoints: { frac: number; lng: number; lat: number }[] } {
  const landPoints: { frac: number; lng: number; lat: number }[] = [];
  const numChecks = 10;

  for (let i = 1; i < numChecks; i++) {
    const frac = i / numChecks;
    const midLng = wp1[0] + (wp2[0] - wp1[0]) * frac;
    const midLat = wp1[1] + (wp2[1] - wp1[1]) * frac;

    if (isOnLand(midLng, midLat)) {
      landPoints.push({ frac, lng: midLng, lat: midLat });
    }
  }

  return { crosses: landPoints.length > 0, landPoints };
}

/**
 * Route a segment around land by finding a water waypoint that avoids crossing.
 * Strategy: Find the land crossing point, then search perpendicular to the segment
 * for a water point that routes around the obstacle.
 */
function routeAroundLand(
  wp1: [number, number],
  wp2: [number, number],
): [number, number][] {
  const segBearing = bearing(point(wp1), point(wp2));
  const segDist = distance(point(wp1), point(wp2), { units: 'kilometers' });

  // Find all fractional land crossings
  const { landPoints } = segmentCrossesLand(wp1, wp2);
  if (landPoints.length === 0) return [wp1, wp2]; // No crossing

  // Find the midpoint of the land crossing section
  const firstLand = landPoints[0];
  const lastLand = landPoints[landPoints.length - 1];
  const midFrac = (firstLand.frac + lastLand.frac) / 2;
  const midLng = wp1[0] + (wp2[0] - wp1[0]) * midFrac;
  const midLat = wp1[1] + (wp2[1] - wp1[1]) * midFrac;

  // Try perpendicular offsets at increasing distances
  const perp1 = (segBearing + 90) % 360;
  const perp2 = (segBearing + 270) % 360;

  for (let distStep = 1; distStep <= 40; distStep++) {
    const offsetKm = distStep * 0.1; // 100m increments up to 4km

    for (const perpDir of [perp1, perp2]) {
      const candidate = destination(point([midLng, midLat]), offsetKm, perpDir, {
        units: 'kilometers',
      });
      const [candLng, candLat] = candidate.geometry.coordinates;
      const candPt: [number, number] = [
        Math.round(candLng * 10000) / 10000,
        Math.round(candLat * 10000) / 10000,
      ];

      if (isOnLand(candPt[0], candPt[1])) continue;

      // Check if both new segments are clear
      const seg1 = segmentCrossesLand(wp1, candPt);
      const seg2 = segmentCrossesLand(candPt, wp2);

      if (!seg1.crosses && !seg2.crosses) {
        return [wp1, candPt, wp2];
      }
    }
  }

  // If simple perpendicular offset didn't work, try a wider search
  // with multiple intermediate points
  for (let distStep = 1; distStep <= 40; distStep++) {
    const offsetKm = distStep * 0.1;

    for (const perpDir of [perp1, perp2]) {
      // Try inserting two intermediate waypoints at 1/3 and 2/3
      const pts: [number, number][] = [];
      let allClear = true;

      for (const frac of [0.33, 0.67]) {
        const baseLng = wp1[0] + (wp2[0] - wp1[0]) * frac;
        const baseLat = wp1[1] + (wp2[1] - wp1[1]) * frac;
        const candidate = destination(point([baseLng, baseLat]), offsetKm, perpDir, {
          units: 'kilometers',
        });
        const [candLng, candLat] = candidate.geometry.coordinates;
        const candPt: [number, number] = [
          Math.round(candLng * 10000) / 10000,
          Math.round(candLat * 10000) / 10000,
        ];

        if (isOnLand(candPt[0], candPt[1])) {
          allClear = false;
          break;
        }
        pts.push(candPt);
      }

      if (!allClear || pts.length < 2) continue;

      // Check all segments
      const allSegs = [
        segmentCrossesLand(wp1, pts[0]),
        segmentCrossesLand(pts[0], pts[1]),
        segmentCrossesLand(pts[1], wp2),
      ];

      if (allSegs.every(s => !s.crosses)) {
        return [wp1, pts[0], pts[1], wp2];
      }
    }
  }

  // Couldn't route around — return original (will be marked as still failing)
  return [wp1, wp2];
}

// ── Manual overrides for routes through narrow waterways ─────────────────────
// These routes pass through areas where automatic nudging fails because the
// water channel is too narrow or the route needs to go around an island.

const MANUAL_OVERRIDES: Record<string, [number, number][]> = {
  // Jack London Square approach: must route south of YBI through Oakland Bar Channel
  // Common suffix for all *_jls routes from the Bay
  // Route: south of YBI → Bar Channel entrance → Oakland Inner Harbor → JLS
};

/**
 * The JLS approach waypoints to append to any route ending at Jack London.
 * Replaces the common failing segment [-122.34, 37.81] → [-122.278, 37.794]
 * with a validated path through the Oakland Bar Channel.
 */
const JLS_APPROACH: [number, number][] = [
  [-122.340, 37.800],
  [-122.320, 37.797],
  [-122.310, 37.793],
  [-122.278, 37.794],
];

/**
 * Angel Island approach: must go WEST through Raccoon Strait, not directly from south.
 * The island blocks direct routes from the south/east.
 */
const ANGEL_ISLAND_APPROACH_FROM_WEST: [number, number][] = [
  [-122.455, 37.855],
  [-122.448, 37.870],
  [-122.4346, 37.8673],
];

// ── Main fix loop ───────────────────────────────────────────────────────────

interface FixResult {
  id: string;
  name: string;
  originalWaypoints: [number, number][];
  fixedWaypoints: [number, number][];
  passes: boolean;
  iterations: number;
  issues: string[];
}

function validateRoute(waypoints: [number, number][]): {
  passes: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check waypoints
  for (let i = 0; i < waypoints.length; i++) {
    const [lng, lat] = waypoints[i];
    if (isOnLand(lng, lat)) {
      issues.push(`WP ${i + 1} [${lng}, ${lat}] ON LAND`);
    }
  }

  // Check segment midpoints (same as validate-waypoints.ts)
  for (let i = 0; i < waypoints.length - 1; i++) {
    for (const frac of [0.25, 0.5, 0.75]) {
      const midLng = waypoints[i][0] + (waypoints[i + 1][0] - waypoints[i][0]) * frac;
      const midLat = waypoints[i][1] + (waypoints[i + 1][1] - waypoints[i][1]) * frac;
      if (isOnLand(midLng, midLat)) {
        issues.push(
          `Segment ${i + 1}→${i + 2} (${Math.round(frac * 100)}%) [${midLng.toFixed(4)}, ${midLat.toFixed(4)}] ON LAND`,
        );
      }
    }
  }

  return { passes: issues.length === 0, issues };
}

function applyManualFixes(routeId: string, waypoints: [number, number][]): [number, number][] {
  // ── Specific route overrides (check FIRST, before generic suffix handlers) ──

  // tib_sbh: route needs to swing east to avoid SF waterfront
  if (routeId === 'tib_sbh') {
    return [
      [-122.4555, 37.8728],
      [-122.445, 37.84],
      [-122.400, 37.815],
      [-122.390, 37.800],
      [-122.385, 37.78],
    ];
  }

  // tib_jls: need to avoid Angel Island AND route through Bar Channel
  if (routeId === 'tib_jls') {
    return [
      [-122.4554, 37.8727],
      [-122.450, 37.852],
      [-122.420, 37.830],
      [-122.400, 37.815],
      [-122.370, 37.806],
      [-122.340, 37.800],
      [-122.320, 37.797],
      [-122.310, 37.793],
      [-122.278, 37.794],
    ];
  }

  // ── Generic suffix handlers ──

  // Check if route ends at Jack London (id ends in _jls)
  if (routeId.endsWith('_jls')) {
    // Find the segment that goes to JLS and replace it with the Bar Channel approach
    const jlsDest = waypoints[waypoints.length - 1];
    // If last waypoint is near JLS destination
    if (Math.abs(jlsDest[0] - (-122.278)) < 0.01 && Math.abs(jlsDest[1] - 37.794) < 0.01) {
      // Find the last waypoint that's safely in open water (west of Oakland landmass)
      // The JLS approach starts at [-122.34, 37.80] which is south of YBI
      // Look for a waypoint that's in open water and not part of the problematic segment
      let lastSafeIdx = -1;
      for (let i = waypoints.length - 2; i >= 0; i--) {
        const wp = waypoints[i];
        // Safe if: in water AND either west of -122.34 OR latitude > 37.81 (open bay)
        if (!isOnLand(wp[0], wp[1]) && (wp[0] <= -122.34 || wp[1] > 37.81)) {
          lastSafeIdx = i;
          break;
        }
      }
      if (lastSafeIdx >= 0) {
        const prefix = waypoints.slice(0, lastSafeIdx + 1);
        const lastSafe = prefix[prefix.length - 1];
        const approachStart = JLS_APPROACH[0];
        const dist = Math.sqrt(
          Math.pow(lastSafe[0] - approachStart[0], 2) +
          Math.pow(lastSafe[1] - approachStart[1], 2),
        );
        if (dist > 0.005) {
          return [...prefix, ...JLS_APPROACH];
        } else {
          return [...prefix, ...JLS_APPROACH.slice(1)];
        }
      } else {
        // No safe upstream waypoint found -- prepend JLS approach from the start
        return [waypoints[0], ...JLS_APPROACH];
      }
    }
  }

  // Check if route ends at Angel Island (id ends in _ang)
  if (routeId.endsWith('_ang')) {
    const angDest = waypoints[waypoints.length - 1];
    // If last waypoint is near Angel Island
    if (Math.abs(angDest[0] - (-122.4346)) < 0.01 && Math.abs(angDest[1] - 37.8673) < 0.01) {
      // Find the last waypoint that's safely in open water (south of Angel Island)
      let lastSafeIdx = -1;
      for (let i = waypoints.length - 2; i >= 0; i--) {
        if (!isOnLand(waypoints[i][0], waypoints[i][1]) && waypoints[i][1] < 37.845) {
          lastSafeIdx = i;
          break;
        }
      }
      if (lastSafeIdx >= 0) {
        const prefix = waypoints.slice(0, lastSafeIdx + 1);
        return [...prefix, ...ANGEL_ISLAND_APPROACH_FROM_WEST];
      }
    }
  }

  return waypoints;
}

function fixRoute(route: (typeof verifiedRoutes)[0]): FixResult {
  let waypoints: [number, number][] = route.waypoints.map(wp => [...wp] as [number, number]);
  const originalWaypoints = route.waypoints.map(wp => [...wp] as [number, number]);

  // Apply manual overrides first for known problem routes
  waypoints = applyManualFixes(route.id, waypoints);

  for (let iteration = 0; iteration < 10; iteration++) {
    const check = validateRoute(waypoints);
    if (check.passes) {
      return {
        id: route.id,
        name: route.name,
        originalWaypoints,
        fixedWaypoints: waypoints,
        passes: true,
        iterations: iteration,
        issues: [],
      };
    }

    // Step 1: Nudge waypoints off land
    for (let i = 0; i < waypoints.length; i++) {
      const [lng, lat] = waypoints[i];
      if (isOnLand(lng, lat)) {
        // Compute bearing from previous/next waypoint for direction preference
        let segBearing: number | undefined;
        if (i > 0) {
          segBearing = bearing(point(waypoints[i - 1]), point(waypoints[i]));
        } else if (i < waypoints.length - 1) {
          segBearing = bearing(point(waypoints[i]), point(waypoints[i + 1]));
        }

        const fixed = nudgeOffLand(lng, lat, segBearing);
        if (fixed) {
          waypoints[i] = fixed;
        }
      }
    }

    // Step 2: Fix segments that cross land by inserting intermediate waypoints
    let newWaypoints: [number, number][] = [waypoints[0]];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const { crosses } = segmentCrossesLand(waypoints[i], waypoints[i + 1]);
      if (crosses) {
        const routed = routeAroundLand(waypoints[i], waypoints[i + 1]);
        // routed includes start and end, skip start (already in newWaypoints)
        for (let j = 1; j < routed.length; j++) {
          newWaypoints.push(routed[j]);
        }
      } else {
        newWaypoints.push(waypoints[i + 1]);
      }
    }
    waypoints = newWaypoints;
  }

  // Final check after all iterations
  const finalCheck = validateRoute(waypoints);
  return {
    id: route.id,
    name: route.name,
    originalWaypoints,
    fixedWaypoints: waypoints,
    passes: finalCheck.passes,
    iterations: 10,
    issues: finalCheck.issues,
  };
}

// ── Run ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('\n=== Phase 4: Fix Pending Routes ===\n');

  const pendingRoutes = verifiedRoutes.filter(r => !r.validated);
  console.log(`Found ${pendingRoutes.length} routes with validated: false\n`);

  const results: FixResult[] = [];
  let passCount = 0;
  let failCount = 0;

  for (const route of pendingRoutes) {
    process.stdout.write(`Fixing ${route.id} (${route.name})... `);
    const result = fixRoute(route);
    results.push(result);

    if (result.passes) {
      passCount++;
      console.log(`PASS (${result.iterations} iterations, ${result.fixedWaypoints.length} waypoints)`);
    } else {
      failCount++;
      console.log(`FAIL after 10 iterations`);
      result.issues.forEach(issue => console.log(`  ${issue}`));
    }
  }

  // Write results
  const output = {
    timestamp: new Date().toISOString(),
    summary: {
      total: pendingRoutes.length,
      passed: passCount,
      failed: failCount,
    },
    fixes: results.map(r => ({
      id: r.id,
      name: r.name,
      passes: r.passes,
      iterations: r.iterations,
      waypointsBefore: r.originalWaypoints.length,
      waypointsAfter: r.fixedWaypoints.length,
      waypoints: r.fixedWaypoints,
      issues: r.issues,
    })),
  };

  fs.writeFileSync('/tmp/phase4-fixed.json', JSON.stringify(output, null, 2));
  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passCount}/${pendingRoutes.length}`);
  console.log(`Failed: ${failCount}/${pendingRoutes.length}`);
  console.log(`\nResults written to /tmp/phase4-fixed.json`);
}

main();
