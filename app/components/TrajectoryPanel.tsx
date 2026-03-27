'use client';

import { useMemo } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { getActivity } from '@/data/activities';
import { analyzeTrajectory } from '@/engine/trajectory';
import { useAppStore } from '@/store';
import { ScoreBadge, getScoreLabel, getScoreColor } from './ScoreBadge';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface TrajectoryPanelProps {
  originId: string;
  destinationId: string;
  onClose: () => void;
}

export function TrajectoryPanel({ originId, destinationId, onClose }: TrajectoryPanelProps) {
  const { activity, month, hour, vessel } = useAppStore();

  const analysis = useMemo(() => {
    const origin = sfBay.destinations.find((d) => d.id === originId);
    const dest = sfBay.destinations.find((d) => d.id === destinationId);
    if (!origin || !dest) return null;

    const act = getActivity(activity);
    return analyzeTrajectory(origin, dest, month, hour, act, vessel, sfBay);
  }, [originId, destinationId, activity, month, hour, vessel]);

  if (!analysis) return null;

  const { origin, destination, overallScore, scoreRange, distance, transitMinutes, fuelGallons, inRange, legs, hourlyProfile, monthlyProfile, departureWindow, warnings, alternatives, beforeYouGo, verifyLinks } = analysis;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-[var(--background)] border-l border-[var(--border)] overflow-y-auto z-50 shadow-2xl">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] p-4 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
            ✕ Close
          </button>
          <span className="text-xs text-[var(--muted)]">Trajectory Analysis</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* At a glance */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <ScoreBadge score={overallScore} size="lg" showRange={{ p10: scoreRange.p10, p90: scoreRange.p90 }} />
            <div>
              <h2 className="text-lg font-bold">
                {origin.name} → {destination.name}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                {distance} mi · {transitMinutes} min ·{' '}
                {fuelGallons !== null ? `${fuelGallons} gal RT` : 'paddle power'}
              </p>
              <p className="text-sm font-medium" style={{ color: getScoreColor(overallScore) }}>
                {getScoreLabel(overallScore)}
              </p>
            </div>
          </div>

          {!inRange && (
            <div className="bg-danger-red/10 border border-danger-red/30 rounded-lg p-3 text-sm text-danger-red">
              ⚠ Out of range for {vessel.name}
            </div>
          )}
        </div>

        {/* Leg-by-leg breakdown */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
            Zones Traversed
          </h3>
          {legs.map((leg, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                leg.isBottleneck
                  ? 'bg-danger-red/10 border border-danger-red/30'
                  : 'bg-[var(--card)] border border-[var(--border)]'
              }`}
            >
              <ScoreBadge score={leg.score} size="sm" />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {leg.zone.name}
                  {leg.isBottleneck && (
                    <span className="ml-2 text-xs text-danger-red font-normal">← roughest zone</span>
                  )}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  Wind {leg.wind} kts · Waves {leg.waveHeight} ft · Period {leg.wavePeriod}s
                </div>
                {leg.isBottleneck && (
                  <div className="text-xs mt-1 text-warning-amber">
                    {leg.wind > 15 ? '💨 Strong wind — uncomfortable for passengers, challenging for small craft'
                      : leg.wind > 10 ? '💨 Moderate wind — some spray, hold on to hats'
                      : '✓ Wind is manageable'}
                    {' · '}
                    {leg.waveHeight > 3 ? '🌊 Rough seas — consider postponing'
                      : leg.waveHeight > 1.5 ? '🌊 Choppy — expect bumpy ride'
                      : leg.waveHeight > 0.5 ? '🌊 Light chop — comfortable for most'
                      : '🌊 Calm water'}
                    {leg.wavePeriod > 0 && leg.wavePeriod < 4 && leg.waveHeight > 1 ? ' · ⚠ Short wave period = steep, uncomfortable chop' : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((w, i) => (
              <div key={i} className="bg-warning-amber/10 border border-warning-amber/30 rounded-lg p-3 text-sm text-warning-amber">
                ⚠ {w}
              </div>
            ))}
          </div>
        )}

        {/* Hour-by-hour timeline */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
            Hour by Hour
          </h3>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
            <div className="flex gap-0.5 h-16 items-end">
              {hourlyProfile.map((h) => (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-sm transition-all"
                    style={{
                      height: `${(h.score / 10) * 100}%`,
                      backgroundColor: getScoreColor(h.score),
                      opacity: 0.8,
                    }}
                    title={`${h.label}: ${h.score}/10 — Wind ${h.wind} kts, Waves ${h.waveHeight} ft`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1 text-xs text-[var(--muted)]">
              <span>5 AM</span>
              <span>Noon</span>
              <span>10 PM</span>
            </div>
            <div className="mt-2 text-xs text-reef-teal">
              Best window: {departureWindow.label}
            </div>
          </div>
        </div>

        {/* 12-month calendar */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
            Monthly Pattern
          </h3>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
            <div className="grid grid-cols-12 gap-1">
              {monthlyProfile.map((m) => (
                <div key={m.month} className="flex flex-col items-center gap-1">
                  <div className="flex flex-col gap-0.5 w-full">
                    <div
                      className="h-3 rounded-sm"
                      style={{ backgroundColor: getScoreColor(m.amScore), opacity: 0.9 }}
                      title={`${m.label} AM: ${m.amScore}/10`}
                    />
                    <div
                      className="h-3 rounded-sm"
                      style={{ backgroundColor: getScoreColor(m.pmScore), opacity: 0.9 }}
                      title={`${m.label} PM: ${m.pmScore}/10`}
                    />
                  </div>
                  <span className="text-[9px] text-[var(--muted)]">{m.label}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-2 text-[10px] text-[var(--muted)]">
              <span>Top row = AM</span>
              <span>Bottom row = PM</span>
            </div>
          </div>
        </div>

        {/* Where else? */}
        {alternatives.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-reef-teal uppercase tracking-wider">
              Better Alternatives
            </h3>
            {alternatives.map((alt) => (
              <div
                key={alt.destinationId}
                className="flex items-center gap-3 bg-reef-teal/10 border border-reef-teal/30 rounded-lg p-3"
              >
                <ScoreBadge score={alt.score} size="sm" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{alt.destinationName}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {alt.distance} mi · {alt.transitMinutes} min
                  </div>
                </div>
                <span className="text-xs text-reef-teal">{alt.reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* Before You Go */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-reef-teal uppercase tracking-wider">
            Before You Go
          </h3>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 space-y-2">
            {beforeYouGo.map((item, i) => (
              <label key={i} className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5 accent-reef-teal" />
                <span className="text-sm text-[var(--secondary)]">
                  {item.text}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-safety-blue ml-1 hover:underline">→</a>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Verify links */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-reef-teal uppercase tracking-wider">
            Verify Conditions
          </h3>
          <p className="text-xs text-warning-amber">
            Planning tool only — always verify with authoritative sources before departure.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {verifyLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--card)] text-xs text-safety-blue hover:underline border border-[var(--border)]"
              >
                {link.label} →
              </a>
            ))}
          </div>
        </div>

        {/* Destination info */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 space-y-1">
          <h3 className="text-sm font-medium">{destination.name}</h3>
          <p className="text-xs text-[var(--muted)]">{destination.dockInfo}</p>
          {destination.notes && (
            <p className="text-xs text-[var(--secondary)]">{destination.notes}</p>
          )}
          {destination.launchRamp && (
            <div className="text-xs text-[var(--muted)] pt-1 border-t border-[var(--border)] mt-2">
              <span className="font-medium">Launch ramp:</span> {destination.launchRamp.name} · {destination.launchRamp.hours} · {destination.launchRamp.fee}
            </div>
          )}
          {destination.rentalLinks && destination.rentalLinks.length > 0 && (
            <div className="pt-2 border-t border-[var(--border)] mt-2">
              <span className="text-xs font-medium text-reef-teal">Rent Gear</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {destination.rentalLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-reef-teal/10 text-xs text-reef-teal hover:bg-reef-teal/20 transition-colors border border-reef-teal/20"
                  >
                    {link.name}
                    <span className="text-[var(--muted)]">({link.type})</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Data source footer */}
        <p className="text-[10px] text-[var(--muted)] text-center pb-4">
          Conditions based on historical NOAA data. Not a real-time forecast.
        </p>
      </div>
    </div>
  );
}
