import type {
  ActivityProfile,
  City,
  Destination,
  RiskFactor,
  ScoreRange,
  ScoredRoute,
  ScoredRouteAlternative,
  VesselProfile,
  Zone,
  ZoneConditions,
} from './types';
import { getTimeConditions } from './interpolation';
import { getRouteZones, transitTime, fuelRoundTrip, isInRange, draftClearance } from './routing';

// ============================================
// Activity Comfort Scoring
// The core algorithm that makes WhenToBoat work
// ============================================

/**
 * Score an activity's comfort for given conditions.
 * Returns 1-10 where 10 is perfect and 1 is dangerous/unusable.
 */
export function activityScore(
  activity: ActivityProfile,
  windKts: number,
  waveHtFt: number,
  periodS: number
): number {
  const [idealLow, idealHigh] = activity.idealWindRange;
  const maxWind = activity.maxWind;

  // Wind score: peak at ideal range center, drops off both sides
  let windScore: number;
  if (windKts >= idealLow && windKts <= idealHigh) {
    windScore = 10; // sweet spot
  } else if (windKts < idealLow) {
    windScore = Math.max(1, 10 - (idealLow - windKts) * 1.5); // too light
  } else if (windKts <= maxWind) {
    windScore = Math.max(2, 10 - (windKts - idealHigh) * 1.0); // getting gusty
  } else {
    windScore = 1; // over max — dangerous
  }

  // Wave score: 10 at 0, drops to 1 at maxWave
  const maxWave = activity.maxWave;
  let waveScore: number;
  if (waveHtFt <= maxWave) {
    waveScore = Math.round(10 - (waveHtFt / maxWave) * 7);
  } else {
    waveScore = Math.max(1, 3 - (waveHtFt - maxWave) * 2);
  }

  // Period adjust: short period = steep dangerous chop
  let periodAdjust = 0;
  if (activity.vesselType === 'powerboat' && periodS < 4 && waveHtFt > 1.5) {
    periodAdjust = -1; // short period chop is worse for powerboats
  }
  if (activity.vesselType === 'sailboat' && periodS > 6) {
    periodAdjust = 1; // long period swell is manageable for sailboats
  }
  if (activity.vesselType === 'kayak' && periodS < 3 && waveHtFt > 0.5) {
    periodAdjust = -2; // short period chop is extremely dangerous for kayaks
  }

  const raw = windScore * 0.5 + waveScore * 0.5 + periodAdjust;
  return Math.max(1, Math.min(10, Math.round(raw)));
}

/**
 * Wind-against-current interaction modifier.
 * When wind opposes current, wave heights can multiply dramatically.
 * This is safety-critical — the Potato Patch and Raccoon Strait are lethal in these conditions.
 */
export function windCurrentInteraction(
  windSpeedKts: number,
  windDirDeg: number,
  currentSpeedKts: number,
  currentDirDeg: number
): number {
  const angleDiff = Math.abs(windDirDeg - currentDirDeg);
  const normalizedAngle = angleDiff > 180 ? 360 - angleDiff : angleDiff;

  // Opposing = angle > 120 degrees
  const isOpposing = normalizedAngle > 120;

  if (!isOpposing || currentSpeedKts < 1.5 || windSpeedKts < 10) {
    return 1.0; // no significant interaction
  }

  // Severity scales with both current and wind speed
  const severity = (currentSpeedKts / 3) * (windSpeedKts / 15);
  return Math.min(3.0, 1.0 + severity);
}

/**
 * Vessel wave tolerance multiplier.
 * Bigger boats handle more waves. Smaller craft are more vulnerable.
 */
export function vesselWaveToleranceMultiplier(loa: number): number {
  // Baseline at 20ft. Every foot above adds 2.5% tolerance.
  return 1.0 + (loa - 20) * 0.025;
}

/**
 * Adjust wave height for vessel tolerance.
 * Returns the "effective" wave height that the vessel experiences.
 */
function effectiveWaveHeight(waveHtFt: number, vessel: VesselProfile): number {
  const multiplier = vesselWaveToleranceMultiplier(vessel.loa);
  // Bigger boat = lower effective wave height (waves feel smaller)
  return waveHtFt / multiplier;
}

/**
 * Generate a simple variability range from zone data.
 * In the full version this would come from 44 years of NDBC data.
 * For MVP, we estimate P10/P90 as ±30% of the median score.
 */
function estimateScoreRange(score: number): ScoreRange {
  const variance = Math.round(score * 0.3);
  return {
    p10: Math.max(1, score - variance - 1),
    p25: Math.max(1, score - Math.round(variance * 0.5)),
    p50: score,
    p75: Math.min(10, score + Math.round(variance * 0.5)),
    p90: Math.min(10, score + variance + 1),
  };
}

/**
 * Identify risk factors for a route based on zone conditions.
 */
