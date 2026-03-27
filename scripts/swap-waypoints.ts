#!/usr/bin/env npx tsx
import * as fs from 'fs';
import * as path from 'path';
import { waterRoutes } from '../data/cities/sf-bay/water-routes';

const ROUTE_FILE = path.resolve(__dirname, '../data/cities/sf-bay/water-routes.ts');
let content = fs.readFileSync(ROUTE_FILE, 'utf-8');

// For tib->jls and tib->alm: move [-122.41, 37.838] from after [-122.415, 37.862]
// to BEFORE it. This means: remove it from current position, insert before.

for (const toId of ['jls', 'alm']) {
  const route = waterRoutes.find(r => r.fromId === 'tib' && r.toId === toId && r.vesselType === 'default');
  if (!route) continue;

  const wp = [...route.waypoints];

  // Find [-122.41, 37.838] and [-122.415, 37.862]
  const fixIdx = wp.findIndex(p => Math.abs(p[0] - (-122.41)) < 0.001 && Math.abs(p[1] - 37.838) < 0.001);
  const targetIdx = wp.findIndex(p => Math.abs(p[0] - (-122.415)) < 0.001 && Math.abs(p[1] - 37.862) < 0.001);

  if (fixIdx === -1 || targetIdx === -1) {
    console.log(`tib->${toId}: waypoints not found (fix:${fixIdx}, target:${targetIdx})`);
    continue;
  }

  if (fixIdx > targetIdx) {
    // Remove fix point from current position
    wp.splice(fixIdx, 1);
    // Insert before target
    wp.splice(targetIdx, 0, [-122.41, 37.838]);
    console.log(`tib->${toId}: moved [-122.41, 37.838] from index ${fixIdx} to before index ${targetIdx}`);
  } else {
    console.log(`tib->${toId}: already in correct order`);
    continue;
  }

  // Replace in file
  const fromPattern = `fromId: 'tib'`;
  let searchStart = 0;
  while (true) {
    const fromIdx = content.indexOf(fromPattern, searchStart);
    if (fromIdx === -1) break;
    const toPatIdx = content.indexOf(`toId: '${toId}'`, fromIdx);
    if (toPatIdx === -1 || toPatIdx - fromIdx > 200) { searchStart = fromIdx + 1; continue; }
    const vesselIdx = content.indexOf("vesselType: 'default'", fromIdx);
    if (vesselIdx === -1 || vesselIdx - fromIdx > 200) { searchStart = fromIdx + 1; continue; }
    const wpStart = content.indexOf('waypoints: [', toPatIdx);
    if (wpStart === -1 || wpStart - toPatIdx > 200) { searchStart = fromIdx + 1; continue; }

    let depth = 0, wpEnd = -1;
    for (let i = wpStart + 'waypoints: '.length; i < content.length; i++) {
      if (content[i] === '[') depth++;
      if (content[i] === ']') { depth--; if (depth === 0) { wpEnd = i + 1; break; } }
    }
    if (wpEnd === -1) { searchStart = fromIdx + 1; continue; }

    const indent = '      ';
    const newWpStr = 'waypoints: [\n' +
      wp.map(p => `${indent}  [${p[0]}, ${p[1]}],`).join('\n') +
      `\n${indent}]`;
    content = content.substring(0, wpStart) + newWpStr + content.substring(wpEnd);
    break;
  }
}

fs.writeFileSync(ROUTE_FILE, content);
console.log('Done.');
