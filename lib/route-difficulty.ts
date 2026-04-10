/**
 * Route difficulty prediction — combines vessel capability, route characteristics,
 * and seasonal conditions into a 1-5 difficulty rating per route.
 *
 * Unlike routeComfort (which answers "can I do this trip?"), difficulty answers
 * "how hard will this trip feel?" by factoring in environmental conditions for
 * the selected month and time of day.
 */

import { sfBay } from '@/data/cities/sf-bay';
import { zones } from '@/data/cities/sf-bay/zones';
import { verifiedRoutes } from '@/data/cities/sf-bay/verified-routes';
import type { ActivityProfile, VesselProfile } from '@/engine/types';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface DifficultyRating {
  level: DifficultyLevel;
  label: string;
  /** One-line explanation of the primary difficulty driver */
  reason: string;
  /** Color token for display */
  color: string;
}

const LABELS: Record<DifficultyLevel, { label: string; color: string }> = {
  1: { label: 'Easy',       color: '#10b981' }, // green
  2: { label: 'Moderate',   color: '#14b8a6' }, // teal
  3: { label: 'Challenging', color: '#f59e0b' }, // amber
  4: { label: 'Difficult',  color: '#ef4444' }, // red
  5: { label: 'Expert Only', color: '#dc2626' }, // dark red
};

/**
 * Predict difficulty for a route given vessel, activity, and time context.
 *
 * Factors (each contributes 0-1 normalized score, then combined):
 * 1. Range pressure — how much of your vessel's practical limits this route uses
 * 2. Zone exposure — wind/wave severity for the destination zone this month
 * 3. Current risk — does route cross high-current zones?
 * 4. TSS complexity — shipping lane crossing (huge factor for small craft)
 * 5. Draft margin — how tight is depth clearance?
 * 6. Open water exposure — sheltered vs. exposed zones
 */