function identifyRiskFactors(
  zones: Zone[],
  month: number,
  hour: number,
  activity: ActivityProfile
): RiskFactor[] {
  const risks: RiskFactor[] = [];

  for (const zone of zones) {
    const conditions = getTimeConditions(zone, hour, month);

    // Afternoon wind buildup warning
    if (hour < 12) {
      const pmConditions = zone.monthlyConditions[month]?.pm;
      if (pmConditions && pmConditions.windKts > activity.maxWind) {
        risks.push({
          factor: 'Afternoon wind buildup',
          severity: 'high',
          description: `${zone.name} typically builds from ${conditions.windKts} to ${pmConditions.windKts} kts between 10 AM and 2 PM. Plan your return before noon.`,
        });
      }
    }

    // High wave warning
    if (conditions.waveHtFt > activity.maxWave * 0.8) {
      risks.push({
        factor: 'Wave height near limit',
        severity: conditions.waveHtFt > activity.maxWave ? 'high' : 'medium',
        description: `${zone.name}: ${conditions.waveHtFt} ft waves (your limit: ${activity.maxWave} ft).`,
      });
    }

    // Short period steep chop
    if (conditions.wavePeriodS < 4 && conditions.waveHtFt > 1.0) {
      risks.push({
        factor: 'Steep, short-period chop',
        severity: 'medium',
        description: `${zone.name}: ${conditions.wavePeriodS}s wave period creates steep, closely-spaced waves that feel worse than the height suggests.`,
      });
    }
  }

  return risks;
}

/**
 * Generate a variability warning string for high-variance zones.
 */
function getVariabilityWarning(
  zones: Zone[],
  month: number
): string | null {
  for (const zone of zones) {
    const monthData = zone.monthlyConditions[month];
    if (!monthData) continue;

    const windDiff = monthData.pm.windKts - monthData.am.windKts;
    if (windDiff >= 10) {
      return `${zone.name} is highly variable. Wind can build from ${monthData.am.windKts} to ${monthData.pm.windKts} kts between morning and afternoon.`;
    }
  }
  return null;
}

/**
 * Score a complete route: origin → destination with all zones traversed.
 * Returns the full ScoredRoute with variability, risks, verify links, and alternatives.
 */
export function routeComfort(
  origin: Destination,
  destination: Destination,
  month: number,
  hour: number,
  activity: ActivityProfile,
  vessel: VesselProfile,
  city: City
): ScoredRoute {
  const zones = getRouteZones(origin, destination, city);
  const distanceKey = `${origin.id}-${destination.id}`;
  const distance = city.distances[distanceKey] ?? 0;
  const transit = transitTime(distance, vessel.cruiseSpeed);
  const fuel = fuelRoundTrip(distance, vessel.gph, vessel.cruiseSpeed);
  const rangeOk = isInRange(distance, vessel);
  const draft = draftClearance(destination, vessel);

  // Score each zone — route comfort = worst zone (bottleneck rule)
  let worstScore = 10;
  for (const zone of zones) {
    const conditions = getTimeConditions(zone, hour, month);
    const adjWaveHt = effectiveWaveHeight(conditions.waveHtFt, vessel);
    const score = activityScore(activity, conditions.windKts, adjWaveHt, conditions.wavePeriodS);
    if (score < worstScore) {
      worstScore = score;
    }
  }

  const scoreRange = estimateScoreRange(worstScore);
  const riskFactors = identifyRiskFactors(zones, month, hour, activity);
  const variabilityWarning = getVariabilityWarning(zones, month);

  // Collect verify links from all traversed zones
  const verifyLinks = zones.flatMap(z => {
    // Look up zone verify links from city data
    const cityVerify = city.verifyLinks || [];
    return cityVerify;
  });

  return {
    originId: origin.id,
    destinationId: destination.id,
    score: worstScore,
    scoreRange,
    distance,
    transitMinutes: transit,
    fuelGallons: fuel,
    inRange: rangeOk,
    draftClear: draft.clear,
    draftWarning: draft.warning ?? null,
    variabilityWarning,
    riskFactors,
    verifyLinks,
    beforeYouGo: activity.beforeYouGo,
    alternatives: [], // filled by findAlternatives
  };
}

/**
 * Find the best alternative destinations when the primary choice scores low.
 * Returns top 2 alternatives scoring >= 6, sorted by score descending.
 */
export function findAlternatives(
  origin: Destination,
  month: number,
  hour: number,
  activity: ActivityProfile,
  vessel: VesselProfile,
  city: City,
  excludeId: string
): ScoredRouteAlternative[] {
  const candidates: ScoredRouteAlternative[] = [];

  for (const dest of city.destinations) {
    if (dest.id === origin.id || dest.id === excludeId) continue;
    if (!dest.activityTags.includes(activity.id)) continue;

    const scored = routeComfort(origin, dest, month, hour, activity, vessel, city);
    if (scored.score >= 6 && scored.inRange) {
      candidates.push({
        destinationId: dest.id,
        destinationName: dest.name,
        score: scored.score,
        distance: scored.distance,
        transitMinutes: scored.transitMinutes,
        reason: getAlternativeReason(dest, scored.score),
      });
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

function getAlternativeReason(dest: Destination, score: number): string {
  if (score >= 9) return `${dest.name} is in excellent conditions right now`;
  if (score >= 7) return `${dest.name} is sheltered and comfortable`;
  return `${dest.name} has better conditions than your selection`;
}
