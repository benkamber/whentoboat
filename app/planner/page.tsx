'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sfBay } from '@/data/cities/sf-bay';
import { activities, getActivity } from '@/data/activities';
import { activityScore, vesselWaveToleranceMultiplier } from '@/engine/scoring';
import { getTimeConditions } from '@/engine/interpolation';
import { useAppStore } from '@/store';
import { Header } from '../components/Header';
import { ScoreBadge, getScoreColor } from '../components/ScoreBadge';
import type { ActivityType, Destination, Zone } from '@/engine/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_THEMES: Record<number, string> = {
  0: 'Storm window sailing',
  1: 'Late winter calm days',
  2: 'Spring awakening',
  3: 'Morning magic',
  4: 'Fog and wind, but the mornings...',
  5: 'Peak wind season begins',
  6: 'The great divide',
  7: 'The turn',
  8: 'Go everywhere',
  9: 'Second summer',
  10: 'Last call',
  11: 'Cozy season',
};

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Departure points: destinations that have launch ramps or are common home bases
const DEPARTURE_POINTS = sfBay.destinations.filter(
  (d) => d.launchRamp || ['sau', 'aqp', 'fbg', 'brk', 'p39'].includes(d.id)
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MonthCardData {
  month: number;
  name: string;
  theme: string;
  avgScore: number;
  goodDays: number;
  bestDestination: { name: string; score: number } | null;
  isBestMonth: boolean;
}

function computeMonthData(
  month: number,
  activityId: ActivityType,
  originId: string
): MonthCardData {
  const act = getActivity(activityId);
  const origin = sfBay.destinations.find((d) => d.id === originId);
  const vessel = { loa: act.vesselType === 'powerboat' ? 24 : act.vesselType === 'sailboat' ? 30 : 14 } as { loa: number };
  const waveMultiplier = vesselWaveToleranceMultiplier(vessel.loa);

  // Compute AM score for every reachable destination from origin
  const reachableDestinations = sfBay.destinations.filter(
    (d) => d.id !== originId && d.activityTags.includes(activityId)
  );

  let totalScore = 0;
  let destCount = 0;
  let bestDest: { name: string; score: number } | null = null;

  for (const dest of reachableDestinations) {
    // Get zones for this route
    const zoneIds = new Set<string>();
    zoneIds.add(origin?.zone ?? 'richardson');
    zoneIds.add(dest.zone);

    // Check routing rules for transit zones
    for (const rule of sfBay.routingRules) {
      const oArea = origin?.area ?? 'marin';
      const oZone = origin?.zone ?? 'richardson';
      const originInFrom = rule.fromAreas.includes(oArea) || rule.fromAreas.includes(oZone);
      const destInTo = rule.toAreas.includes(dest.area) || rule.toAreas.includes(dest.zone);
      const originInTo = rule.toAreas.includes(oArea) || rule.toAreas.includes(oZone);
      const destInFrom = rule.fromAreas.includes(dest.area) || rule.fromAreas.includes(dest.zone);
      if ((originInFrom && destInTo) || (originInTo && destInFrom)) {
        for (const tz of rule.transitZones) zoneIds.add(tz);
      }
    }

    const zones: Zone[] = Array.from(zoneIds)
      .map((id) => sfBay.zones.find((z) => z.id === id))
      .filter((z): z is Zone => z !== undefined);

    // Compute AM score (bottleneck rule)
    let worstScore = 10;
    for (const zone of zones) {
      const cond = getTimeConditions(zone, 9, month);
      const adjWave = cond.waveHtFt / waveMultiplier;
      const s = activityScore(act, cond.windKts, adjWave, cond.wavePeriodS);
      if (s < worstScore) worstScore = s;
    }

    totalScore += worstScore;
    destCount++;

    if (!bestDest || worstScore > bestDest.score) {
      bestDest = { name: dest.name, score: worstScore };
    }
  }

  const avgScore = destCount > 0 ? Math.round((totalScore / destCount) * 10) / 10 : 5;

  // Estimate good days: % of destinations with score >= 7, applied to days in month
  const goodDestRatio = destCount > 0
    ? reachableDestinations.filter((dest) => {
        const zoneIds = new Set<string>();
        zoneIds.add(origin?.zone ?? 'richardson');
        zoneIds.add(dest.zone);
        const zones: Zone[] = Array.from(zoneIds)
          .map((id) => sfBay.zones.find((z) => z.id === id))
          .filter((z): z is Zone => z !== undefined);
        let worst = 10;
        for (const zone of zones) {
          const cond = getTimeConditions(zone, 9, month);
          const adjWave = cond.waveHtFt / waveMultiplier;
          const s = activityScore(act, cond.windKts, adjWave, cond.wavePeriodS);
          if (s < worst) worst = s;
        }
        return worst >= 7;
      }).length / destCount
    : 0;

  const goodDays = Math.round(goodDestRatio * DAYS_IN_MONTH[month]);

  return {
    month,
    name: MONTH_NAMES[month],
    theme: MONTH_THEMES[month],
    avgScore,
    goodDays,
    bestDestination: bestDest,
    isBestMonth: false, // set after computing all months
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlannerPage() {
  const router = useRouter();
  const { activity: storeActivity, homeBaseId, setMonth, setActivity } = useAppStore();

  const [selectedActivity, setSelectedActivity] = useState<ActivityType>(storeActivity);
  const [selectedOrigin, setSelectedOrigin] = useState<string>(homeBaseId);

  const monthData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) =>
      computeMonthData(i, selectedActivity, selectedOrigin)
    );

    // Mark the best month
    let bestIdx = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i].avgScore > data[bestIdx].avgScore) bestIdx = i;
    }
    data[bestIdx].isBestMonth = true;

    return data;
  }, [selectedActivity, selectedOrigin]);

  function handleMonthClick(month: number) {
    setMonth(month);
    setActivity(selectedActivity);
    router.push('/');
  }

  function getGoodDaysIndicator(goodDays: number, totalDays: number) {
    const ratio = goodDays / totalDays;
    if (ratio >= 0.6) return { color: 'text-green-500', icon: '●' };
    if (ratio >= 0.3) return { color: 'text-yellow-500', icon: '●' };
    return { color: 'text-red-400', icon: '●' };
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Year Planner</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            When should you go? See boating conditions across all 12 months.
          </p>
        </div>

        {/* Activity selector */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
              Activity
            </label>
            <div className="flex gap-1.5">
              {activities.map((act) => (
                <button
                  key={act.id}
                  onClick={() => setSelectedActivity(act.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedActivity === act.id
                      ? 'bg-compass-gold text-black'
                      : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
                  }`}
                >
                  {act.icon} {act.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
              Departing from
            </label>
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              className="block w-full sm:w-56 px-3 py-1.5 rounded-lg text-sm bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-compass-gold"
            >
              {DEPARTURE_POINTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Month cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {monthData.map((m) => {
            const indicator = getGoodDaysIndicator(m.goodDays, DAYS_IN_MONTH[m.month]);
            return (
              <button
                key={m.month}
                onClick={() => handleMonthClick(m.month)}
                className={`relative text-left p-4 rounded-xl border transition-all hover:shadow-lg hover:scale-[1.02] ${
                  m.isBestMonth
                    ? 'border-compass-gold/50 bg-compass-gold/5 ring-1 ring-compass-gold/30'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted)]'
                }`}
              >
                {m.isBestMonth && (
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-compass-gold text-black text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Best month
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-[var(--foreground)]">
                      {m.name}
                    </h3>
                    <p className="text-xs text-[var(--muted)] italic mt-0.5">
                      &ldquo;{m.theme}&rdquo;
                    </p>
                  </div>
                  <ScoreBadge score={Math.round(m.avgScore)} size="md" />
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm ${indicator.color}`}>{indicator.icon}</span>
                    <span className="text-sm text-[var(--secondary)]">
                      {m.goodDays} good days
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      (score 7+)
                    </span>
                  </div>

                  {m.bestDestination && (
                    <div className="text-xs text-[var(--muted)]">
                      Best:{' '}
                      <span className="text-[var(--secondary)] font-medium">
                        {m.bestDestination.name}
                      </span>
                      <span className="ml-1" style={{ color: getScoreColor(m.bestDestination.score) }}>
                        ({m.bestDestination.score}/10)
                      </span>
                    </div>
                  )}
                </div>

                {/* Score bar */}
                <div className="mt-3 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(m.avgScore / 10) * 100}%`,
                      backgroundColor: getScoreColor(m.avgScore),
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend / footer */}
        <div className="text-center text-xs text-[var(--muted)] pb-6 space-y-1">
          <p>Scores based on AM conditions (9 AM departure). Click any month to view detailed day-level conditions.</p>
          <p>
            <span className="text-green-500">●</span> 60%+ good days{' '}
            <span className="ml-2 text-yellow-500">●</span> 30-60% good days{' '}
            <span className="ml-2 text-red-400">●</span> &lt;30% good days
          </p>
        </div>
      </main>
    </div>
  );
}
