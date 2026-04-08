#!/usr/bin/env npx tsx
/**
 * Auto-fix ferry + shipping waypoints that sit on land OR produce
 * segments crossing land. Mirrors fix-routes-phase4.ts for the
 * verifiedRoutes pipeline, but runs against sf-bay-ferry-routes.ts.
 *
 * Output: /tmp/ferry-routes-fixed.json — each route with a full
 * corrected coordinate list. A second pass prints code-ready WPT/path
 * snippets that I can paste into sf-bay-ferry-routes.ts.
 *
 * Run: npx tsx scripts/fix-ferry-routes.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  booleanPointInPolygon,
  point,
  bearing,
  destination,
} from '@turf/turf';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { ferryRoutes, shippingLanes } from '../data/geo/sf-bay-ferry-routes';

const COASTLINE_PATH = path.join(__dirname, '..', 'data', 'geo', 'sf-bay-coastline.json');
const OUT_PATH = '/tmp/ferry-routes-fixed.json';

function loadCoastline(): Feature<Polygon | MultiPolygon>[] {
  const data = JSON.parse(fs.readFileSync(COASTLINE_PATH, 'utf-8')) as FeatureCollection;
  return data.features as Feature<Polygon | MultiPolygon>[];
}

const landPolygons = loadCoastline();
console.log(`Loaded ${landPolygons.length} land polygons`);

function isOnLand(lng: number, lat: number): boolean {
  const pt = point([lng, lat]);
  for (const poly of landPolygons) {
    if (booleanPointInPolygon(pt, poly)) return true;
  }
  return false;
}

function nudgeOffLand(lng: number, lat: number): [number, number] | null {
  if (!isOnLand(lng, lat)) return [lng, lat];
  const baseDirs = Array.from({ length: 16 }, (_, i) => i * 22.5);
  for (let step = 1; step <= 80; step++) {
    const distKm = step * 0.05;
    for (const dir of baseDirs) {
      const dest = destination(point([lng, lat]), distKm, dir, { units: 'kilometers' });
      const [testLng, testLat] = dest.geometry.coordinates;
      if (!isOnLand(testLng, testLat)) {
        return [
          Math.round(testLng * 10000) / 10000,
          Math.round(testLat * 10000) / 10000,
        ];
      }
    }
  }
  return null;
}

function segmentCrossesLand(
  wp1: [number, number],
  wp2: [number, number],
): { crosses: boolean; landPoints: { frac: number; lng: number; lat: number }[] } {
  const landPoints: { frac: number; lng: number; lat: number }[] = [];
  const numChecks = 20;
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

function routeAroundLand(
  wp1: [number, number],
  wp2: [number, number],
  depth = 0,
): [number, number][] {
  if (depth > 4) return [wp1, wp2];
  const { landPoints } = segmentCrossesLand(wp1, wp2);
  if (landPoints.length === 0) return [wp1, wp2];

  const segBearing = bearing(point(wp1), point(wp2));
  const firstLand = landPoints[0];
  const lastLand = landPoints[landPoints.length - 1];
  const midFrac = (firstLand.frac + lastLand.frac) / 2;
  const midLng = wp1[0] + (wp2[0] - wp1[0]) * midFrac;
  const midLat = wp1[1] + (wp2[1] - wp1[1]) * midFrac;
  const perp1 = (segBearing + 90) % 360;
  const perp2 = (segBearing + 270) % 360;

  // Single perpendicular offset
  for (let distStep = 1; distStep <= 50; distStep++) {
    const offsetKm = distStep * 0.1;
    for (const perpDir of [perp1, perp2]) {
      const cand = destination(point([midLng, midLat]), offsetKm, perpDir, { units: 'kilometers' });
      const [candLng, candLat] = cand.geometry.coordinates;
      const candPt: [number, number] = [
        Math.round(candLng * 10000) / 10000,
        Math.round(candLat * 10000) / 10000,
      ];
      if (isOnLand(candPt[0], candPt[1])) continue;
      const seg1 = segmentCrossesLand(wp1, candPt);
      const seg2 = segmentCrossesLand(candPt, wp2);
      if (!seg1.crosses && !seg2.crosses) {
        return [wp1, candPt, wp2];
      }
    }
  }

  // Two-point perpendicular insertion
  for (let distStep = 1; distStep <= 50; distStep++) {
    const offsetKm = distStep * 0.1;
    for (const perpDir of [perp1, perp2]) {
      const pts: [number, number][] = [];
      let allClear = true;
      for (const frac of [0.33, 0.67]) {
        const baseLng = wp1[0] + (wp2[0] - wp1[0]) * frac;
        const baseLat = wp1[1] + (wp2[1] - wp1[1]) * frac;
        const cand = destination(point([baseLng, baseLat]), offsetKm, perpDir, { units: 'kilometers' });
        const [candLng, candLat] = cand.geometry.coordinates;
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
      const s1 = segmentCrossesLand(wp1, pts[0]);
      const s2 = segmentCrossesLand(pts[0], pts[1]);
      const s3 = segmentCrossesLand(pts[1], wp2);
      if (!s1.crosses && !s2.crosses && !s3.crosses) {
        return [wp1, pts[0], pts[1], wp2];
      }
    }
  }

  // Recursive split
  const fallbackLng = wp1[0] + (wp2[0] - wp1[0]) * 0.5;
  const fallbackLat = wp1[1] + (wp2[1] - wp1[1]) * 0.5;
  const nudged = nudgeOffLand(fallbackLng, fallbackLat);
  if (nudged) {
    const left = routeAroundLand(wp1, nudged, depth + 1);
    const right = routeAroundLand(nudged, wp2, depth + 1);
    return [...left.slice(0, -1), ...right];
  }

  return [wp1, wp2]; // give up
}

function fixRoute(name: string, coords: [number, number][]): { name: string; fixed: [number, number][]; ok: boolean; notes: string[] } {
  const notes: string[] = [];
  // 1. Nudge any on-land waypoints
  const nudged: [number, number][] = coords.map(([lng, lat], i) => {
    if (isOnLand(lng, lat)) {
      const n = nudgeOffLand(lng, lat);
      if (n) {
        notes.push(`WP${i + 1}: [${lng},${lat}] nudged to [${n[0]},${n[1]}]`);
        return n;
      }
      notes.push(`WP${i + 1}: [${lng},${lat}] ON LAND, no water within 4km`);
      return [lng, lat];
    }
    return [lng, lat];
  });

  // 2. Route around any crossing segments
  const result: [number, number][] = [nudged[0]];
  for (let i = 0; i < nudged.length - 1; i++) {
    const a = result[result.length - 1];
    const b = nudged[i + 1];
    const { crosses } = segmentCrossesLand(a, b);
    if (!crosses) {
      result.push(b);
      continue;
    }
    const routed = routeAroundLand(a, b);
    notes.push(
      `seg ${i + 1}->${i + 2} crossed land — inserted ${routed.length - 2} intermediate waypoint(s)`,
    );
    // routed starts with a and ends with b
    result.push(...routed.slice(1));
  }

  // 3. Final verification
  let ok = true;
  for (let i = 0; i < result.length; i++) {
    if (isOnLand(result[i][0], result[i][1])) {
      ok = false;
      notes.push(`FINAL FAIL: WP${i + 1} still on land`);
    }
  }
  for (let i = 0; i < result.length - 1; i++) {
    if (segmentCrossesLand(result[i], result[i + 1]).crosses) {
      ok = false;
      notes.push(`FINAL FAIL: seg ${i + 1}->${i + 2} still crosses land`);
    }
  }

  return { name, fixed: result, ok, notes };
}

function main() {
  const output: any = { ferries: [], shipping: [] };

  console.log('\n=== Ferries ===');
  for (const r of ferryRoutes) {
    const res = fixRoute(r.name, r.coordinates);
    console.log(`${res.ok ? 'PASS' : 'FAIL'}: ${r.name} (${r.coordinates.length} -> ${res.fixed.length} wpts)`);
    res.notes.forEach(n => console.log('  ' + n));
    output.ferries.push({ name: r.name, original: r.coordinates.length, fixed: res.fixed, ok: res.ok });
  }

  console.log('\n=== Shipping ===');
  for (const l of shippingLanes) {
    const res = fixRoute(l.name, l.coordinates);
    console.log(`${res.ok ? 'PASS' : 'FAIL'}: ${l.name} (${l.coordinates.length} -> ${res.fixed.length} wpts)`);
    res.notes.forEach(n => console.log('  ' + n));
    output.shipping.push({ id: l.id, name: l.name, original: l.coordinates.length, fixed: res.fixed, ok: res.ok });
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${OUT_PATH}`);
}

main();
