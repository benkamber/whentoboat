import type {
  ActivityProfile,
  City,
  Destination,
  HourlyScore,
  MonthlyScore,
  RiskFactor,
  ScoreRange,
  TimeWindow,
  TrajectoryAnalysis,
  TrajectoryLeg,
  VesselProfile,
} from './types';
import { getTimeConditions } from './interpolation';
import { getRouteZones, transitTime, fuelRoundTrip, isInRange, draftClearance } from './routing';
import { fullConditionsScore, buildFullConditions, findAlternatives, haversineDistanceMi } from './scoring';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatHour(h: number): string {
  if (h === 0 || h === 24) return '12:00 AM';
  if (h === 12) return '12:00 PM';
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}

/**
 * Score a zone using the FULL conditions scorer (not just wind/wave).
 * This ensures trajectory scores match main page scores — no divergence.
 */
function scoreZone(
  zone: { id: string; name: string; characteristics: string; monthlyConditions: any[] },
  hour: number,
  month: number,
  activity: ActivityProfile,
  vessel: VesselProfile
): { score: number; factors: RiskFactor[] } {
  const zoneConditions = getTimeConditions(zone as any, hour, month);
  const fullConds = buildFullConditions(zoneConditions, month, hour, { zoneId: zone.id });
  return fullConditionsScore(activity, fullConds, vessel);
}

/**
 * Full trajectory analysis for a route.
 * This is the core data that powers the trajectory panel.
 *
 * IMPORTANT: Uses fullConditionsScore() for ALL scoring — not activityScore().
 * This ensures trajectory scores account for fog, current, temperature, zone
 * restrictions, and ocean caps — matching the scores shown on the main page.
 */
