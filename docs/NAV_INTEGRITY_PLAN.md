# Navigational Integrity System — Implementation Plan

## Problem
78 hand-drawn water routes have waypoints that cross land masses (Angel Island, YBI, SF peninsula). A boating app showing routes through land is immediately untrustworthy.

## Phase 0: Documentation Discovery (COMPLETE)

### Verified Turf.js APIs (all from `@turf/turf` v7.3.4):
- `point([lng, lat])` → Feature<Point>
- `lineString([[lng,lat], ...])` → Feature<LineString>
- `polygon([[[lng,lat], ...]])` → Feature<Polygon> (note: double-wrapped array)
- `booleanPointInPolygon(point, polygon)` → boolean
- `booleanIntersects(geom1, geom2)` → boolean (quick check: do they touch at all?)
- `lineIntersect(line, polygon)` → FeatureCollection<Point> (exact intersection points)
- `lineSegment(line)` → FeatureCollection<LineString> (breaks into 2-point segments)
- `booleanCrosses(line, polygon)` → boolean (enters AND exits)

### Existing data format:
- Routes: `waypoints: [number, number][]` in [lng, lat] order — directly compatible with `lineString(waypoints)`
- Zone boundaries: `polygon: [number, number][]` closed ring — compatible with `polygon([coords])`

---

## Phase 1: SF Bay Land Polygons

### What to implement
Create `/Users/benkamber/Projects/whentoboat/data/cities/sf-bay/land-polygons.ts`

Define simplified coastline polygons for every major land mass visible on the map at zoom 11:

1. **San Francisco peninsula** — the largest land mass. Western boundary of the bay. Routes from Marin to East Bay must go around it through the water.
2. **Angel Island** — sits in the middle of the bay. Routes must go around it (south via Pt Blunt or north via Raccoon Strait).
3. **Yerba Buena Island + Treasure Island** — connected land masses at the Bay Bridge. Routes go north or south.
4. **Alcatraz** — small island. Routes should not cross it.
5. **Tiburon/Belvedere peninsula** — juts out from Marin. Routes from Richardson Bay must go around the tip.
6. **Marin headlands** (north shore from Golden Gate to Sausalito)
7. **Oakland/East Bay shoreline** — eastern boundary
8. **Alameda Island** — separated from Oakland by the estuary

Each polygon: `[lng, lat][]` closed ring (first point = last point). Coordinates should trace the actual shoreline visible on the Mapbox dark map. Accuracy: within ~100 meters is sufficient — we're catching routes that visibly cross land, not doing survey work.

```typescript
export interface LandPolygon {
  id: string;
  name: string;
  coordinates: [number, number][]; // closed ring [lng, lat]
}
export const landPolygons: LandPolygon[] = [...]
```

### Verification
- [ ] Each polygon is a valid closed ring (first coord = last coord)
- [ ] Polygons cover the visible land masses at zoom 11
- [ ] No polygon extends into areas that should be water (channels, estuary)

---

## Phase 2: Route Validation Script

### What to implement
Create `/Users/benkamber/Projects/whentoboat/scripts/validate-routes.ts`

A runnable script: `npx tsx scripts/validate-routes.ts`

```typescript
import { lineString, polygon, booleanIntersects, lineSegment, booleanPointInPolygon, point } from '@turf/turf';
import { waterRoutes } from '../data/cities/sf-bay/water-routes';
import { landPolygons } from '../data/cities/sf-bay/land-polygons';

let failures = 0;

for (const route of waterRoutes) {
  const routeLine = lineString(route.waypoints);

  for (const land of landPolygons) {
    const landPoly = polygon([land.coordinates]);

    // Quick check: does the route intersect this land mass at all?
    if (booleanIntersects(routeLine, landPoly)) {
      // Find which segments cross land
      const segments = lineSegment(routeLine);
      for (let i = 0; i < segments.features.length; i++) {
        const seg = segments.features[i];
        if (booleanIntersects(seg, landPoly)) {
          console.error(`FAIL: ${route.fromId}→${route.toId} segment ${i} crosses ${land.name}`);
          console.error(`  From: [${seg.geometry.coordinates[0]}]`);
          console.error(`  To:   [${seg.geometry.coordinates[1]}]`);
          failures++;
        }
      }
    }

    // Check if any waypoint is ON land
    for (let i = 0; i < route.waypoints.length; i++) {
      const wp = point(route.waypoints[i]);
      if (booleanPointInPolygon(wp, landPoly)) {
        console.error(`FAIL: ${route.fromId}→${route.toId} waypoint ${i} is on ${land.name}`);
        console.error(`  Point: [${route.waypoints[i]}]`);
        failures++;
      }
    }
  }
}

if (failures === 0) {
  console.log(`✅ All ${waterRoutes.length} routes pass — no land crossings detected.`);
  process.exit(0);
} else {
  console.error(`\n❌ ${failures} land crossing(s) found across ${waterRoutes.length} routes.`);
  process.exit(1);
}
```

Add to package.json: `"validate-routes": "npx tsx scripts/validate-routes.ts"`

### Verification
- [ ] Script runs without errors: `npm run validate-routes`
- [ ] Script correctly detects known bad routes (test with an intentionally bad route)
- [ ] Script reports exact segment and land mass for each failure
- [ ] Exit code 1 on failure, 0 on success

---

## Phase 3: Fix All Failing Routes

### What to implement
Run the validation script to get a list of all failing routes. For each failure:

1. Identify which land mass is being crossed
2. Look at the segment that crosses (the two waypoints)
3. Insert 2-5 intermediate waypoints that trace around the land mass, staying in the water
4. Re-run validation to confirm the fix

### Strategy for common fixes:
- **Routes crossing Angel Island**: Add waypoints around the south shore (Pt Blunt) or north through Raccoon Strait
- **Routes crossing YBI**: Add waypoints going north of YBI (between the island and Berkeley) or south of YBI (between the island and SF)
- **Routes crossing SF peninsula**: Should never happen — add waypoints that stay offshore along the waterfront
- **Routes crossing Tiburon peninsula**: Add waypoints around the tip of Tiburon

### Verification
- [ ] `npm run validate-routes` exits with code 0
- [ ] Zero failures reported
- [ ] Visual spot-check: open the map and verify routes look realistic
- [ ] All 78 routes still have valid start/end points matching destination coordinates

---

## Phase 4: Add Validation to Build Process

### What to implement
Add the validation script to the build pipeline so land crossings are caught before deploy:

In `package.json`:
```json
"scripts": {
  "validate-routes": "npx tsx scripts/validate-routes.ts",
  "prebuild": "npx tsx scripts/validate-routes.ts"
}
```

This means `npm run build` will automatically validate routes first. If any route crosses land, the build fails.

### Verification
- [ ] `npm run build` runs validation before building
- [ ] Intentionally breaking a route causes the build to fail
- [ ] Fixing the route allows the build to succeed

---

## Anti-Patterns to Avoid
- Do NOT use `booleanCrosses` alone — it only returns true if the line enters AND exits. A line that starts inside a polygon and exits would return false. Use `booleanIntersects` for the general check.
- Do NOT assume `polygon(coords)` — must be `polygon([coords])` (double-wrapped).
- Do NOT skip the waypoint-on-land check — a route could have all segments in water but a waypoint on a peninsula tip.
- Do NOT make land polygons too tight to the actual shoreline — add ~50m buffer so routes that graze the coast are also caught.