export function routeDifficulty(
  distanceMi: number,
  destId: string,
  vessel: VesselProfile,
  activity: ActivityProfile,
  month: number,
  hour: number,
): DifficultyRating {
  const dest = sfBay.destinations.find(d => d.id === destId);
  const zone = dest ? zones.find(z => z.id === dest.zone) : null;
  const vr = verifiedRoutes.find(r =>
    (r.from === destId || r.to === destId)
  );

  // Use afternoon conditions as the "typical" challenge (mornings are always calmer)
  const isAM = hour < 12;
  const monthConditions = zone?.monthlyConditions.find(mc => mc.month === month);
  const conditions = isAM ? monthConditions?.am : monthConditions?.pm;

  let totalScore = 0; // 0 = trivial, higher = harder
  let primaryReason = '';
  let worstFactor = 0;

  const setWorst = (score: number, reason: string) => {
    if (score > worstFactor) {
      worstFactor = score;
      primaryReason = reason;
    }
  };

  // ── 1. Range pressure (0-2) ──────────────────────────────────────────
  if (activity.maxRangeRoundTripMi != null) {
    const fraction = (distanceMi * 2) / activity.maxRangeRoundTripMi;
    const rangeScore = fraction > 0.8 ? 2 : fraction > 0.6 ? 1.5 : fraction > 0.4 ? 1 : fraction > 0.25 ? 0.5 : 0;
    totalScore += rangeScore;
    if (rangeScore >= 1.5) setWorst(rangeScore, `Uses ${Math.round(fraction * 100)}% of your round-trip range`);
  } else if (vessel.fuelCapacity && vessel.gph && vessel.cruiseSpeed > 0) {
    const fuelRT = (distanceMi * 2 / vessel.cruiseSpeed) * vessel.gph;
    const fraction = fuelRT / vessel.fuelCapacity;
    const fuelScore = fraction > 0.7 ? 2 : fraction > 0.5 ? 1.5 : fraction > 0.3 ? 0.5 : 0;
    totalScore += fuelScore;
    if (fuelScore >= 1.5) setWorst(fuelScore, `Uses ${Math.round(fraction * 100)}% of your fuel`);
  } else {
    // Unlimited range — use pure distance
    const distScore = distanceMi > 30 ? 1.5 : distanceMi > 15 ? 1 : distanceMi > 8 ? 0.5 : 0;
    totalScore += distScore;
    if (distScore >= 1) setWorst(distScore, `${distanceMi} mi is a long crossing`);
  }

  // ── 2. Zone exposure — wind and waves for this month (0-3) ──────────
  if (conditions) {
    const windScore = (() => {
      const w = conditions.windKts;
      const maxOk = activity.maxWind;
      const ratio = w / maxOk;
      if (ratio > 0.9) return 3;
      if (ratio > 0.7) return 2;
      if (ratio > 0.5) return 1;
      if (ratio > 0.3) return 0.5;
      return 0;
    })();

    const waveScore = (() => {
      const w = conditions.waveHtFt;
      const max = activity.maxWave;
      const ratio = w / max;
      if (ratio > 0.9) return 2;
      if (ratio > 0.6) return 1.5;
      if (ratio > 0.3) return 0.5;
      return 0;
    })();

    const envScore = Math.max(windScore, waveScore);
    totalScore += envScore;
    if (windScore > waveScore && windScore >= 1.5) {
      setWorst(envScore, `${conditions.windKts} kt wind typical for ${zone?.name ?? 'this area'}`);
    } else if (waveScore >= 1.5) {
      setWorst(envScore, `${conditions.waveHtFt} ft waves typical for ${zone?.name ?? 'this area'}`);
    }
  }

  // ── 3. Current risk (0-2) ───────────────────────────────────────────
  const highCurrentZones = ['central_bay', 'north_bay'];
  const isHighCurrent = dest && highCurrentZones.includes(dest.zone);
  if (isHighCurrent) {
    const currentScore = (activity.vesselType === 'kayak' || activity.vesselType === 'sup') ? 2 : 0.5;
    totalScore += currentScore;
    if (currentScore >= 1.5) setWorst(currentScore, 'Strong tidal currents in this area');
  }

  // ── 4. TSS complexity (0-2) ─────────────────────────────────────────
  if (vr?.crossesTss) {
    const tssScore = (activity.vesselType === 'kayak' || activity.vesselType === 'sup') ? 2 : 1;
    totalScore += tssScore;
    if (tssScore >= 1.5) setWorst(tssScore, 'Crosses shipping lanes');
  }

  // ── 5. Draft margin (0-1) ──────────────────────────────────────────
  if (dest?.minDepth != null && vessel.draft > 0) {
    const clearance = dest.minDepth - vessel.draft;
    if (clearance < 1) {
      totalScore += 1;
      setWorst(1, `Only ${clearance.toFixed(1)} ft clearance at low tide`);
    } else if (clearance < 2) {
      totalScore += 0.5;
    }
  }

  // ── 6. Zone exposure character (0-1) ────────────────────────────────
  const exposedZones = ['central_bay', 'san_pablo'];
  if (dest && exposedZones.includes(dest.zone)) {
    const exposureScore = (activity.vesselType === 'kayak' || activity.vesselType === 'sup') ? 1 : 0.3;
    totalScore += exposureScore;
    if (exposureScore >= 0.8 && worstFactor < 1) setWorst(exposureScore, 'Exposed open water');
  }

  // ── Map total to 1-5 level ─────────────────────────────────────────
  // Max possible ~11, but typical range is 0-8
  const level: DifficultyLevel =
    totalScore <= 1   ? 1 :
    totalScore <= 2.5 ? 2 :
    totalScore <= 4.5 ? 3 :
    totalScore <= 6.5 ? 4 : 5;

  const info = LABELS[level];

  if (!primaryReason) {
    primaryReason = level <= 2 ? 'Good conditions for your vessel' : 'Multiple factors increase difficulty';
  }

  return {
    level,
    label: info.label,
    reason: primaryReason,
    color: info.color,
  };
}