export function analyzeTrajectory(
  origin: Destination,
  destination: Destination,
  month: number,
  hour: number,
  activity: ActivityProfile,
  vessel: VesselProfile,
  city: City
): TrajectoryAnalysis {
  const zones = getRouteZones(origin, destination, city);
  const distanceKey = `${origin.id}-${destination.id}`;
  const matrixDistance = city.distances[distanceKey];
  // Fallback to Haversine estimate when distance matrix is missing an entry
  const distance = matrixDistance ?? haversineDistanceMi(origin.lat, origin.lng, destination.lat, destination.lng);
  const transit = transitTime(distance, vessel.cruiseSpeed);
  const fuel = fuelRoundTrip(distance, vessel.gph, vessel.cruiseSpeed);
  const rangeOk = isInRange(distance, vessel);
  const draft = draftClearance(destination, vessel);

  // Build legs with per-zone scoring using FULL conditions scorer
  let allRiskFactors: RiskFactor[] = [];
  const legs: TrajectoryLeg[] = zones.map((zone) => {
    const conditions = getTimeConditions(zone, hour, month);
    const { score, factors } = scoreZone(zone, hour, month, activity, vessel);
    allRiskFactors = allRiskFactors.concat(factors);

    return {
      zone,
      distanceInZone: distance / zones.length, // approximate equal split
      wind: conditions.windKts,
      waveHeight: conditions.waveHtFt,
      wavePeriod: conditions.wavePeriodS,
      score,
      isBottleneck: false, // set below
    };
  });

  // Mark bottleneck
  const minScore = Math.min(...legs.map((l) => l.score));
  for (const leg of legs) {
    if (leg.score === minScore) {
      leg.isBottleneck = true;
      break; // only mark first bottleneck
    }
  }

  // Hourly profile: score at every hour 5 AM – 10 PM using full scorer
  const hourlyProfile: HourlyScore[] = [];
  for (let h = 5; h <= 22; h++) {
    let worstScore = 10;
    let worstWind = 0;
    let worstWave = 0;
    for (const zone of zones) {
      const cond = getTimeConditions(zone, h, month);
      const { score } = scoreZone(zone, h, month, activity, vessel);
      if (score < worstScore) {
        worstScore = score;
        worstWind = cond.windKts;
        worstWave = cond.waveHtFt;
      }
    }
    hourlyProfile.push({
      hour: h,
      score: worstScore,
      wind: worstWind,
      waveHeight: worstWave,
      label: formatHour(h),
    });
  }

  // Monthly profile: score for each month at the current hour using full scorer
  const monthlyProfile: MonthlyScore[] = [];
  for (let m = 0; m < 12; m++) {
    let amWorst = 10;
    let pmWorst = 10;
    for (const zone of zones) {
      const { score: amScore } = scoreZone(zone, 9, m, activity, vessel);
      const { score: pmScore } = scoreZone(zone, 14, m, activity, vessel);
      if (amScore < amWorst) amWorst = amScore;
      if (pmScore < pmWorst) pmWorst = pmScore;
    }
    monthlyProfile.push({
      month: m,
      amScore: amWorst,
      pmScore: pmWorst,
      bestScore: Math.max(amWorst, pmWorst),
      label: MONTHS_SHORT[m],
    });
  }

  // Departure and return windows
  const departureWindow = findBestWindow(hourlyProfile, 5, 13);
  const returnWindow = findBestWindow(hourlyProfile, 12, 22);

  // Warnings
  const warnings: string[] = [];
  if (!rangeOk) {
    warnings.push(`Out of range for ${vessel.name}. Round trip exceeds fuel/endurance capacity.`);
  }
  if (!draft.clear) {
    warnings.push(draft.warning ?? `Draft ${vessel.draft}ft may exceed depth at ${destination.name}.`);
  }
  for (const leg of legs) {
    if (leg.isBottleneck && leg.score <= 4) {
      warnings.push(
        `${leg.zone.name} is the bottleneck: wind ${leg.wind} kts, waves ${leg.waveHeight} ft. Score ${leg.score}/10.`
      );
    }
  }
  // Afternoon buildup warning
  const amBest = hourlyProfile.find((h) => h.hour === 9)?.score ?? 5;
  const pmWorstScore = hourlyProfile.find((h) => h.hour === 14)?.score ?? 5;
  if (amBest - pmWorstScore >= 4) {
    warnings.push(
      `Conditions deteriorate significantly by afternoon (${amBest}/10 → ${pmWorstScore}/10). Plan your return before noon.`
    );
  }

  // Score range
  const scores = hourlyProfile.map((h) => h.score);
  const scoreRange: ScoreRange = {
    p10: Math.max(1, Math.min(...scores)),
    p25: Math.max(1, percentile(scores, 25)),
    p50: minScore,
    p75: Math.min(10, percentile(scores, 75)),
    p90: Math.min(10, Math.max(...scores)),
  };

  // Verify links from traversed zones
  const verifyLinks = city.verifyLinks;

  // Deduplicate risk factors by name
  const seenFactors = new Set<string>();
  const riskFactors = allRiskFactors.filter(f => {
    if (seenFactors.has(f.factor)) return false;
    seenFactors.add(f.factor);
    return true;
  });

  // Alternatives
  const alternatives = minScore < 7
    ? findAlternatives(origin, month, hour, activity, vessel, city, destination.id)
    : [];

  return {
    origin,
    destination,
    distance,
    legs,
    overallScore: minScore,
    scoreRange,
    transitMinutes: transit,
    fuelGallons: fuel,
    inRange: rangeOk,
    departureWindow,
    returnWindow,
    hourlyProfile,
    monthlyProfile,
    warnings,
    riskFactors,
    verifyLinks,
    beforeYouGo: activity.beforeYouGo,
    alternatives,
  };
}

function findBestWindow(hourly: HourlyScore[], fromHour: number, toHour: number): TimeWindow {
  const range = hourly.filter((h) => h.hour >= fromHour && h.hour <= toHour);
  if (range.length === 0) return { start: fromHour, end: toHour, label: `${formatHour(fromHour)} – ${formatHour(toHour)}` };

  // Find the longest contiguous stretch of score >= 6
  let bestStart = range[0].hour;
  let bestEnd = range[0].hour;
  let currentStart = range[0].hour;
  let bestLen = 0;

  for (let i = 0; i < range.length; i++) {
    if (range[i].score >= 6) {
      if (i === 0 || range[i - 1].score < 6) currentStart = range[i].hour;
      const len = range[i].hour - currentStart + 1;
      if (len > bestLen) {
        bestLen = len;
        bestStart = currentStart;
        bestEnd = range[i].hour;
      }
    }
  }

  return {
    start: bestStart,
    end: bestEnd,
    label: `${formatHour(bestStart)} – ${formatHour(bestEnd)}`,
  };
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}
