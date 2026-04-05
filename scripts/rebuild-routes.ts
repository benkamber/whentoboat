#!/usr/bin/env npx tsx
/**
 * Phase 4 Step 2: Rebuild verified-routes.ts with fixed waypoints.
 *
 * Reads the current verified-routes.ts, replaces waypoints for routes
 * that were fixed in phase4-fixed.json, and sets validated: true.
 *
 * Uses bracket-counting to correctly match nested waypoint arrays.
 *
 * Run: npx tsx scripts/rebuild-routes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROUTES_PATH = path.join(__dirname, '..', 'data', 'cities', 'sf-bay', 'verified-routes.ts');
const FIXES_PATH = '/tmp/phase4-fixed.json';

interface Fix {
  id: string;
  name: string;
  passes: boolean;
  iterations: number;
  waypointsBefore: number;
  waypointsAfter: number;
  waypoints: [number, number][];
  issues: string[];
}

interface FixData {
  summary: { total: number; passed: number; failed: number };
  fixes: Fix[];
}

/**
 * Find the extent of a bracketed expression starting at the opening bracket.
 * Returns the index AFTER the closing bracket.
 */
function findMatchingBracket(content: string, openIdx: number): number {
  const openChar = content[openIdx];
  const closeChar = openChar === '[' ? ']' : openChar === '{' ? '}' : ')';
  let depth = 0;

  for (let i = openIdx; i < content.length; i++) {
    if (content[i] === openChar) depth++;
    else if (content[i] === closeChar) {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error(`No matching bracket found starting at index ${openIdx}`);
}

function main() {
  // Load fixes
  const fixData: FixData = JSON.parse(fs.readFileSync(FIXES_PATH, 'utf-8'));
  console.log(`Loaded ${fixData.fixes.length} fixes from ${FIXES_PATH}`);
  console.log(`  Passed: ${fixData.summary.passed}, Failed: ${fixData.summary.failed}`);

  // Build a map of fixes by route ID
  const fixMap = new Map<string, Fix>();
  for (const fix of fixData.fixes) {
    if (fix.passes) {
      fixMap.set(fix.id, fix);
    }
  }
  console.log(`\n${fixMap.size} routes to update\n`);

  // Read the current file
  let content = fs.readFileSync(ROUTES_PATH, 'utf-8');

  // Process each fix - work backwards through the file to preserve indices
  // First, collect all replacement operations
  interface Replacement {
    start: number;
    end: number;
    newText: string;
    routeId: string;
  }
  const replacements: Replacement[] = [];

  for (const [routeId, fix] of fixMap) {
    const idPattern = `id: "${routeId}"`;
    const idIndex = content.indexOf(idPattern);

    if (idIndex === -1) {
      console.log(`WARNING: Route ${routeId} not found in file`);
      continue;
    }

    // Find the containing route object
    let routeStart = idIndex;
    let braceDepth = 0;
    for (let i = idIndex; i >= 0; i--) {
      if (content[i] === '{') {
        if (braceDepth === 0) {
          routeStart = i;
          break;
        }
        braceDepth--;
      } else if (content[i] === '}') {
        braceDepth++;
      }
    }

    // Find end of route object
    const routeEnd = findMatchingBracket(content, routeStart);
    const routeBlock = content.substring(routeStart, routeEnd);

    // Find waypoints array within the route block
    const wpKeyword = 'waypoints:';
    const wpKeyIdx = routeBlock.indexOf(wpKeyword);
    if (wpKeyIdx === -1) {
      console.log(`WARNING: No waypoints found in route ${routeId}`);
      continue;
    }

    // Find the opening bracket of the waypoints array
    let wpArrayStart = -1;
    for (let i = wpKeyIdx + wpKeyword.length; i < routeBlock.length; i++) {
      if (routeBlock[i] === '[') {
        wpArrayStart = i;
        break;
      }
    }
    if (wpArrayStart === -1) {
      console.log(`WARNING: No waypoints array found in route ${routeId}`);
      continue;
    }

    // Find the matching closing bracket (handles nested [lng, lat] arrays)
    const wpArrayEnd = findMatchingBracket(routeBlock, wpArrayStart);

    // Build new waypoints string
    const newWaypointsStr = '[' + fix.waypoints
      .map(wp => `[${wp[0]}, ${wp[1]}]`)
      .join(', ') + ']';

    // Build new route block
    const newRouteBlock =
      routeBlock.substring(0, wpArrayStart) +
      newWaypointsStr +
      routeBlock.substring(wpArrayEnd);

    // Also update validated: false -> validated: true
    const finalRouteBlock = newRouteBlock.replace(
      /validated:\s*false/,
      'validated: true',
    );

    replacements.push({
      start: routeStart,
      end: routeEnd,
      newText: finalRouteBlock,
      routeId,
    });
  }

  // Sort replacements by position (descending) to apply from end to start
  replacements.sort((a, b) => b.start - a.start);

  // Apply replacements
  for (const rep of replacements) {
    content =
      content.substring(0, rep.start) +
      rep.newText +
      content.substring(rep.end);
    console.log(`  Updated ${rep.routeId}`);
  }

  // Update hub comments
  content = content.replace(
    /Hub 2 — Berkeley \(10 routes, pending validation\)/,
    'Hub 2 — Berkeley (10 routes, validated)',
  );
  content = content.replace(
    /Hub 3 — SF Marina \(10 routes, pending validation\)/,
    'Hub 3 — SF Marina (10 routes, validated)',
  );
  content = content.replace(
    /Hub 4 — South Beach \(10 routes, pending validation\)/,
    'Hub 4 — South Beach (10 routes, validated)',
  );
  content = content.replace(
    /Hub 5 — Tiburon \(8 routes, pending validation\)/,
    'Hub 5 — Tiburon (8 routes, validated)',
  );
  content = content.replace(
    /Hub 6 — Richmond \(8 routes, pending validation\)/,
    'Hub 6 — Richmond (8 routes, validated)',
  );

  // Write the updated file
  fs.writeFileSync(ROUTES_PATH, content);
  console.log(`\nUpdated ${replacements.length} routes in ${ROUTES_PATH}`);
}

main();
