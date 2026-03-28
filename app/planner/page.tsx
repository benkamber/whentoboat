'use client';

import React, { useMemo, useState } from 'react';
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
  const vessel = { loa: act.vesselType === 'powerboat' ? 24 : act.vesselType === 'sailboat' ? 30 : 14 };
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

  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  function handleMonthClick(month: number) {
    // Toggle expansion instead of navigating away
    setExpandedMonth(expandedMonth === month ? null : month);
  }

  function handleGoToMonth(month: number) {
    setMonth(month);
    setActivity(selectedActivity);
    router.push('/');
  }

  function getGoodDaysIndicator(goodDays: number, totalDays: number) {
    const ratio = goodDays / totalDays;
    if (ratio >= 0.6) return { color: 'text-reef-teal', icon: '●' };
    if (ratio >= 0.3) return { color: 'text-compass-gold', icon: '●' };
    return { color: 'text-danger-red', icon: '●' };
  }

  // Compute weekly risk factors for the expanded month
  const weeklyData = useMemo(() => {
    if (expandedMonth === null) return null;
    const act = getActivity(selectedActivity);
    const origin = sfBay.destinations.find(d => d.id === selectedOrigin);
    if (!origin) return null;

    // 4 weeks per month: early, mid-early, mid-late, late
    const weeks = [
      { label: `Week 1 (1st–7th)`, hours: [7, 9, 11, 14] },
      { label: `Week 2 (8th–14th)`, hours: [7, 9, 11, 14] },
      { label: `Week 3 (15th–21st)`, hours: [7, 9, 11, 14] },
      { label: `Week 4 (22nd–${DAYS_IN_MONTH[expandedMonth]}th)`, hours: [7, 9, 11, 14] },
    ];

    return weeks.map(week => {
      // Compute scores at different times of day
      const timeScores = week.hours.map(h => {
        const zone = sfBay.zones.find(z => z.id === origin.zone);
        if (!zone) return { hour: h, score: 5, wind: 0, wave: 0 };
        const cond = getTimeConditions(zone, h, expandedMonth);
        const wm = vesselWaveToleranceMultiplier(act.vesselType === 'powerboat' ? 24 : act.vesselType === 'sailboat' ? 30 : 14);
        const s = activityScore(act, cond.windKts, cond.waveHtFt / wm, cond.wavePeriodS);
        return { hour: h, score: s, wind: cond.windKts, wave: cond.waveHtFt };
      });

      // Identify the primary risk
      const worstTime = timeScores.reduce((w, t) => t.score < w.score ? t : w, timeScores[0]);
      let primaryRisk = 'Conditions look good';
      if (worstTime.wind > 15) primaryRisk = `Strong afternoon wind (${worstTime.wind}kt)`;
      else if (worstTime.wave > 2) primaryRisk = `Rough chop (${worstTime.wave}ft waves)`;
      else if (worstTime.wind > 10) primaryRisk = `Moderate wind (${worstTime.wind}kt)`;
      else if (worstTime.wave > 1) primaryRisk = `Light chop (${worstTime.wave}ft)`;

      const bestScore = Math.max(...timeScores.map(t => t.score));
      const worstScore = Math.min(...timeScores.map(t => t.score));

      return {
        label: week.label,
        bestScore,
        worstScore,
        amScore: timeScores.find(t => t.hour === 9)?.score ?? 5,
        pmScore: timeScores.find(t => t.hour === 14)?.score ?? 5,
        primaryRisk,
        timeScores,
      };
    });
  }, [expandedMonth, selectedActivity, selectedOrigin]);

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
              <React.Fragment key={m.month}>
              <button
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

                {expandedMonth === m.month && (
                  <div className="text-[10px] text-reef-teal mt-2 text-center font-medium">
                    Click to collapse
                  </div>
                )}
              </button>

              {/* Weekly risk breakdown — shown when month is expanded */}
              {expandedMonth === m.month && weeklyData && (
                <div className="col-span-full border border-[var(--border)] rounded-xl bg-[var(--card-elevated)] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{m.name} — Weekly Risk Breakdown</h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleGoToMonth(m.month); }}
                      className="text-xs text-reef-teal hover:underline"
                    >
                      View on map →
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--muted)]">Based on historical averages for {getActivity(selectedActivity).name}</p>

                  <div className="space-y-2">
                    {weeklyData.map((week, wi) => (
                      <div key={wi} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                        <div className="w-20 shrink-0">
                          <span className="text-xs font-medium">{week.label.split('(')[0]}</span>
                          <span className="text-[10px] text-[var(--muted)] block">{week.label.match(/\(.*\)/)?.[0]}</span>
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <div className="text-center">
                            <span className="text-[9px] text-[var(--muted)] block">AM</span>
                            <ScoreBadge score={week.amScore} size="sm" />
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] text-[var(--muted)] block">PM</span>
                            <ScoreBadge score={week.pmScore} size="sm" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs ${week.worstScore <= 3 ? 'text-danger-red' : week.worstScore <= 5 ? 'text-compass-gold' : 'text-[var(--muted)]'}`}>
                            {week.primaryRisk}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </React.Fragment>
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
