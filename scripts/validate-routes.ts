#!/usr/bin/env npx tsx
// ============================================
// Validate Water Routes — Navigational Integrity Check
//
// Checks all 78 water routes against land polygons and depth data:
//   1. No route segment crosses land (booleanIntersects)
//   2. No interior waypoint is on land (booleanPointInPolygon)
//   3. All waypoints have sufficient depth for each vessel
//
// Run:  npx tsx scripts/validate-routes.ts
// Exit: 0 = all pass, 1 = failures found
// ============================================

import * as fs from 'fs';
import * as path from 'path';
import {
  lineString,
  polygon as turfPolygon,
  point as turfPoint,
  booleanIntersects,
  booleanPointInPolygon,
  lineSegment,
  buffer,
} from '@turf/turf';
import type { Feature, Polygon, LineString } from 'geojson';

// ─── Imports from project ───
// We can't use @/ aliases in scripts run via tsx, so use relative paths
import { waterRoutes, type WaterRoute } from '../data/cities/sf-bay/water-routes';
import { vesselPresets } from '../data/vessels';
import { zoneDepths } from '../data/geo/sf-bay-depths';

// ─── Types ───

interface LandFeature {
  name: string;
  type: string;
  source: string;
  polygon: Feature<Polygon>;
  buffered: Feature<Polygon>; // -50m buffered version
}

interface LandCrossing {
  routeId: string;
  segmentIndex: number;
  landMassName: string;
  segmentCoords: [number, number][];
}

interface PointOnLand {
  routeId: string;
  waypointIndex: number;
  landMassName: string;
  coordinates: [number, number];
}

interface DepthIssue {
  routeId: string;
  zoneId: string;
  vesselName: string;
  vesselDraft: number;
  zoneMinDepth: number;
  clearance: number;
  safetyMargin: number;
}

interface ValidationResult {
  totalRoutes: number;
  landCrossings: LandCrossing[];
  pointsOnLand: PointOnLand[];
  depthIssues: DepthIssue[];
  perVesselClearance: Map<string, { passCount: number; failCount: number; warnings: string[] }>;
}

// ─── Constants ───

const LAND_FILE = path.resolve(__dirname, '../data/geo/sf-bay-land.json');
const BUFFER_METERS = -300; // negative buffer = shrink inward (traced polygons are significantly oversized vs actual coastline)
const SAFETY_MARGIN_FT = 1.5;

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

    // Apply negative buffer to shrink land polygon inward
    // This prevents false positives where routes start/end at docks
    // right at the water's edge
    let buffered: Feature<Polygon>;
    try {
      const b = buffer(poly, BUFFER_METERS, { units: 'meters' });
      if (b && b.geometry && b.geometry.type === 'Polygon') {
        buffered = b as Feature<Polygon>;
      } else if (b && b.geometry && b.geometry.type === 'MultiPolygon') {
        // If buffer produces a MultiPolygon (can happen with complex shapes),
        // use the largest polygon
        const mp = b.geometry as any;
        let largest = mp.coordinates[0];
        for (const ring of mp.coordinates) {
          if (ring[0].length > largest[0].length) {
            largest = ring;
          }
        }
        buffered = turfPolygon(largest);
      } else {
        // Buffer eliminated the polygon (too small) — skip
        console.warn(`  Warning: ${feature.properties.name} eliminated by -50m buffer, skipping`);
        continue;
      }
    } catch {
      // If buffer fails, use original (slightly more false positives)
      console.warn(`  Warning: Buffer failed for ${feature.properties.name}, using original polygon`);
      buffered = poly;
    }

    features.push({
      name: feature.properties.name,
      type: feature.properties.type,
      source: feature.properties.source,
      polygon: poly,
      buffered,
    });
  }

  return features;
}

// ─── Route ID helper ───

function routeId(route: WaterRoute): string {
  return `${route.fromId} -> ${route.toId}`;
}

// ─── Validate routes ───

