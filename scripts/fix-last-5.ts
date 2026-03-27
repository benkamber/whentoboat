#!/usr/bin/env npx tsx
import * as fs from 'fs';
import * as path from 'path';
import { booleanIntersects, booleanPointInPolygon, point, lineString, polygon as turfPolygon, buffer } from '@turf/turf';
import { waterRoutes } from '../data/cities/sf-bay/water-routes';

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/geo/sf-bay-land.json'), 'utf-8'));
const aiRaw = data.features.find((f: any) => f.properties.name === 'coastline-chain-157429145');
const aiPoly = turfPolygon([aiRaw.geometry.coordinates[0]]);
const ai = buffer(aiPoly, -30, { units: 'meters' }) as any;

// Test via-points for segment [4]->[5]: [-122.42, 37.876] -> [-122.455, 37.856]
console.log('=== Segment [4]->[5]: Raccoon Strait to west of AI ===');
const vias1 = [
  [-122.455, 37.880], [-122.46, 37.882], [-122.458, 37.878],
  [-122.465, 37.875], [-122.47, 37.870], [-122.465, 37.880],
];
for (const via of vias1) {
  const onLand = booleanPointInPolygon(point(via), ai);
  const seg1 = lineString([[-122.42, 37.876], via]);
  const seg2 = lineString([via, [-122.455, 37.856]]);
  const clear1 = !booleanIntersects(seg1, ai);
  const clear2 = !booleanIntersects(seg2, ai);
  if (!onLand && clear1 && clear2) {
    console.log('  SOLUTION:', via, '✓');
  } else {
    console.log('  fail:', via, 'land:', onLand, 'seg1:', clear1, 'seg2:', clear2);
  }
}

// Test via-points for segment [6]->[7]: [-122.435, 37.84] -> [-122.415, 37.862]
console.log('\n=== Segment [6]->[7]: South of AI to east side ===');
const vias2 = [
  [-122.41, 37.838], [-122.41, 37.835], [-122.405, 37.840],
  [-122.40, 37.838], [-122.40, 37.835], [-122.395, 37.840],
];
for (const via of vias2) {
  const onLand = booleanPointInPolygon(point(via), ai);
  const seg1 = lineString([[-122.435, 37.84], via]);
  const seg2 = lineString([via, [-122.415, 37.862]]);
  const clear1 = !booleanIntersects(seg1, ai);
  const clear2 = !booleanIntersects(seg2, ai);
  if (!onLand && clear1 && clear2) {
    console.log('  SOLUTION:', via, '✓');
  } else {
    console.log('  fail:', via, 'land:', onLand, 'seg1:', clear1, 'seg2:', clear2);
  }
}
