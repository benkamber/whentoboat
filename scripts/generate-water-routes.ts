/**
 * Auto-generate water-only route waypoints for all Bay destination pairs.
 *
 * Uses visibility-graph.js + ngraph.path to find shortest paths that avoid
 * land polygons from sf-bay-coastline.json. Outputs generated-routes.ts
 * in the same format as verified-routes.ts.
 *
 * Run: npx tsx scripts/generate-water-routes.ts
 */

import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';
// @ts-ignore — no types for visibility-graph.js
import VisibilityGraph from 'visibility-graph.js';
// @ts-ignore — no types for ngraph.path
import ngraphPath from 'ngraph.path';

// ── Load data ────────────────────────────────────────────────────────────────

const coastlineRaw = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/geo/sf-bay-coastline.json'), 'utf8')
);

// Import destinations and distances at runtime
const destModule = require('../data/cities/sf-bay/destinations');
const distModule = require('../data/cities/sf-bay/distances');
const destinations: Array<{ id: string; name: string; lat: number; lng: number; zone: string }> =
  destModule.destinations ?? destModule.default?.destinations ?? [];
const distances: Record<string, number> = distModule.distances ?? distModule.default?.distances ?? {};

// ── Simplify coastline polygons ──────────────────────────────────────────────

console.log('Simplifying coastline polygons...');

// Merge all polygons into a single MultiPolygon, then simplify
const allPolygons: GeoJSON.Feature[] = [];
for (const feature of coastlineRaw.features) {
  if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
    allPolygons.push(feature);
  }
}

// Simplify each polygon to reduce vertex count
const simplified = allPolygons.map((f: any) => {
  return turf.simplify(f, { tolerance: 0.003, highQuality: true });
});

// Count vertices after simplification
let totalVerts = 0;
simplified.forEach((f: any) => {
  if (f.geometry.type === 'Polygon') {
    f.geometry.coordinates.forEach((ring: any) => totalVerts += ring.length);
  } else if (f.geometry.type === 'MultiPolygon') {
    f.geometry.coordinates.forEach((poly: any) => poly.forEach((ring: any) => totalVerts += ring.length));
  }
});
console.log(`Simplified to ${totalVerts} vertices (from 38,728)`);

// Combine into a single MultiPolygon for the visibility graph
const allCoords: number[][][][] = [];
for (const f of simplified) {
  const geom = (f as any).geometry;
  if (geom.type === 'Polygon') {
    allCoords.push(geom.coordinates);
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      allCoords.push(poly);
    }
  }
}

const landMultiPolygon: GeoJSON.Feature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'MultiPolygon',
    coordinates: allCoords,
  },
};

// ── Build visibility graph ───────────────────────────────────────────────────

console.log('Building visibility graph (this may take a minute)...');
const startVG = Date.now();
const vg = new VisibilityGraph(landMultiPolygon);
console.log(`Visibility graph built in ${((Date.now() - startVG) / 1000).toFixed(1)}s`);

// Set up pathfinder
const pathFinder = ngraphPath.nba(vg.graph, {
  distance(fromNode: any, toNode: any) {
    const dx = fromNode.data.x - toNode.data.x;
    const dy = fromNode.data.y - toNode.data.y;
    return Math.sqrt(dx * dx + dy * dy);
  },
});

// ── Generate routes for all Bay destination pairs ────────────────────────────

console.log('Generating routes...');

// Only Bay-to-Bay pairs (skip ocean zones)
const bayDests = destinations.filter((d: any) => !d.zone.startsWith('ocean'));
console.log(`${bayDests.length} Bay destinations, ${bayDests.length * (bayDests.length - 1) / 2} possible pairs`);

interface GeneratedRoute {
  id: string;
  from: string;
  to: string;
  waypoints: [number, number][];
  distanceNm: number;
  source: string;
}

const generatedRoutes: GeneratedRoute[] = [];
let successes = 0;
let failures = 0;

for (let i = 0; i < bayDests.length; i++) {
  for (let j = i + 1; j < bayDests.length; j++) {
    const from = bayDests[i];
    const to = bayDests[j];

    // Check if distance pair exists
    const key = `${from.id}-${to.id}`;
    const revKey = `${to.id}-${from.id}`;
    if (distances[key] === undefined && distances[revKey] === undefined) continue;

    try {
      const originPt = { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [from.lng, from.lat] }, properties: {} };
      const destPt = { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [to.lng, to.lat] }, properties: {} };

      const nodes = vg.addStartAndEndPointsToGraph(originPt, destPt);
      const result = pathFinder.find(nodes.startNode.nodeId, nodes.endNode.nodeId);

      if (result && result.length > 0) {
        // Extract waypoints from path
        const waypoints: [number, number][] = result.map((node: any) => [node.data.x, node.data.y] as [number, number]);

        // Calculate distance in nautical miles
        const line = turf.lineString(waypoints);
        const distanceNm = Math.round(turf.length(line, { units: 'nauticalmiles' }) * 10) / 10;

        generatedRoutes.push({
          id: `${from.id}_${to.id}`,
          from: from.id,
          to: to.id,
          waypoints,
          distanceNm,
          source: 'auto-generated via visibility graph + sf-bay-coastline.json',
        });

        successes++;
      } else {
        console.warn(`  No path found: ${from.name} → ${to.name}`);
        failures++;
      }
    } catch (err: any) {
      console.warn(`  Error: ${from.name} → ${to.name}: ${err.message}`);
      failures++;
    }
  }
}

console.log(`\nGenerated ${successes} routes (${failures} failures)`);

// ── Validate waypoints aren't on land ────────────────────────────────────────

console.log('Validating waypoints...');
let landHits = 0;
for (const route of generatedRoutes) {
  for (const wp of route.waypoints) {
    const pt = turf.point(wp);
    for (const poly of simplified) {
      if (turf.booleanPointInPolygon(pt, poly as any)) {
        landHits++;
        break;
      }
    }
  }
}
console.log(`Land hits: ${landHits} waypoints on land (should be 0 or very few)`);

// ── Write output ─────────────────────────────────────────────────────────────

const outputPath = path.join(__dirname, '../data/cities/sf-bay/generated-routes.ts');

const output = `// AUTO-GENERATED — do not edit manually.
// Generated by scripts/generate-water-routes.ts on ${new Date().toISOString().split('T')[0]}
// Uses visibility-graph pathfinding against OSM coastline polygons.
// Hand-verified routes in verified-routes.ts always take priority.

export interface GeneratedRoute {
  id: string;
  from: string;
  to: string;
  waypoints: [number, number][];
  distanceNm: number;
  source: string;
}

export const generatedRoutes: GeneratedRoute[] = ${JSON.stringify(generatedRoutes, null, 2)};
`;

fs.writeFileSync(outputPath, output);
console.log(`\nWrote ${generatedRoutes.length} routes to ${outputPath}`);
console.log('Done!');
