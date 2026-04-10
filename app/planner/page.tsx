'use client';

import React, { useState, useMemo } from 'react';
import { seasonalPlanning } from '@/data/cities/sf-bay/seasonal-planning';
import type { MonthlyPlan, ZoneConditions } from '@/data/cities/sf-bay/seasonal-planning';
import { activities } from '@/data/activities';
import { useAppStore } from '@/store';
import { Header } from '../components/Header';
import { WeatherCharts } from '../components/WeatherCharts';
import { SourceAttribution } from '../components/SourceAttribution';
import type { ActivityType } from '@/engine/types';

// ---------------------------------------------------------------------------
// Zone display names (keyed to seasonal-planning zone IDs)
// ---------------------------------------------------------------------------

const ZONE_NAMES: Record<string, string> = {
  richardson: 'Richardson Bay',
  central_bay: 'The Slot',
  sf_shore: 'SF Waterfront',
  east_bay: 'East Bay',
  north_bay: 'North Bay',
  san_pablo: 'San Pablo Bay',
  south_bay: 'South Bay',
};

const ZONE_ORDER = [
  'richardson',
  'central_bay',
  'sf_shore',
  'east_bay',
  'north_bay',
  'san_pablo',
  'south_bay',
];

// ---------------------------------------------------------------------------
// Activity mapping: seasonal data uses free-text activity names;
// map store activity IDs to match strings for highlighting.
// ---------------------------------------------------------------------------

const ACTIVITY_MATCH: Record<ActivityType, string[]> = {
  kayak: ['kayak'],
  sup: ['sup'],
  powerboat_cruise: ['powerboat'],
  casual_sail: ['sail'],
};

