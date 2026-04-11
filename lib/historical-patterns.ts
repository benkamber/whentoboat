/**
 * Generate plain-language historical pattern insights for location pages.
 * Uses existing zone monthly conditions data to produce unique, indexable
 * SEO content that no real-time-only competitor can replicate.
 */

import { zones } from '@/data/cities/sf-bay/zones';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export interface LocationInsight {
  title: string;
  text: string;
  severity: 'good' | 'neutral' | 'caution';
}

export function getHistoricalInsights(zoneId: string): LocationInsight[] {
  const zone = zones.find(z => z.id === zoneId);
  if (!zone) return [];

  const insights: LocationInsight[] = [];
  const mc = zone.monthlyConditions;

  // Find calmest and roughest months
  const amComforts = mc.map((m, i) => ({ month: i, comfort: m.am.comfort }));
  const pmComforts = mc.map((m, i) => ({ month: i, comfort: m.pm.comfort }));
  const bestAM = amComforts.sort((a, b) => b.comfort - a.comfort)[0];
  const worstPM = pmComforts.sort((a, b) => a.comfort - b.comfort)[0];

  insights.push({
    title: 'Best time to visit',
    text: `${MONTH_NAMES[bestAM.month]} mornings offer the calmest conditions in ${zone.name}, with winds typically ${mc[bestAM.month].am.windKts} knots and waves under ${mc[bestAM.month].am.waveHtFt} ft.`,
    severity: 'good',
  });

  // Afternoon wind pattern
  const summerPM = [4, 5, 6].map(m => mc[m].pm.windKts); // May-Jul PM
  const avgSummerPM = Math.round(summerPM.reduce((a, b) => a + b, 0) / summerPM.length);
  const fallPM = [8, 9].map(m => mc[m].pm.windKts); // Sep-Oct PM
  const avgFallPM = Math.round(fallPM.reduce((a, b) => a + b, 0) / fallPM.length);

  if (avgSummerPM > 12) {
    insights.push({
      title: 'Summer afternoon winds',
      text: `Summer afternoons (May-July) bring ${avgSummerPM} knot winds on average to ${zone.name}. Morning departures before 11 AM are strongly recommended for kayakers and SUP paddlers. Fall afternoons (Sep-Oct) are much calmer at ${avgFallPM} knots.`,
      severity: 'caution',
    });
  }

  // Wave patterns
  const maxWavePM = Math.max(...mc.map(m => m.pm.waveHtFt));
  const maxWaveMonth = mc.findIndex(m => m.pm.waveHtFt === maxWavePM);
  if (maxWavePM > 1.5) {
    insights.push({
      title: 'Roughest conditions',
      text: `${MONTH_NAMES[maxWaveMonth]} afternoons see the highest waves in ${zone.name} — up to ${maxWavePM} ft with ${mc[maxWaveMonth].pm.windKts} knot winds. ${maxWavePM > 3 ? 'Not suitable for kayaks or SUP during these conditions.' : 'Manageable for powerboats but uncomfortable for small craft.'}`,
      severity: 'caution',
    });
  }

  // Morning vs afternoon spread
  const julAM = mc[6].am.windKts;
  const julPM = mc[6].pm.windKts;
  if (julPM > julAM * 2) {
    insights.push({
      title: 'Morning vs afternoon',
      text: `In ${zone.name}, afternoon winds are typically ${Math.round(julPM / julAM)}x stronger than mornings. A July morning at ${julAM} knots builds to ${julPM} knots by mid-afternoon. This pattern is driven by the Bay's thermal "slot" wind — cool ocean air pulled through the Golden Gate as the Central Valley heats.`,
      severity: 'neutral',
    });
  }

  // Calm season
  const calmMonths = mc
    .map((m, i) => ({ month: i, amComfort: m.am.comfort, pmComfort: m.pm.comfort }))
    .filter(m => m.amComfort >= 8 && m.pmComfort >= 7);
  if (calmMonths.length > 0) {
    const monthNames = calmMonths.map(m => MONTH_NAMES[m.month]).join(' and ');
    insights.push({
      title: 'Golden window',
      text: `${monthNames} ${calmMonths.length === 1 ? 'is' : 'are'} the golden window for ${zone.name} — comfortable conditions all day, including afternoons. This is when the Bay's thermal wind pattern weakens, creating the calmest sustained conditions of the year.`,
      severity: 'good',
    });
  }

  return insights;
}

/** Get a one-paragraph summary for a zone, suitable for meta descriptions */
export function getZoneSummary(zoneId: string): string {
  const zone = zones.find(z => z.id === zoneId);
  if (!zone) return '';

  const mc = zone.monthlyConditions;
  const bestMonth = mc.map((m, i) => ({ month: i, c: m.am.comfort })).sort((a, b) => b.c - a.c)[0];
  const worstPM = mc.map((m, i) => ({ month: i, w: m.pm.windKts })).sort((a, b) => b.w - a.w)[0];

  return `${zone.name}: ${zone.characteristics} Best conditions in ${MONTH_NAMES[bestMonth.month]} (comfort ${mc[bestMonth.month].am.comfort}/10 mornings). Strongest winds in ${MONTH_NAMES[worstPM.month]} afternoons (${worstPM.w} kt). Morning departures recommended year-round.`;
}
