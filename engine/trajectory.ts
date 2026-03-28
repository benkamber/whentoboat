import type {
  ActivityProfile,
  City,
  Destination,
  HourlyScore,
  MonthlyScore,
  ScoreRange,
  TimeWindow,
  TrajectoryAnalysis,
  TrajectoryLeg,
  VesselProfile,
} from './types';
import { getTimeConditions } from './interpolation';
import { getRouteZones, transitTime, fuelRoundTrip, isInRange, draftClearance } from './routing';
import { activityScore, vesselWaveToleranceMultiplier, findAlternatives } from './scoring';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatHour(h: number): string {
  if (h === 0 || h === 24) return '12:00 AM';
  if (h === 12) return '12:00 PM';
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}

function effectiveWaveHeight(waveHtFt: number, vessel: VesselProfile): number {
  const multiplier = vesselWaveToleranceMultiplier(vessel.loa, vessel.hullType);
  return waveHtFt / multiplier;
}

/**
 * Full trajectory analysis for a route.
 * This is the core data that powers the trajectory panel.
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
  const distance = city.distances[distanceKey] ?? 0;
  const transit = transitTime(distance, vessel.cruiseSpeed);
  const fuel = fuelRoundTrip(distance, vessel.gph, vessel.cruiseSpeed);
  const rangeOk = isInRange(distance, vessel);
  const draft = draftClearance(destination, vessel);

  // Build legs with per-zone scoring
  const legs: TrajectoryLeg[] = zones.map((zone) => {
    const conditions = getTimeConditions(zone, hour, month);
    const adjWave = effectiveWaveHeight(conditions.waveHtFt, vessel);
    const score = activityScore(activity, conditions.windKts, adjWave, conditions.wavePeriodS);

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

  // Hourly profile: score at every hour 5 AM – 10 PM
  const hourlyProfile: HourlyScore[] = [];
  for (let h = 5; h <= 22; h++) {
    let worstScore = 10;
    let worstWind = 0;
    let worstWave = 0;
    for (const zone of zones) {
      const cond = getTimeConditions(zone, h, month);
      const adjWave = effectiveWaveHeight(cond.waveHtFt, vessel);
      const s = activityScore(activity, cond.windKts, adjWave, cond.wavePeriodS);
      if (s < worstScore) {
        worstScore = s;
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

  // Monthly profile: score for each month at the current hour
  const monthlyProfile: MonthlyScore[] = [];
  for (let m = 0; m < 12; m++) {
    let amWorst = 10;
    let pmWorst = 10;
    for (const zone of zones) {
      const amCond = getTimeConditions(zone, 9, m);
      const pmCond = getTimeConditions(zone, 14, m);
      const amAdj = effectiveWaveHeight(amCond.waveHtFt, vessel);
      const pmAdj = effectiveWaveHeight(pmCond.waveHtFt, vessel);
      const amScore = activityScore(activity, amCond.windKts, amAdj, amCond.wavePeriodS);
      const pmScore = activityScore(activity, pmCond.windKts, pmAdj, pmCond.wavePeriodS);
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
  const pmWorst = hourlyProfile.find((h) => h.hour === 14)?.score ?? 5;
  if (amBest - pmWorst >= 4) {
    warnings.push(
      `Conditions deteriorate significantly by afternoon (${amBest}/10 → ${pmWorst}/10). Plan your return before noon.`
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
    riskFactors: [],
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
