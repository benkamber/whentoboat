/**
 * Recommendation Engine
 *
 * Two modes:
 * 1. "I want to [activity]" → best destinations ranked
 * 2. "What should I do?" → best activity + destination for current conditions
 */

import type {
  ActivityProfile,
  ActivityType,
  City,
  Destination,
  VesselProfile,
  ScoredRoute,
} from './types';
import { routeComfort, findAlternatives } from './scoring';
import { getActivity } from '@/data/activities';
import { activities } from '@/data/activities';
import { vesselPresets } from '@/data/vessels';
import { getScoreLabel } from '@/app/components/ScoreBadge';

export interface ActivityRecommendation {
  activity: ActivityProfile;
  vessel: VesselProfile;
  bestDestination: {
    destination: Destination;
    score: number;
    distance: number;
    transitMinutes: number;
  };
  topDestinations: {
    destination: Destination;
    score: number;
    distance: number;
    transitMinutes: number;
    reason: string;
  }[];
  overallScore: number; // how good conditions are for this activity overall
  summary: string; // "Great day for kayaking — 8 destinations scoring 7+"
  whyThisActivity: string; // "Light winds (5kt) and calm water (0.3ft) are perfect for paddling"
}

/**
 * Given current conditions, recommend the BEST activity and where to do it.
 * Scores every activity at every destination and returns ranked recommendations.
 */
export function recommendActivities(
  origin: Destination,
  month: number,
  hour: number,
  city: City
): ActivityRecommendation[] {
  const recommendations: ActivityRecommendation[] = [];

  for (const activity of activities) {
    // Get the matching vessel preset
    const vesselMap: Record<string, string> = {
      kayak: 'kayak',
      sup: 'sup',
      powerboat_cruise: 'powerboat',
      casual_sail: 'sailboat',
    };
    const vessel = vesselPresets.find(v => v.type === vesselMap[activity.id]) ?? vesselPresets[0];

    // Score all destinations for this activity
    const scored: {
      destination: Destination;
      score: number;
      distance: number;
      transitMinutes: number;
    }[] = [];

    for (const dest of city.destinations) {
      if (dest.id === origin.id) continue;
      if (!dest.activityTags.includes(activity.id)) continue;

      try {
        const result = routeComfort(origin, dest, month, hour, activity, vessel, city);
        scored.push({
          destination: dest,
          score: result.score,
          distance: result.distance,
          transitMinutes: result.transitMinutes,
        });
      } catch {
        // Skip failing routes
      }
    }

    if (scored.length === 0) continue;

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    const goodCount = scored.filter(s => s.score >= 7).length;
    const avgScore = Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length);

    // Generate human-readable summaries
    const summary = generateSummary(activity, goodCount, scored.length, avgScore);
    const whyThis = generateWhyThisActivity(activity, best.score, month, hour);

    recommendations.push({
      activity,
      vessel,
      bestDestination: best,
      topDestinations: scored.slice(0, 3).map(s => ({
        ...s,
        reason: getDestinationReason(s.destination, s.score, activity),
      })),
      overallScore: avgScore,
      summary,
      whyThisActivity: whyThis,
    });
  }

  // Sort by overall score — best activity first
  recommendations.sort((a, b) => b.overallScore - a.overallScore);

  return recommendations;
}

/**
 * For a specific activity, get ranked destinations with explanations.
 */
export function recommendDestinations(
  activity: ActivityProfile,
  origin: Destination,
  month: number,
  hour: number,
  vessel: VesselProfile,
  city: City
): {
  destination: Destination;
  score: number;
  scoreLabel: string;
  distance: number;
  transitMinutes: number;
  reason: string;
  warnings: string[];
}[] {
  const results: ReturnType<typeof recommendDestinations> = [];

  for (const dest of city.destinations) {
    if (dest.id === origin.id) continue;
    if (!dest.activityTags.includes(activity.id)) continue;

    try {
      const scored = routeComfort(origin, dest, month, hour, activity, vessel, city);
      results.push({
        destination: dest,
        score: scored.score,
        scoreLabel: getScoreLabel(scored.score),
        distance: scored.distance,
        transitMinutes: scored.transitMinutes,
        reason: getDestinationReason(dest, scored.score, activity),
        warnings: scored.riskFactors
          .filter(r => r.severity === 'high')
          .map(r => r.description),
      });
    } catch {
      // Skip
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// --- Helpers ---

function generateSummary(
  activity: ActivityProfile,
  goodCount: number,
  totalCount: number,
  avgScore: number
): string {
  if (avgScore >= 8) {
    return `Excellent day for ${activity.name.toLowerCase()} — ${goodCount} destinations with great conditions`;
  }
  if (avgScore >= 6) {
    return `Good conditions for ${activity.name.toLowerCase()} — ${goodCount} of ${totalCount} destinations scoring 7+`;
  }
  if (avgScore >= 4) {
    return `Fair conditions for ${activity.name.toLowerCase()} — check specific destinations for best spots`;
  }
  return `Tough conditions for ${activity.name.toLowerCase()} — consider a different activity or time`;
}

function generateWhyThisActivity(
  activity: ActivityProfile,
  bestScore: number,
  month: number,
  hour: number
): string {
  const [idealLow, idealHigh] = activity.idealWindRange;

  switch (activity.id) {
    case 'kayak':
      if (bestScore >= 8) return 'Light winds and calm water — ideal for paddling';
      if (bestScore >= 6) return 'Moderate conditions — experienced paddlers will enjoy it';
      return 'Conditions are challenging for kayaking — consider waiting';

    case 'sup':
      if (bestScore >= 8) return 'Flat water and light breeze — perfect SUP conditions';
      if (bestScore >= 6) return 'Some wind but manageable near shore';
      return 'Too much wind or chop for comfortable SUP';

    case 'powerboat_cruise':
      if (bestScore >= 8) return 'Calm seas and comfortable ride — bring the family';
      if (bestScore >= 6) return 'Some chop but manageable — passengers should be prepared';
      return 'Rough conditions — consider postponing or staying in sheltered waters';

    case 'casual_sail':
      if (bestScore >= 8) return `${idealLow}-${idealHigh}kt winds — perfect sailing breeze`;
      if (bestScore >= 6) return 'Decent wind but may be gusty — reef early';
      if (bestScore <= 3) return 'Too little wind to sail, or too much for casual crew';
      return 'Variable conditions — check specific routes';

    default:
      return '';
  }
}

function getDestinationReason(
  dest: Destination,
  score: number,
  activity: ActivityProfile
): string {
  if (score >= 9) return `${dest.name} has excellent conditions for ${activity.name.toLowerCase()}`;
  if (score >= 7) return `${dest.name} — good conditions, sheltered from the worst of it`;
  if (score >= 5) return `${dest.name} — fair conditions, keep an eye on the weather`;
  if (score >= 3) return `${dest.name} — marginal conditions, experienced only`;
  return `${dest.name} — not recommended right now`;
}

// getScoreLabel imported from ScoreBadge — single source of truth for safety-critical labels