function activityMatchesPlan(actId: ActivityType, planActivity: string): boolean {
  const lower = planActivity.toLowerCase();
  return ACTIVITY_MATCH[actId].some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// Helpers for zone card tinting — values are parsed from free-text strings
// and mapped to severity tiers so users can eyeball comfort at a glance.
// ---------------------------------------------------------------------------

type Severity = 'calm' | 'mild' | 'moderate' | 'fresh' | 'rough';

// Tailwind text colors per severity (ordered from safe → dangerous)
const SEVERITY_TEXT: Record<Severity, string> = {
  calm:     'text-emerald-400',
  mild:     'text-teal-300',
  moderate: 'text-[var(--secondary)]',
  fresh:    'text-amber-400',
  rough:    'text-red-400',
};

// Card background tint by severity — intentionally faint so text pops
const SEVERITY_TINT: Record<Severity, string> = {
  calm:     'bg-emerald-500/5 border-emerald-500/20',
  mild:     'bg-teal-500/5 border-teal-500/20',
  moderate: 'bg-[var(--card)] border-[var(--border)]',
  fresh:    'bg-amber-500/10 border-amber-500/30',
  rough:    'bg-red-500/10 border-red-500/30',
};

// Severity ordering for comparison
const SEVERITY_RANK: Record<Severity, number> = {
  calm: 0, mild: 1, moderate: 2, fresh: 3, rough: 4,
};

function worseOf(a: Severity, b: Severity): Severity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/** Extract the upper end of a numeric range from strings like "8-12 kt W" or "< 1 ft" or "0-5 kt variable". */
function upperNumber(s: string): number | null {
  const nums = s.match(/\d+(\.\d+)?/g);
  if (!nums || nums.length === 0) return null;
  return parseFloat(nums[nums.length > 1 ? 1 : 0]);
}

function windSeverity(wind: string): Severity {
  const upper = upperNumber(wind);
  if (upper == null) return 'moderate';
  if (upper <= 6) return 'calm';
  if (upper <= 12) return 'mild';
  if (upper <= 18) return 'moderate';
  if (upper <= 25) return 'fresh';
  return 'rough';
}

function waveSeverity(wave: string): Severity {
  // Handles "< 1 ft", "1-2 ft", "2-4 ft @ 9-14s swell"
  if (/^\s*<\s*1/.test(wave)) return 'calm';
  const upper = upperNumber(wave);
  if (upper == null) return 'moderate';
  if (upper <= 1) return 'calm';
  if (upper <= 2) return 'mild';
  if (upper <= 3) return 'moderate';
  if (upper <= 5) return 'fresh';
  return 'rough';
}

function tempSeverity(tempF: number): Severity {
  // Cold water is dangerous for immersion. Warmer = safer.
  if (tempF < 50) return 'rough';
  if (tempF < 55) return 'fresh';
  if (tempF < 60) return 'moderate';
  if (tempF < 65) return 'mild';
  return 'calm';
}

function fogSeverity(fog: string): Severity {
  const f = fog.trim().toLowerCase();
  if (f === 'low') return 'calm';
  if (f === 'medium') return 'mild';
  if (f === 'high') return 'fresh';
  if (f === 'very high') return 'rough';
  return 'moderate';
}

function currentSeverity(current: string): Severity {
  // Handles "Golden Gate: 5.5 kt", "Raccoon: 3 kt", "Carquinez: 5 kt (freshet)"
  const upper = upperNumber(current);
  if (upper == null) return 'moderate';
  if (upper < 1) return 'calm';
  if (upper < 2) return 'mild';
  if (upper < 3) return 'moderate';
  if (upper < 4) return 'fresh';
  return 'rough';
}

/**
 * Overall card severity = worst of the individual signals.
 * Morning wind isn't factored in because it's almost always calm on the Bay.
 */
function overallSeverity(zc: ZoneConditions): Severity {
  return [
    windSeverity(zc.afternoonWind),
    waveSeverity(zc.waveHeight),
    tempSeverity(zc.waterTempF),
    fogSeverity(zc.fogProbability),
    currentSeverity(zc.currentStrength),
  ].reduce<Severity>((acc, s) => worseOf(acc, s), 'calm');
}

// ---------------------------------------------------------------------------
// Determine month card style based on selected activity
// ---------------------------------------------------------------------------

type MonthTier = 'best' | 'worst' | 'neutral';

function getMonthTier(
  monthPlan: MonthlyPlan,
  activityId: ActivityType,
  bestMonthNames: string[]
): MonthTier {
  if (bestMonthNames.includes(monthPlan.month)) return 'best';

  // Check if this activity appears in worstActivities
  const isWorst = monthPlan.worstActivities.some((wa) => {
    const lower = wa.toLowerCase();
    // "All" means worst for everything
    if (lower.startsWith('all')) return true;
    return activityMatchesPlan(activityId, wa);
  });
  if (isWorst) return 'worst';

  return 'neutral';
}

function tierBorderClass(tier: MonthTier): string {
  switch (tier) {
    case 'best':
      return 'border-reef-teal/60 ring-1 ring-reef-teal/30';
    case 'worst':
      return 'border-warning-amber/50 ring-1 ring-warning-amber/20';
    case 'neutral':
      return 'border-[var(--border)]';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlannerPage() {
  const { activity: storeActivity, setActivity } = useAppStore();
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>(storeActivity);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  // Determine best months for the selected activity
  const bestMonthNames = useMemo(() => {
    const key = selectedActivity === 'powerboat_cruise'
      ? 'powerboat'
      : selectedActivity === 'casual_sail'
        ? 'sailing'
        : selectedActivity;
    return (seasonalPlanning.bestMonths as Record<string, string[]>)[key] ?? [];
  }, [selectedActivity]);

  const worstMonthNames = seasonalPlanning.worstMonths.months;

  function handleActivityChange(actId: ActivityType) {
    setSelectedActivity(actId);
    setActivity(actId);
  }

  function toggleMonth(index: number) {
    setExpandedMonth(expandedMonth === index ? null : index);
  }

  // Selected activity display name
  const activityName = activities.find((a) => a.id === selectedActivity)?.name ?? selectedActivity;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Activity selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
            Activity
          </label>
          <div className="flex flex-wrap gap-1.5">
            {activities.map((act) => (
              <button
                key={act.id}
                onClick={() => handleActivityChange(act.id)}
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

        {/* Weather pattern charts */}
        <WeatherCharts />

        {/* Best / Worst months summary */}
        <div className="space-y-4">
          {/* Best months */}
          {bestMonthNames.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Best Months for {activityName}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {bestMonthNames.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      const idx = seasonalPlanning.months.findIndex((mp) => mp.month === m);
                      if (idx >= 0) toggleMonth(idx);
                    }}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-reef-teal/15 text-reef-teal border border-reef-teal/30 hover:bg-reef-teal/25 transition-colors"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Worst months */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--secondary)]">Worst Months</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {worstMonthNames.map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-amber/10 text-warning-amber border border-warning-amber/25"
                >
                  {m}
                </span>
              ))}
              <span className="text-xs text-[var(--muted)] ml-1">
                &mdash; {seasonalPlanning.worstMonths.why}
              </span>
            </div>
          </div>

          {/* Season pattern */}
          <p className="text-xs text-[var(--muted)]">
            <span className="font-medium text-[var(--secondary)]">Season:</span>{' '}
            Opens {seasonalPlanning.seasonPatterns.opening.split(':')[0]}, closes{' '}
            {seasonalPlanning.seasonPatterns.closing.split(':')[0]}
          </p>
        </div>

        {/* 12-month calendar grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seasonalPlanning.months.map((mp, idx) => {
            const tier = getMonthTier(mp, selectedActivity, bestMonthNames);
            const isExpanded = expandedMonth === idx;

            return (
              <React.Fragment key={mp.month}>
                {/* Month card */}
                <button
                  onClick={() => toggleMonth(idx)}
                  className={`relative text-left p-4 rounded-xl border transition-all hover:shadow-lg hover:scale-[1.01] bg-[var(--card)] ${tierBorderClass(tier)} ${
                    isExpanded ? 'ring-2 ring-reef-teal/40' : ''
                  }`}
                >
                  {/* Best badge */}
                  {tier === 'best' && (
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-reef-teal text-white text-2xs font-bold rounded-full uppercase tracking-wider">
                      Best for {activityName}
                    </div>
                  )}

                  <h3 className="text-base font-bold text-[var(--foreground)]">
                    {mp.month}
                  </h3>

                  {/* Best activities line */}
                  {mp.bestActivities.length > 0 && (
                    <p className="text-xs text-reef-teal mt-1">
                      Best for: {mp.bestActivities.join(', ')}
                    </p>
                  )}

                  {/* Top hazard */}
                  {mp.hazards.length > 0 && (
                    <p className="text-xs text-warning-amber mt-1 truncate">
                      {mp.hazards[0]}
                    </p>
                  )}

                  {/* Season markers (collapsed) */}
                  {mp.seasonMarkers.length > 0 && (
                    <p className="text-2xs text-[var(--muted)] mt-1 truncate">
                      {mp.seasonMarkers[0]}
                    </p>
                  )}

                  <div className="text-2xs text-[var(--muted)] mt-2 text-right">
                    {isExpanded ? 'Click to collapse' : 'Click to expand'}
                  </div>
                </button>

                {/* Expanded detail — takes full row width */}
                {isExpanded && (
                  <div className="col-span-full border border-[var(--border)] rounded-xl bg-[var(--card-elevated)] p-4 space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="text-lg font-bold text-[var(--foreground)]">
                        {mp.month}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {mp.seasonMarkers.map((sm, si) => (
                          <span
                            key={si}
                            className="px-2 py-0.5 rounded-full bg-compass-gold/15 text-compass-gold border border-compass-gold/25 font-medium"
                          >
                            {sm}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Activities & hazards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {mp.bestActivities.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-reef-teal uppercase tracking-wider">
                            Best Activities
                          </span>
                          <ul className="mt-1 space-y-0.5">
                            {mp.bestActivities.map((ba, bi) => (
                              <li key={bi} className="text-sm text-[var(--secondary)]">
                                {ba}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {mp.worstActivities.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-warning-amber uppercase tracking-wider">
                            Avoid
                          </span>
                          <ul className="mt-1 space-y-0.5">
                            {mp.worstActivities.map((wa, wi) => (
                              <li key={wi} className="text-sm text-[var(--secondary)]">
                                {wa}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* All hazards */}
                    {mp.hazards.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-warning-amber uppercase tracking-wider">
                          Hazards
                        </span>
                        <ul className="mt-1 space-y-0.5">
                          {mp.hazards.map((h, hi) => (
                            <li key={hi} className="text-sm text-[var(--secondary)]">
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Zone conditions grid */}
                    <div>
                      <h4 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">
                        Zone Conditions
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {ZONE_ORDER.map((zoneId) => {
                          const zc = mp.zones[zoneId];
                          if (!zc) return null;

                          const amSev = windSeverity(zc.morningWind);
                          const pmSev = windSeverity(zc.afternoonWind);
                          const waveSev = waveSeverity(zc.waveHeight);
                          const tempSev = tempSeverity(zc.waterTempF);
                          const fogSev = fogSeverity(zc.fogProbability);
                          const currSev = currentSeverity(zc.currentStrength);
                          const cardSev = overallSeverity(zc);

                          return (
                            <div
                              key={zoneId}
                              className={`rounded-lg border p-3 space-y-1.5 ${SEVERITY_TINT[cardSev]}`}
                            >
                              <h5 className="text-sm font-semibold text-[var(--foreground)]">
                                {ZONE_NAMES[zoneId] ?? zoneId}
                              </h5>

                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                <div>
                                  <span className="text-[var(--muted)]">AM:</span>{' '}
                                  <span className={SEVERITY_TEXT[amSev]}>{zc.morningWind}</span>
                                </div>
                                <div>
                                  <span className="text-[var(--muted)]">PM:</span>{' '}
                                  <span className={SEVERITY_TEXT[pmSev]}>{zc.afternoonWind}</span>
                                </div>
                                <div>
                                  <span className="text-[var(--muted)]">Waves:</span>{' '}
                                  <span className={SEVERITY_TEXT[waveSev]}>{zc.waveHeight}</span>
                                </div>
                                <div>
                                  <span className="text-[var(--muted)]">Water:</span>{' '}
                                  <span className={SEVERITY_TEXT[tempSev]}>{zc.waterTempF}&deg;F</span>
                                </div>
                                <div>
                                  <span className="text-[var(--muted)]">Fog:</span>{' '}
                                  <span className={SEVERITY_TEXT[fogSev]}>{zc.fogProbability}</span>
                                </div>
                                <div>
                                  <span className="text-[var(--muted)]">Current:</span>{' '}
                                  <span className={SEVERITY_TEXT[currSev]}>{zc.currentStrength}</span>
                                </div>
                              </div>

                              <div className="border-t border-[var(--border)]/50 pt-1.5">
                                <p className="text-2xs text-[var(--muted)] leading-relaxed">
                                  {zc.planningSummary}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sources */}
                    <div className="border-t border-[var(--border)] pt-3">
                      <h4 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">
                        Sources
                      </h4>
                      <SourceAttribution sources={mp.sources} />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--muted)] pb-6 space-y-1">
          <p>Based on historical monthly averages. Conditions vary day to day &mdash; always check the forecast.</p>
          <p>
            Planning tool only &mdash; verify with{' '}
            <a href="https://www.weather.gov/mtr/" target="_blank" rel="noopener noreferrer" className="text-safety-blue hover:underline">
              NWS
            </a>{' '}
            and{' '}
            <a href="https://www.ndbc.noaa.gov/" target="_blank" rel="noopener noreferrer" className="text-safety-blue hover:underline">
              NOAA NDBC
            </a>{' '}
            before departure.
          </p>
        </div>
      </main>
    </div>
  );
}
