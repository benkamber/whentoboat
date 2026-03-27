#!/usr/bin/env npx tsx
/**
 * Applies the final 5 route fixes by inserting validated waypoints.
 */
import * as fs from 'fs';
import * as path from 'path';
import { waterRoutes } from '../data/cities/sf-bay/water-routes';

const ROUTE_FILE = path.resolve(__dirname, '../data/cities/sf-bay/water-routes.ts');
let content = fs.readFileSync(ROUTE_FILE, 'utf-8');

const fixes = [
  // Segment [4]->[5] in all 3 routes: insert [-122.455, 37.88] between index 4 and 5
  { from: 'tib', to: 'clp', afterIdx: 4, insert: [-122.455, 37.88] as [number, number] },
  { from: 'tib', to: 'jls', afterIdx: 4, insert: [-122.455, 37.88] as [number, number] },
  { from: 'tib', to: 'alm', afterIdx: 4, insert: [-122.455, 37.88] as [number, number] },
  // Segment [6]->[7] in jls and alm (after the above insertion, this becomes [7]->[8])
  // But clp has different waypoint [7] so only fix jls and alm
  { from: 'tib', to: 'jls', afterIdx: 7, insert: [-122.41, 37.838] as [number, number] },
  { from: 'tib', to: 'alm', afterIdx: 7, insert: [-122.41, 37.838] as [number, number] },
];

// Process fixes in reverse order per route to maintain indices
const byRoute = new Map<string, typeof fixes>();
for (const fix of fixes) {
  const key = `${fix.from}->${fix.to}`;
  if (!byRoute.has(key)) byRoute.set(key, []);
  byRoute.get(key)!.push(fix);
}

for (const [routeId, routeFixes] of byRoute) {
  const [fromId, toId] = routeId.split('->');
  const route = waterRoutes.find(r => r.fromId === fromId && r.toId === toId && r.vesselType === 'default');
  if (!route) { console.log(`Route ${routeId} not found`); continue; }

  // Sort by index descending to preserve positions
  routeFixes.sort((a, b) => b.afterIdx - a.afterIdx);

  const newWaypoints = [...route.waypoints];
  for (const fix of routeFixes) {
    newWaypoints.splice(fix.afterIdx + 1, 0, fix.insert);
    console.log(`${routeId}: inserted [${fix.insert}] after index ${fix.afterIdx}`);
  }

  // Replace waypoints in file
  const fromPattern = `fromId: '${fromId}'`;
  let searchStart = 0;
  while (true) {
    const fromIdx = content.indexOf(fromPattern, searchStart);
    if (fromIdx === -1) break;
    const toIdx = content.indexOf(`toId: '${toId}'`, fromIdx);
    if (toIdx === -1 || toIdx - fromIdx > 200) { searchStart = fromIdx + 1; continue; }
    const vesselIdx = content.indexOf("vesselType: 'default'", fromIdx);
    if (vesselIdx === -1 || vesselIdx - fromIdx > 200) { searchStart = fromIdx + 1; continue; }
    const wpStart = content.indexOf('waypoints: [', toIdx);
    if (wpStart === -1 || wpStart - toIdx > 200) { searchStart = fromIdx + 1; continue; }

    let depth = 0, wpEnd = -1;
    for (let i = wpStart + 'waypoints: '.length; i < content.length; i++) {
      if (content[i] === '[') depth++;
      if (content[i] === ']') { depth--; if (depth === 0) { wpEnd = i + 1; break; } }
    }
    if (wpEnd === -1) { searchStart = fromIdx + 1; continue; }

    const indent = '      ';
    const newWpStr = 'waypoints: [\n' +
      newWaypoints.map(wp => `${indent}  [${wp[0]}, ${wp[1]}],`).join('\n') +
      `\n${indent}]`;
    content = content.substring(0, wpStart) + newWpStr + content.substring(wpEnd);
    break;
  }
}

fs.writeFileSync(ROUTE_FILE, content);
console.log('\nDone. Run validate-routes.ts to verify.');
