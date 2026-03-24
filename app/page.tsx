'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { sfBay } from '@/data/cities/sf-bay';
import { activities, getActivity } from '@/data/activities';
import { useAppStore } from '@/store';
import { routeComfort, findAlternatives } from '@/engine/scoring';
import { Header } from './components/Header';
import { ScoreBadge, getScoreLabel } from './components/ScoreBadge';
import { WeekendForecast } from './components/WeekendForecast';
import { BoatSelector } from './components/BoatSelector';
import { SavedSpots } from './components/SavedSpots';
import type { ActivityType, ScoredRoute } from '@/engine/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type Step = 'activity' | 'when' | 'results';

export default function Home() {
  const { activity, month, hour, vessel, homeBaseId, setActivity, setMonth, setHour, setHomeBase } = useAppStore();
  const [step, setStep] = useState<Step>('activity');
  const [timeMode, setTimeMode] = useState<'weekend' | 'month'>('weekend');
  const [boatSelectorOpen, setBoatSelectorOpen] = useState(false);

  const currentActivity = getActivity(activity);
  const origin = sfBay.destinations.find((d) => d.id === homeBaseId) ?? sfBay.destinations[0];

  // Score all destinations (only compute when on results step)
  // Per-destination error handling: one failure doesn't blank everything
  const scoredRoutes = useMemo(() => {
    if (step !== 'results') return [];
    return sfBay.destinations
      .filter((d) => d.id !== origin.id && d.activityTags.includes(activity))
      .map((dest) => {
        try {
          const scored = routeComfort(origin, dest, month, hour, currentActivity, vessel, sfBay);
          const alts = scored.score < 7
            ? findAlternatives(origin, month, hour, currentActivity, vessel, sfBay, dest.id)
            : [];
          return {
            ...scored,
            alternatives: alts,
            dest,
          };
        } catch (e) {
          console.error(`Scoring error for ${dest.id}:`, e);
          return null;
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.score - a.score);
  }, [activity, month, hour, vessel, origin, currentActivity, step]);

  const top3 = scoredRoutes.slice(0, 3);
  const timeLabel = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center px-4 py-10">
        {/* Step 1: Activity */}
        {step === 'activity' && (
          <div className="max-w-lg w-full space-y-10 animate-in fade-in">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">
                What are you doing today?
              </h1>
              <p className="text-[var(--muted)]">
                Choose your activity — conditions score differently for each one
              </p>
            </div>

            <div className="space-y-3">
              {activities.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setActivity(a.id);
                    setStep('when');
                  }}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 text-left hover:border-reef-teal hover:bg-[var(--card-elevated)] transition-all group relative overflow-hidden"
                >
                  {/* Left accent border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-reef-teal/0 group-hover:bg-reef-teal transition-colors" />
                  <div className="flex items-center gap-4">
                    <span className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--card-elevated)] group-hover:bg-reef-teal/10 transition-colors shrink-0">
                      {a.icon}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-reef-teal transition-colors">
                        {a.name}
                      </h3>
                      <p className="text-sm text-[var(--muted)]">{a.description}</p>
                    </div>
                    <span className="text-[var(--muted)] group-hover:text-reef-teal group-hover:translate-x-1 transition-all text-lg">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: When */}
        {step === 'when' && (
          <div className="max-w-lg w-full space-y-10 animate-in fade-in">
            <button
              onClick={() => setStep('activity')}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ← Change activity
            </button>

            <div className="text-center space-y-2">
              <span className="text-3xl">{currentActivity.icon}</span>
              <h1 className="text-3xl font-bold tracking-tight">Plan Your Outing</h1>
              <p className="text-[var(--muted)]">
                Set your departure point and time
              </p>
            </div>

            {/* Home base selector */}
            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)]">Departing from</label>
              <select
                value={homeBaseId}
                onChange={(e) => setHomeBase(e.target.value)}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--foreground)] appearance-none cursor-pointer focus:border-compass-gold focus:outline-none"
              >
                {sfBay.destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.dockInfo}
                  </option>
                ))}
              </select>
            </div>

            {/* Vessel selector */}
            <BoatSelector
              collapsed={!boatSelectorOpen}
              onToggle={() => setBoatSelectorOpen((o) => !o)}
            />

            {/* Time mode toggle */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setTimeMode('weekend')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeMode === 'weekend'
                    ? 'bg-reef-teal text-white'
                    : 'bg-[var(--card)] text-[var(--secondary)] border border-[var(--border)]'
                }`}
              >
                This weekend
              </button>
              <button
                onClick={() => setTimeMode('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeMode === 'month'
                    ? 'bg-reef-teal text-white'
                    : 'bg-[var(--card)] text-[var(--secondary)] border border-[var(--border)]'
                }`}
              >
                Pick a month
              </button>
            </div>

            {/* Month selector */}
            {timeMode === 'month' && (
              <div className="flex flex-wrap gap-1.5 justify-center">
                {MONTHS.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setMonth(i)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      month === i
                        ? 'bg-compass-gold text-ocean-950'
                        : 'bg-[var(--card)] text-[var(--secondary)] border border-[var(--border)] hover:border-compass-gold'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {/* Time of day */}
            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)]">
                Time of day: <span className="text-[var(--foreground)] font-medium">{timeLabel}</span>
              </label>
              <input
                type="range"
                min={5}
                max={20}
                value={hour}
                onChange={(e) => setHour(parseInt(e.target.value))}
                className="w-full accent-compass-gold"
              />
              <div className="flex justify-between text-xs text-[var(--muted)]">
                <span>5 AM</span>
                <span>Noon</span>
                <span>8 PM</span>
              </div>
            </div>

            <button
              onClick={() => setStep('results')}
              className="w-full py-4 rounded-xl bg-reef-teal text-white font-semibold text-lg hover:bg-reef-teal/90 hover:shadow-lg hover:shadow-reef-teal/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Show me where to go
            </button>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 'results' && (
          <div className="max-w-2xl w-full space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('when')}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                ← Change time
              </button>
              <div className="text-sm text-[var(--muted)]">
                {currentActivity.icon} {currentActivity.name} · {MONTH_FULL[month]} · {timeLabel}
              </div>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {top3.length > 0 && top3[0].score >= 7
                  ? 'Great conditions today'
                  : top3.length > 0 && top3[0].score >= 4
                    ? 'Fair conditions — check alternatives'
                    : 'Tough conditions — consider waiting'}
              </h1>
              <p className="text-[var(--muted)]">
                From {origin.name} · {scoredRoutes.filter(r => r.score >= 7).length} of {scoredRoutes.length} destinations scoring 7+
              </p>
            </div>

            {/* Saved spots */}
            <SavedSpots />

            {/* Top recommendations */}
            <div className="space-y-4">
              {top3.map((route, i) => (
                <div
                  key={route.destinationId}
                  className={`bg-[var(--card)] border rounded-xl p-6 transition-all ${
                    i === 0 && route.score >= 7
                      ? 'border-reef-teal shadow-lg shadow-reef-teal/10'
                      : 'border-[var(--border)]'
                  }`}
                >
                  {i === 0 && route.score >= 7 && (
                    <div className="text-xs font-medium text-reef-teal mb-3 uppercase tracking-wider">
                      Top Pick
                    </div>
                  )}

                  <div className="flex items-start gap-5">
                    {/* Score badge — dominant element */}
                    <div className="shrink-0">
                      <ScoreBadge
                        score={route.score}
                        size={i === 0 ? 'lg' : 'lg'}
                        showRange={{ p10: route.scoreRange.p10, p90: route.scoreRange.p90 }}
                      />
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                      <div>
                        <h3 className="font-semibold text-lg">{route.dest.name}</h3>
                        <p className="text-sm text-[var(--muted)]">
                          {route.distance} mi · {route.transitMinutes} min ·{' '}
                          {route.fuelGallons !== null
                            ? `${route.fuelGallons} gal RT`
                            : 'paddle power'}
                        </p>
                      </div>

                      <p className="text-sm text-[var(--secondary)]">
                        {route.dest.dockInfo}
                      </p>

                      {/* Risk factors */}
                      {route.riskFactors.slice(0, 2).map((r, j) => (
                        <p
                          key={j}
                          className={`text-xs ${
                            r.severity === 'high' ? 'text-danger-red' : 'text-warning-amber'
                          }`}
                        >
                          ⚠ {r.description}
                        </p>
                      ))}

                      {route.variabilityWarning && (
                        <p className="text-xs text-warning-amber">
                          📊 {route.variabilityWarning}
                        </p>
                      )}
                    </div>

                    <div className="text-right text-xs text-[var(--muted)] space-y-1 shrink-0">
                      <div className="font-semibold text-[var(--foreground)]">
                        {getScoreLabel(route.score)}
                      </div>
                      <div>Wind: {route.riskFactors.length > 0 ? '⚠' : '✓'}</div>
                    </div>
                  </div>

                  {/* Where else? */}
                  {route.score < 7 && route.alternatives.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-[var(--border)] space-y-2">
                      <p className="text-xs font-medium text-reef-teal">
                        Better alternatives nearby:
                      </p>
                      {route.alternatives.map((alt) => (
                        <div
                          key={alt.destinationId}
                          className="flex items-center gap-2 bg-[var(--card-elevated)] rounded-lg p-3"
                        >
                          <ScoreBadge score={alt.score} size="sm" />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{alt.destinationName}</span>
                            <span className="text-xs text-[var(--muted)] ml-2">
                              {alt.distance} mi · {alt.transitMinutes} min
                            </span>
                          </div>
                          <span className="text-xs text-reef-teal">{alt.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Before You Go */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card-elevated)]">
                <h2 className="text-sm font-semibold text-reef-teal uppercase tracking-wider">
                  Before You Go — {currentActivity.name}
                </h2>
              </div>
              <div className="px-6 py-4 space-y-0">
                {currentActivity.beforeYouGo.map((item, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 py-3 cursor-pointer border-b border-[var(--border)] last:border-b-0 group"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-reef-teal shrink-0"
                    />
                    <span className="text-sm text-[var(--secondary)] group-hover:text-[var(--foreground)] transition-colors flex-1">
                      {item.text}
                    </span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-safety-blue text-xs hover:underline shrink-0"
                      >
                        Link →
                      </a>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Verify links */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-3">
              <h2 className="text-sm font-semibold text-reef-teal uppercase tracking-wider">
                Verify Conditions
              </h2>
              <p className="text-xs text-warning-amber">
                This is a planning tool based on historical patterns. Always check real-time conditions before departure.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {sfBay.verifyLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--card-elevated)] text-xs text-safety-blue hover:underline border border-[var(--border)]"
                  >
                    {link.label} →
                  </a>
                ))}
              </div>
            </div>

            {/* 7-Day Forecast */}
            <WeekendForecast />

            {/* Explore map CTA */}
            <div className="flex gap-3">
              <Link
                href="/explore"
                className="flex-1 block text-center py-4 rounded-xl border border-compass-gold text-compass-gold font-semibold hover:bg-compass-gold/10 hover:shadow-lg hover:shadow-compass-gold/10 transition-all"
              >
                Explore map →
              </Link>
              <Link
                href="/schedule"
                className="flex-1 block text-center py-4 rounded-xl border border-reef-teal text-reef-teal font-semibold hover:bg-reef-teal/10 hover:shadow-lg hover:shadow-reef-teal/10 transition-all"
              >
                Departure board →
              </Link>
            </div>

            {/* All destinations */}
            <details className="bg-[var(--card)] border border-[var(--border)] rounded-xl">
              <summary className="p-5 cursor-pointer text-sm font-medium text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors">
                All {scoredRoutes.length} destinations →
              </summary>
              <div className="px-5 pb-5 space-y-2">
                {scoredRoutes.slice(3).map((route) => (
                  <div
                    key={route.destinationId}
                    className={`flex items-center gap-3 py-2.5 ${
                      !route.inRange ? 'opacity-40' : ''
                    }`}
                  >
                    <ScoreBadge score={route.score} size="sm" />
                    <div className="flex-1">
                      <span className="text-sm">{route.dest.name}</span>
                      <span className="text-xs text-[var(--muted)] ml-2">
                        {route.distance} mi · {route.transitMinutes} min
                      </span>
                    </div>
                    {!route.inRange && (
                      <span className="text-xs text-danger-red">Out of range</span>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </main>
    </div>
  );
}