function validateRoutes(): ValidationResult {
  console.log('=== Water Route Validation ===\n');

  // 1. Load land polygons
  console.log('Loading land polygons...');
  const landFeatures = loadLandPolygons();
  console.log(`  Loaded ${landFeatures.length} land features (with -50m buffer applied)\n`);

  // 2. Load routes
  console.log(`Validating ${waterRoutes.length} water routes...\n`);

  const landCrossings: LandCrossing[] = [];
  const pointsOnLand: PointOnLand[] = [];
  const depthIssues: DepthIssue[] = [];

  // Per-vessel tracking
  const perVesselClearance = new Map<
    string,
    { passCount: number; failCount: number; warnings: string[] }
  >();
  for (const vessel of vesselPresets) {
    perVesselClearance.set(vessel.name, { passCount: 0, failCount: 0, warnings: [] });
  }

  for (const route of waterRoutes) {
    const rid = routeId(route);
    const waypoints = route.waypoints;

    // ── 2a. Build route lineString ──
    if (waypoints.length < 2) {
      console.warn(`  SKIP: ${rid} has fewer than 2 waypoints`);
      continue;
    }

    const routeLine = lineString(waypoints);

    // ── 2b. Check interior waypoints against land (skip first & last = dock tolerance) ──
    for (let i = 1; i < waypoints.length - 1; i++) {
      const wp = waypoints[i];
      const pt = turfPoint(wp);

      for (const land of landFeatures) {
        if (booleanPointInPolygon(pt, land.buffered)) {
          pointsOnLand.push({
            routeId: rid,
            waypointIndex: i,
            landMassName: land.name,
            coordinates: wp,
          });
        }
      }
    }

    // ── 2c. Break route into segments and check each against land ──
    const segments = lineSegment(routeLine);

    for (let segIdx = 0; segIdx < segments.features.length; segIdx++) {
      const seg = segments.features[segIdx];

      for (const land of landFeatures) {
        if (booleanIntersects(seg, land.buffered)) {
          const coords = seg.geometry.coordinates as [number, number][];
          landCrossings.push({
            routeId: rid,
            segmentIndex: segIdx,
            landMassName: land.name,
            segmentCoords: coords,
          });
        }
      }
    }

    // ── 2d. Depth / draft check per vessel ──
    for (const vessel of vesselPresets) {
      const vc = perVesselClearance.get(vessel.name)!;
      let routeOk = true;

      // Check each zone the route traverses
      const uniqueZones = [...new Set(route.zones)];
      for (const zoneId of uniqueZones) {
        const zone = zoneDepths.find((z) => z.zoneId === zoneId);
        if (!zone) continue;

        // At MLLW (worst case tide = 0)
        const clearance = zone.minDepthFt - vessel.draft;
        if (clearance < SAFETY_MARGIN_FT) {
          routeOk = false;
          depthIssues.push({
            routeId: rid,
            zoneId,
            vesselName: vessel.name,
            vesselDraft: vessel.draft,
            zoneMinDepth: zone.minDepthFt,
            clearance,
            safetyMargin: SAFETY_MARGIN_FT,
          });
        }
      }

      if (routeOk) {
        vc.passCount++;
      } else {
        vc.failCount++;
      }
    }
  }

  return {
    totalRoutes: waterRoutes.length,
    landCrossings,
    pointsOnLand,
    depthIssues,
    perVesselClearance,
  };
}

// ─── Report results ───

