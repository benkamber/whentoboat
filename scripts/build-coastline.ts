#!/usr/bin/env npx tsx
/**
 * Build SF Bay coastline data from pre-processed OSM land polygons.
 *
 * Prerequisites:
 *   1. Download land-polygons-split-4326.zip from osmdata.openstreetmap.de
 *   2. Unzip to /tmp/land-polygons-split-4326/
 *
 * This script:
 *   1. Reads the shapefile
 *   2. Clips to SF Bay bounding box (37.3°N to 38.2°N, -122.7°W to -121.9°W)
 *   3. Saves as data/geo/sf-bay-coastline.json (~2-5MB)
 *
 * Run: npx tsx scripts/build-coastline.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as shapefile from 'shapefile';
import { bboxClip, area } from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';

// SF Bay bounding box — generous to cover Bodega Bay to Santa Cruz
const BBOX: [number, number, number, number] = [-122.7, 37.3, -121.9, 38.2];

const SHP_PATH = '/tmp/land-polygons-split-4326/land_polygons.shp';
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'geo', 'sf-bay-coastline.json');

async function main() {
  console.log('Reading shapefile...');

  if (!fs.existsSync(SHP_PATH)) {
    console.error(`\nShapefile not found at ${SHP_PATH}`);
    console.error('Download and unzip first:');
    console.error('  curl -L -o /tmp/land-polygons.zip https://osmdata.openstreetmap.de/download/land-polygons-split-4326.zip');
    console.error('  cd /tmp && unzip land-polygons.zip');
    process.exit(1);
  }

  const source = await shapefile.open(SHP_PATH);
  const features: Feature<Polygon | MultiPolygon>[] = [];
  let total = 0;
  let kept = 0;

  while (true) {
    const result = await source.read();
    if (result.done) break;
    total++;

    const feature = result.value as Feature<Polygon | MultiPolygon>;
    if (!feature.geometry) continue;

    // Quick bbox filter — check if any coordinate falls within our bbox
    const coords = feature.geometry.type === 'Polygon'
      ? feature.geometry.coordinates[0]
      : feature.geometry.coordinates[0][0];

    const inBbox = coords.some(([lng, lat]) =>
      lng >= BBOX[0] && lng <= BBOX[2] && lat >= BBOX[1] && lat <= BBOX[3]
    );

    if (!inBbox) continue;

    // Clip to bbox
    try {
      const clipped = bboxClip(feature, BBOX);
      if (clipped && clipped.geometry && clipped.geometry.coordinates.length > 0) {
        // Filter out tiny slivers (< 1000 sq meters)
        const a = area(clipped);
        if (a > 1000) {
          features.push(clipped as Feature<Polygon | MultiPolygon>);
          kept++;
        }
      }
    } catch {
      // Skip features that fail to clip
    }

    if (total % 10000 === 0) {
      console.log(`  Processed ${total} features, kept ${kept}...`);
    }
  }

  console.log(`\nProcessed ${total} total features`);
  console.log(`Kept ${kept} features in SF Bay bounding box`);

  const geojson = {
    type: 'FeatureCollection' as const,
    features,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(geojson));
  const sizeMB = (fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(1);
  console.log(`\nSaved to ${OUTPUT_PATH} (${sizeMB} MB)`);
}

main().catch(console.error);
