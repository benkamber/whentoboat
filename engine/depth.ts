// ============================================
// Depth / Draft Validation Engine
// Checks vessel draft clearance against zone depth data
// ============================================

import type { VesselProfile } from './types';
import { zoneDepths, type ZoneDepth } from '@/data/geo/sf-bay-depths';

/** Safety margin above the vessel's draft, in feet */
const SAFETY_MARGIN_FT = 1.5;

export interface ZoneClearance {
  zoneId: string;
  minDepthFt: number;
  vesselDraftFt: number;
  tideFt: number;
  effectiveDepthFt: number; // minDepthFt + tideFt (tide adds water)
  clearanceFt: number; // effectiveDepthFt - vesselDraftFt
  safe: boolean; // clearanceFt >= SAFETY_MARGIN_FT
  warning?: string;
}

/**
 * Check if a vessel can safely navigate through a zone at current tide.
 *
 * @param vessel - The vessel profile (includes draft)
 * @param zoneId - The zone to check
 * @param currentTideFt - Height above MLLW (positive = higher water = more clearance)
 * @returns Safety assessment with clearance details
 */
export function canNavigateZone(
  vessel: VesselProfile,
  zoneId: string,
  currentTideFt: number = 0,
): {
  safe: boolean;
  minDepth: number;
  actualClearance: number;
  warning?: string;
} {
  const zone = zoneDepths.find((z) => z.zoneId === zoneId);

  if (!zone) {
    // Unknown zone — assume safe but warn
    return {
      safe: true,
      minDepth: -1,
      actualClearance: -1,
      warning: `Unknown zone "${zoneId}" — depth data not available`,
    };
  }

  // Effective depth = charted minimum depth (MLLW) + current tide height
  // A positive tide adds water above MLLW, giving more clearance
  // A negative tide (rare, below MLLW) reduces clearance
  const effectiveDepth = zone.minDepthFt + currentTideFt;
  const clearance = effectiveDepth - vessel.draft;
  const safe = clearance >= SAFETY_MARGIN_FT;

  let warning: string | undefined;

  if (!safe) {
    warning = `Insufficient depth in ${zoneId}: ${effectiveDepth.toFixed(1)}ft effective depth vs ${vessel.draft}ft draft (${vessel.name}). Need ${SAFETY_MARGIN_FT}ft safety margin. Clearance: ${clearance.toFixed(1)}ft.`;
  } else if (clearance < SAFETY_MARGIN_FT + 2) {
    // Marginal clearance — warn even though technically safe
    warning = `Marginal depth in ${zoneId}: only ${clearance.toFixed(1)}ft clearance for ${vessel.name} (${vessel.draft}ft draft). ${zone.shallowAreas.length > 0 ? 'Avoid: ' + zone.shallowAreas[0] : ''}`;
  }

  return { safe, minDepth: zone.minDepthFt, actualClearance: clearance, warning };
}

/**
 * Check if a route (defined by zone IDs traversed) is navigable for a given vessel.
 *
 * @param zoneIds - Ordered list of zone IDs the route passes through
 * @param vessel - The vessel profile
 * @param currentTideFt - Height above MLLW
 * @returns Overall navigability assessment with per-zone details
 */
export function routeDepthCheck(
  zoneIds: string[],
  vessel: VesselProfile,
  currentTideFt: number = 0,
): {
  navigable: boolean;
  zones: ZoneClearance[];
  warnings: string[];
} {
  // De-duplicate zone IDs while preserving order
  const uniqueZones: string[] = [];
  for (const id of zoneIds) {
    if (!uniqueZones.includes(id)) {
      uniqueZones.push(id);
    }
  }

  const zones: ZoneClearance[] = [];
  const warnings: string[] = [];
  let navigable = true;

  for (const zoneId of uniqueZones) {
    const zone = zoneDepths.find((z) => z.zoneId === zoneId);
    const minDepthFt = zone?.minDepthFt ?? -1;
    const effectiveDepthFt = minDepthFt >= 0 ? minDepthFt + currentTideFt : -1;
    const clearanceFt =
      effectiveDepthFt >= 0 ? effectiveDepthFt - vessel.draft : -1;
    const safe = clearanceFt < 0 || clearanceFt >= SAFETY_MARGIN_FT; // -1 = unknown, assume safe

    const zc: ZoneClearance = {
      zoneId,
      minDepthFt,
      vesselDraftFt: vessel.draft,
      tideFt: currentTideFt,
      effectiveDepthFt,
      clearanceFt,
      safe,
    };

    if (!safe) {
      navigable = false;
      const msg = `UNSAFE: ${zoneId} — ${effectiveDepthFt.toFixed(1)}ft depth vs ${vessel.draft}ft draft (${clearanceFt.toFixed(1)}ft clearance, need ${SAFETY_MARGIN_FT}ft)`;
      zc.warning = msg;
      warnings.push(msg);
    } else if (clearanceFt >= 0 && clearanceFt < SAFETY_MARGIN_FT + 2) {
      const msg = `MARGINAL: ${zoneId} — only ${clearanceFt.toFixed(1)}ft clearance for ${vessel.name}`;
      zc.warning = msg;
      warnings.push(msg);
    }

    if (zone && zone.shallowAreas.length > 0 && clearanceFt >= 0 && clearanceFt < 5) {
      warnings.push(
        `Shallow areas in ${zoneId}: ${zone.shallowAreas.join('; ')}`,
      );
    }

    zones.push(zc);
  }

  return { navigable, zones, warnings };
}