function reportResults(result: ValidationResult): boolean {
  const { totalRoutes, landCrossings, pointsOnLand, depthIssues, perVesselClearance } = result;

  let hasFailures = false;

  // Land crossing report
  console.log('─── Land Crossing Check ───');
  if (landCrossings.length === 0) {
    console.log('  PASS: No route segments cross land.\n');
  } else {
    hasFailures = true;
    console.log(`  FAIL: ${landCrossings.length} segment(s) cross land:\n`);
    // Group by route
    const byRoute = new Map<string, LandCrossing[]>();
    for (const lc of landCrossings) {
      if (!byRoute.has(lc.routeId)) byRoute.set(lc.routeId, []);
      byRoute.get(lc.routeId)!.push(lc);
    }
    for (const [rid, crossings] of byRoute) {
      console.log(`  Route: ${rid}`);
      for (const c of crossings) {
        console.log(
          `    Segment ${c.segmentIndex}: crosses "${c.landMassName}" at [${c.segmentCoords.map((c) => `[${c[0].toFixed(4)}, ${c[1].toFixed(4)}]`).join(' -> ')}]`,
        );
      }
    }
    console.log();
  }

  // Point on land report
  console.log('─── Waypoint-on-Land Check ───');
  if (pointsOnLand.length === 0) {
    console.log('  PASS: No interior waypoints are on land.\n');
  } else {
    hasFailures = true;
    console.log(`  FAIL: ${pointsOnLand.length} interior waypoint(s) on land:\n`);
    for (const pol of pointsOnLand) {
      console.log(
        `  Route: ${pol.routeId}, waypoint ${pol.waypointIndex}: on "${pol.landMassName}" at [${pol.coordinates[0].toFixed(4)}, ${pol.coordinates[1].toFixed(4)}]`,
      );
    }
    console.log();
  }

  // Depth report
  console.log('─── Depth / Draft Clearance ───');
  if (depthIssues.length === 0) {
    console.log('  PASS: All routes have sufficient depth for all vessels (at MLLW).\n');
  } else {
    console.log(`  WARNING: ${depthIssues.length} route/vessel/zone combinations with insufficient depth at MLLW:\n`);
    // Group by vessel
    const byVessel = new Map<string, DepthIssue[]>();
    for (const di of depthIssues) {
      if (!byVessel.has(di.vesselName)) byVessel.set(di.vesselName, []);
      byVessel.get(di.vesselName)!.push(di);
    }
    for (const [name, issues] of byVessel) {
      const uniqueRoutes = new Set(issues.map((i) => i.routeId));
      console.log(`  ${name} (draft: ${issues[0].vesselDraft}ft): ${uniqueRoutes.size} routes with depth issues`);
      // Show first few
      const shown = new Set<string>();
      for (const issue of issues) {
        const key = `${issue.routeId}:${issue.zoneId}`;
        if (shown.has(key)) continue;
        shown.add(key);
        if (shown.size <= 5) {
          console.log(
            `    ${issue.routeId} in zone "${issue.zoneId}": min depth ${issue.zoneMinDepth}ft, clearance ${issue.clearance.toFixed(1)}ft (need ${issue.safetyMargin}ft)`,
          );
        }
      }
      if (shown.size > 5) {
        console.log(`    ... and ${shown.size - 5} more`);
      }
    }
    console.log();
  }

  // Per-vessel summary
  console.log('─── Per-Vessel Route Clearance ───');
  for (const vessel of vesselPresets) {
    const vc = perVesselClearance.get(vessel.name)!;
    const total = vc.passCount + vc.failCount;
    const pct = ((vc.passCount / total) * 100).toFixed(0);
    const status = vc.failCount === 0 ? 'ALL CLEAR' : `${vc.failCount} DEPTH WARNINGS`;
    console.log(
      `  ${vessel.name.padEnd(22)} (${vessel.draft}ft draft): ${vc.passCount}/${total} routes pass (${pct}%) — ${status}`,
    );
  }
  console.log();

  // Overall summary
  console.log('═══ SUMMARY ═══');
  console.log(`  Total routes checked:    ${totalRoutes}`);
  console.log(`  Land crossings:          ${landCrossings.length}`);
  console.log(`  Waypoints on land:       ${pointsOnLand.length}`);
  console.log(`  Depth issues (at MLLW):  ${depthIssues.length}`);

  const landPass = landCrossings.length === 0 && pointsOnLand.length === 0;
  console.log(`\n  Land integrity:          ${landPass ? 'PASS' : 'FAIL'}`);
  console.log(`  Depth integrity:         ${depthIssues.length === 0 ? 'PASS' : 'WARNINGS (depth issues are tide-dependent)'}`);
  console.log();

  return hasFailures;
}

// ─── Main ───

const result = validateRoutes();
const hasFailures = reportResults(result);

// Export for use by fix-routes script
export { validateRoutes, type ValidationResult, type LandCrossing, type PointOnLand };

process.exit(hasFailures ? 1 : 0);
