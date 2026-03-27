#!/usr/bin/env npx tsx
/**
 * Fixes the final 6 land crossings by inserting validated intermediate waypoints.
 *
 * Segment 1 (3 routes): [-122.42, 37.87] -> [-122.445, 37.856] clips Angel Island west
 *   Fix: insert [-122.435, 37.875] (north through Raccoon Strait first)
 *
 * Segment 2 (2 routes): [-122.445, 37.856] -> [-122.415, 37.862] clips Angel Island south
 *   Fix: insert [-122.435, 37.844] (south around Pt Blunt)
 *
 * Segment 3 (1 route): [-122.332, 37.791] -> [-122.315, 37.796] clips Alameda
 *   Fix: insert [-122.335, 37.798] and [-122.32, 37.80] (north of coast)
 */

import * as fs from 'fs';
import * as path from 'path';
import { waterRoutes } from '../data/cities/sf-bay/water-routes';

const ROUTE_FILE = path.resolve(__dirname, '../data/cities/sf-bay/water-routes.ts');
let content = fs.readFileSync(ROUTE_FILE, 'utf-8');

function insertWaypointInRoute(
  fromId: string,
  toId: string,
  afterCoord: [number, number],
  insertCoords: [number, number][]
): boolean {
  // Find the route in the file
  const route = waterRoutes.find(r => r.fromId === fromId && r.toId === toId && r.vesselType === 'default');
  if (!route) {
    console.log(`  Route ${fromId}->${toId} not found`);
    return false;
  }

  // Find the waypoint that matches afterCoord
  const wpIdx = route.waypoints.findIndex(wp =>
    Math.abs(wp[0] - afterCoord[0]) < 0.001 && Math.abs(wp[1] - afterCoord[1]) < 0.001
  );
  if (wpIdx === -1) {
    console.log(`  Waypoint [${afterCoord}] not found in ${fromId}->${toId}`);
    return false;
  }

  // Build new waypoints
  const newWaypoints = [...route.waypoints];
  // Insert AFTER the found waypoint (at wpIdx + 1)
  newWaypoints.splice(wpIdx + 1, 0, ...insertCoords);

  // Replace in file content
  const fromPattern = `fromId: '${fromId}'`;
  const toPattern = `toId: '${toId}'`;

  let searchStart = 0;
  while (true) {
    const fromIdx = content.indexOf(fromPattern, searchStart);
    if (fromIdx === -1) return false;

    const toIdx = content.indexOf(toPattern, fromIdx);
    if (toIdx === -1 || toIdx - fromIdx > 200) {
      searchStart = fromIdx + 1;
      continue;
    }

    const vesselIdx = content.indexOf("vesselType: 'default'", fromIdx);
    if (vesselIdx === -1 || vesselIdx - fromIdx > 200) {
      searchStart = fromIdx + 1;
      continue;
    }

    const wpStart = content.indexOf('waypoints: [', toIdx);
    if (wpStart === -1 || wpStart - toIdx > 200) {
      searchStart = fromIdx + 1;
      continue;
    }

    let depth = 0;
    let wpEnd = -1;
    for (let i = wpStart + 'waypoints: '.length; i < content.length; i++) {
      if (content[i] === '[') depth++;
      if (content[i] === ']') {
        depth--;
        if (depth === 0) { wpEnd = i + 1; break; }
      }
    }
    if (wpEnd === -1) { searchStart = fromIdx + 1; continue; }

    const indent = '      ';
    const newWpStr = 'waypoints: [\n' +
      newWaypoints.map(wp => `${indent}  [${wp[0]}, ${wp[1]}],`).join('\n') +
      `\n${indent}]`;

    content = content.substring(0, wpStart) + newWpStr + content.substring(wpEnd);
    console.log(`  Fixed ${fromId}->${toId}: inserted ${insertCoords.length} waypoint(s) after index ${wpIdx}`);
    return true;
  }
}

console.log('Fixing final 6 land crossings...\n');

// Segment 1: tib->clp, tib->jls, tib->alm
// After [-122.42, 37.87] (Raccoon Strait area), insert [-122.435, 37.875]
insertWaypointInRoute('tib', 'clp', [-122.42, 37.87], [[-122.435, 37.875]]);
// Need to reload content after each write — but we're modifying in memory
insertWaypointInRoute('tib', 'jls', [-122.42, 37.87], [[-122.435, 37.875]]);
insertWaypointInRoute('tib', 'alm', [-122.42, 37.87], [[-122.435, 37.875]]);

// Segment 2: tib->clp, tib->jls, tib->alm also have the south segment
// After [-122.445, 37.856], insert [-122.435, 37.844]
insertWaypointInRoute('tib', 'clp', [-122.445, 37.856], [[-122.435, 37.844]]);
insertWaypointInRoute('tib', 'jls', [-122.445, 37.856], [[-122.435, 37.844]]);
insertWaypointInRoute('tib', 'alm', [-122.445, 37.856], [[-122.435, 37.844]]);

// Segment 3: mcc->jls
// After [-122.332, 37.791], insert [-122.335, 37.798] and [-122.32, 37.80]
insertWaypointInRoute('mcc', 'jls', [-122.332, 37.791], [[-122.335, 37.798], [-122.32, 37.80]]);

fs.writeFileSync(ROUTE_FILE, content);
console.log('\nDone. Re-run validate-routes.ts to verify.');
