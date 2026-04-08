'use client';

import { notFound } from 'next/navigation';
import { sfBay } from '@/data/cities/sf-bay';
import { activities, getActivity } from '@/data/activities';
import { vesselPresets, getVesselPreset } from '@/data/vessels';
import { activityScore } from '@/engine/scoring';
import { routeComfort, findAlternatives } from '@/engine/scoring';
import { getRouteZones, transitTime, fuelRoundTrip, isInRange } from '@/engine/routing';
import { getTimeConditions } from '@/engine/interpolation';
import { useAppStore } from '@/store';
import type { ActivityType, ScoredRoute } from '@/engine/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SCORE_BG: Record<number, string> = {
  1: 'bg-score-1', 2: 'bg-score-2', 3: 'bg-score-3', 4: 'bg-score-4',
  5: 'bg-score-5', 6: 'bg-score-6', 7: 'bg-score-7', 8: 'bg-score-8',
  9: 'bg-score-9', 10: 'bg-score-10',
};

function ScoreBadge({ score }: { score: number }) {
  const clamped = Math.max(1, Math.min(10, score));
  return (
    <div className={`${SCORE_BG[clamped]} w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold`}>
      {clamped}
    </div>
  );
}

export default function TestPage() {
  // Dev-only playground — production users get a 404. The check uses
  // process.env.NODE_ENV which Next.js inlines at build time, so the
  // condition is dead-code-eliminated in production builds.
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const { activity, month, hour, vessel, setActivity, setMonth, setHour, setVesselPreset } = useAppStore();

  const currentActivity = getActivity(activity);
  const origin = sfBay.destinations[0]; // Sausalito as default origin

  // Score all destinations from origin
  const scoredRoutes: (ScoredRoute & { destName: string })[] = sfBay.destinations
    .filter((d) => d.id !== origin.id)
    .map((dest) => {
      const scored = routeComfort(origin, dest, month, hour, currentActivity, vessel, sfBay);
      return { ...scored, destName: dest.name };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-compass-gold">WhenToBoat — Engine Test</h1>
        <p className="text-sm text-[var(--muted)]">
          Validating scoring, routing, and trajectory pipeline. Origin: {origin.name}
        </p>
      </div>

      {/* Activity selector */}
      <div className="space-y-2">
        <h2 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Activity</h2>
        <div className="flex gap-2">
          {activities.map((a) => (
            <button
              key={a.id}
              onClick={() => setActivity(a.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activity === a.id
                  ? 'bg-reef-teal text-white'
                  : 'bg-[var(--card)] text-[var(--secondary)] border border-[var(--border)] hover:border-reef-teal'
              }`}
            >
              {a.icon} {a.name}
            </button>
          ))}
        </div>
      </div>

      {/* Month selector */}
      <div className="space-y-2">
        <h2 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Month</h2>
        <div className="flex gap-1">
          {MONTHS.map((m, i) => (
            <button
              key={i}
              onClick={() => setMonth(i)}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                month === i
                  ? 'bg-compass-gold text-ocean-950'
                  : 'bg-[var(--card)] text-[var(--secondary)] border border-[var(--border)] hover:border-compass-gold'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Hour slider */}
      <div className="space-y-2">
        <h2 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
          Time of Day: {hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`}
        </h2>
        <input
          type="range"
          min={5}
          max={22}
          value={hour}
          onChange={(e) => setHour(parseInt(e.target.value))}
          className="w-full accent-compass-gold"
        />
        <div className="flex justify-between text-xs text-[var(--muted)]">
          <span>5 AM</span>
          <span>Noon</span>
          <span>10 PM</span>
        </div>
      </div>

      {/* Vessel selector */}
      <div className="space-y-2">
        <h2 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Vessel: {vessel.name}</h2>
        <div className="flex gap-2">
          {vesselPresets.map((v) => (
            <button
              key={v.type}
              onClick={() => setVesselPreset(v.type as 'kayak' | 'powerboat' | 'sailboat')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                vessel.type === v.type
                  ? 'bg-safety-blue text-white'
                  : 'bg-[var(--card)] text-[var(--secondary)] border border-[var(--border)]'
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* Scored destinations */}
      <div className="space-y-2">
        <h2 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
          Destinations from {origin.name} — {currentActivity.name} — {MONTHS[month]} {hour <= 12 ? `${hour} AM` : `${hour - 12} PM`}
        </h2>
        <div className="space-y-2">
          {scoredRoutes.map((route) => (
            <div
              key={route.destinationId}
              className={`bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 ${
                !route.inRange ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ScoreBadge score={route.score} />
                  <div>
                    <h3 className="font-medium">{route.destName}</h3>
                    <p className="text-xs text-[var(--muted)]">
                      {route.distance} mi · {route.transitMinutes} min ·{' '}
                      {route.fuelGallons !== null ? `${route.fuelGallons} gal RT` : 'human-powered'}
                      {!route.inRange && ' · ⚠ OUT OF RANGE'}
                      {!route.draftClear && ' · ⚠ DRAFT'}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-[var(--muted)]">
                  <div>Range: {route.scoreRange.p10}–{route.scoreRange.p90}</div>
                </div>
              </div>

              {/* Risk factors */}
              {route.riskFactors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {route.riskFactors.map((r, i) => (
                    <p key={i} className={`text-xs ${r.severity === 'high' ? 'text-danger-red' : 'text-warning-amber'}`}>
                      ⚠ {r.description}
                    </p>
                  ))}
                </div>
              )}

              {/* Variability warning */}
              {route.variabilityWarning && (
                <p className="mt-1 text-xs text-warning-amber">
                  📊 {route.variabilityWarning}
                </p>
              )}

              {/* Draft warning */}
              {route.draftWarning && (
                <p className="mt-1 text-xs text-danger-red">⚓ {route.draftWarning}</p>
              )}

              {/* Alternatives */}
              {route.score < 7 && route.alternatives.length > 0 && (
                <div className="mt-3 pt-2 border-t border-[var(--border)]">
                  <p className="text-xs text-reef-teal font-medium mb-1">Better alternatives:</p>
                  {route.alternatives.map((alt) => (
                    <p key={alt.destinationId} className="text-xs text-[var(--secondary)]">
                      ✅ {alt.destinationName} ({alt.score}/10) — {alt.distance} mi · {alt.transitMinutes} min · {alt.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Before You Go checklist */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
        <h2 className="text-sm font-medium text-reef-teal mb-2">Before You Go — {currentActivity.name}</h2>
        {currentActivity.beforeYouGo.map((item, i) => (
          <div key={i} className="flex items-start gap-2 mb-1">
            <span className="text-xs">☐</span>
            <span className="text-xs text-[var(--secondary)]">
              {item.text}
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-safety-blue ml-1">
                  →
                </a>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Verify links */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
        <h2 className="text-sm font-medium text-reef-teal mb-2">Verify Conditions</h2>
        {sfBay.verifyLinks.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-safety-blue hover:underline mb-1"
          >
            {link.label} ({link.type}) →
          </a>
        ))}
      </div>

      {/* Data sources */}
      <div className="text-xs text-[var(--muted)] space-y-1 pb-8">
        <p className="font-medium">Data Sources:</p>
        {sfBay.dataSources.map((ds, i) => (
          <p key={i}>
            {ds.name} — {ds.authority} — {ds.updateFrequency}
          </p>
        ))}
        <p className="mt-2 text-warning-amber">
          ⚠ This is a planning tool. Always verify conditions with authoritative sources before going on the water.
        </p>
      </div>
    </div>
  );
}
