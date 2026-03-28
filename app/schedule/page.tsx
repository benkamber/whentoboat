'use client';

import { useMemo, useState } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { getActivity } from '@/data/activities';
import { useAppStore } from '@/store';
import { routeComfort } from '@/engine/scoring';
import { getRouteZones } from '@/engine/routing';
import { getTimeConditions } from '@/engine/interpolation';
import { Header } from '../components/Header';
import { ScoreBadge, getScoreLabel } from '../components/ScoreBadge';
import type { ScoredRoute, VesselType } from '@/engine/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Summer months depart earlier to maximize calm morning window
const AM_DEPART_HOURS = [8.5, 8.5, 8, 8, 7.5, 7, 7, 7.5, 8, 8, 8.5, 8.5];

// Default stay duration by vessel type (hours)
const STAY_HOURS: Record<VesselType, number> = {
  powerboat: 2.5,
  kayak: 2,
  sup: 2,
  sailboat: 3,
};

type TimeWindow = 'am' | 'pm' | 'sunset';
type SortOption = 'score' | 'distance' | 'transit' | 'fuel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(decimalHours: number): string {
  const totalMinutes = Math.round(decimalHours * 60);
  let h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// Status badge uses the unified score label system (no competing color systems)
function getStatusBadge(score: number): { label: string; classes: string } {
  const label = getScoreLabel(score);
  if (score >= 8) return { label, classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  if (score >= 5) return { label, classes: 'bg-compass-gold/20 text-compass-gold border-compass-gold/30' };
  if (score >= 3) return { label, classes: 'bg-warning-amber/20 text-warning-amber border-warning-amber/30' };
  return { label, classes: 'bg-danger-red/20 text-danger-red border-danger-red/30' };
}

function getDepartHour(month: number, window: TimeWindow): number {
  if (window === 'am') return AM_DEPART_HOURS[month];
  if (window === 'pm') return 13; // 1:00 PM
  // Sunset — use sunset data from sfBay if available, otherwise fallback
  const sunset = sfBay.sunsetData?.[month];
  if (sunset) {
    // Parse "7:42 PM" style string
    const match = sunset.goldenHourStart.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let h = parseInt(match[1]);
      const mins = parseInt(match[2]);
      if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
      if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
      return h + mins / 60;
    }
  }
  return 17; // fallback 5 PM
}

// ---------------------------------------------------------------------------
// Timetable computation types
// ---------------------------------------------------------------------------

interface Timetable {
  departHome: number;     // decimal hours
  arriveAt: number;
  stayHours: number;
  departDest: number;
  returnHome: number;
}

interface ScheduleEntry {
  destinationId: string;
  destinationName: string;
  destinationCode: string;
  scored: ScoredRoute;
  timetable: Timetable;
  windKts: number;
  waveHtFt: number;
  zonesTraversed: string[];
  fuelPercent: number | null;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function SchedulePage() {
  const { activity, month, hour, vessel, homeBaseId } = useAppStore();
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('am');
  const [sortBy, setSortBy] = useState<SortOption>('score');

  const currentActivity = getActivity(activity);
  const origin = sfBay.destinations.find((d) => d.id === homeBaseId) ?? sfBay.destinations[0];

  // Compute scored routes + timetables for all reachable destinations
  const entries = useMemo(() => {
    const departHour = getDepartHour(month, timeWindow);
    const stayHrs = STAY_HOURS[vessel.type];
    // Use the departure hour for scoring to get the right conditions
    const scoreHour = Math.round(departHour);

    const results: ScheduleEntry[] = [];

    for (const dest of sfBay.destinations) {
      if (dest.id === origin.id) continue;
      if (!dest.activityTags.includes(activity)) continue;

      try {
      const scored = routeComfort(origin, dest, month, scoreHour, currentActivity, vessel, sfBay);
      const transitHours = scored.transitMinutes / 60;

      const timetable: Timetable = {
        departHome: departHour,
        arriveAt: departHour + transitHours,
        stayHours: stayHrs,
        departDest: departHour + transitHours + stayHrs,
        returnHome: departHour + transitHours + stayHrs + transitHours,
      };

      // Get wind/wave conditions from the worst zone along the route
      const zones = getRouteZones(origin, dest, sfBay);
      let worstWind = 0;
      let worstWave = 0;
      const zoneNames: string[] = [];
      for (const zone of zones) {
        const conditions = getTimeConditions(zone, scoreHour, month);
        if (conditions.windKts > worstWind) worstWind = conditions.windKts;
        if (conditions.waveHtFt > worstWave) worstWave = conditions.waveHtFt;
        zoneNames.push(zone.name);
      }

      const fuelPercent =
        scored.fuelGallons !== null && vessel.fuelCapacity !== null && vessel.fuelCapacity > 0
          ? Math.round((scored.fuelGallons / vessel.fuelCapacity) * 100)
          : null;

      results.push({
        destinationId: dest.id,
        destinationName: dest.name,
        destinationCode: dest.code ?? dest.id.toUpperCase().slice(0, 3),
        scored,
        timetable,
        windKts: worstWind,
        waveHtFt: worstWave,
        zonesTraversed: zoneNames,
        fuelPercent,
      });
      } catch (e) {
        console.error(`Schedule scoring error for ${dest.id}:`, e);
      }
    }

    return results;
  }, [activity, month, vessel, origin, currentActivity, timeWindow]);

  // Sort entries
  const sorted = useMemo(() => {
    const copy = [...entries];
    switch (sortBy) {
      case 'score':
        copy.sort((a, b) => b.scored.score - a.scored.score);
        break;
      case 'distance':
        copy.sort((a, b) => a.scored.distance - b.scored.distance);
        break;
      case 'transit':
        copy.sort((a, b) => a.scored.transitMinutes - b.scored.transitMinutes);
        break;
      case 'fuel':
        copy.sort((a, b) => (a.scored.fuelGallons ?? 0) - (b.scored.fuelGallons ?? 0));
        break;
    }
    return copy;
  }, [entries, sortBy]);

  const recommended = entries.filter((e) => e.scored.score >= 8).length;
  const available = entries.filter((e) => e.scored.score >= 5 && e.scored.score < 8).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full space-y-6">
        {/* ---- Header area: current settings ---- */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Departure Board</h1>
          <p className="text-sm text-[var(--muted)]">
            {currentActivity.icon} {currentActivity.name} from{' '}
            <span className="text-[var(--foreground)] font-medium">{origin.name}</span>
            {' '}&middot; {MONTH_FULL[month]} &middot; {vessel.name}
          </p>
        </div>

        {/* ---- Summary strip ---- */}
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
            {recommended} recommended
          </span>
          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">
            {available} available
          </span>
          <span className="text-[var(--muted)]">
            {entries.length} destinations total
          </span>
        </div>

        {/* ---- Time window + Sort controls ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Time window toggle */}
          <div className="flex gap-1">
            {(['am', 'pm', 'sunset'] as TimeWindow[]).map((tw) => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  timeWindow === tw
                    ? 'bg-compass-gold text-ocean-950'
                    : 'bg-[var(--card)] text-[var(--muted)] border border-[var(--border)] hover:text-[var(--foreground)] hover:border-compass-gold/50'
                }`}
              >
                {tw === 'am' ? 'Morning' : tw === 'pm' ? 'Afternoon' : 'Sunset'}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs text-[var(--muted)]">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--foreground)] appearance-none cursor-pointer focus:border-compass-gold focus:outline-none pr-6"
            >
              <option value="score">Comfort Score</option>
              <option value="distance">Distance</option>
              <option value="transit">Transit Time</option>
              <option value="fuel">Fuel Usage</option>
            </select>
          </div>
        </div>

        {/* ---- Destination cards ---- */}
        <div className="space-y-3">
          {sorted.map((entry) => {
            const status = getStatusBadge(entry.scored.score);
            const isUnavailable = entry.scored.score <= 2;
            const isOutOfRange = !entry.scored.inRange;
            const dimmed = isUnavailable || isOutOfRange;

            return (
              <div
                key={entry.destinationId}
                className={`bg-[var(--card)] border rounded-xl overflow-hidden transition-all ${
                  dimmed
                    ? 'border-[var(--border)] opacity-50'
                    : entry.scored.score >= 8
                      ? 'border-emerald-500/30'
                      : 'border-[var(--border)]'
                }`}
              >
                <div className="p-4 sm:p-5 space-y-3">
                  {/* Top row: score badge, name, status */}
                  <div className="flex items-start gap-3">
                    <ScoreBadge
                      score={entry.scored.score}
                      size="lg"
                      showRange={{
                        p10: entry.scored.scoreRange.p10,
                        p90: entry.scored.scoreRange.p90,
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg leading-tight">
                          {entry.destinationName}
                        </h3>
                        <span className="text-xs font-mono text-[var(--muted)]">
                          {entry.destinationCode}
                        </span>
                        <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${status.classes}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {getScoreLabel(entry.scored.score)} &middot;{' '}
                        {entry.scored.distance} mi &middot;{' '}
                        {entry.scored.transitMinutes} min transit
                      </p>
                    </div>
                  </div>

                  {/* Timetable */}
                  <div className="bg-[var(--card-elevated)] rounded-lg p-3 font-mono text-sm space-y-1.5">
                    {/* Outbound leg */}
                    <div className="flex items-center gap-2">
                      <span className="text-reef-teal font-semibold text-xs w-8 shrink-0">DEP</span>
                      <span className="text-[var(--foreground)]">{origin.name}</span>
                      <span className="text-compass-gold font-semibold ml-auto">
                        {formatTime(entry.timetable.departHome)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-reef-teal font-semibold text-xs w-8 shrink-0">ARR</span>
                      <span className="text-[var(--foreground)]">{entry.destinationName}</span>
                      <span className="text-compass-gold font-semibold ml-auto">
                        {formatTime(entry.timetable.arriveAt)}
                      </span>
                    </div>

                    {/* Stay divider */}
                    <div className="flex items-center gap-2 text-[var(--muted)] text-xs py-0.5">
                      <span className="flex-1 border-t border-dashed border-[var(--border)]" />
                      <span>{entry.timetable.stayHours} hrs at destination</span>
                      <span className="flex-1 border-t border-dashed border-[var(--border)]" />
                    </div>

                    {/* Return leg */}
                    <div className="flex items-center gap-2">
                      <span className="text-orange-400 font-semibold text-xs w-8 shrink-0">DEP</span>
                      <span className="text-[var(--foreground)]">{entry.destinationName}</span>
                      <span className="text-compass-gold font-semibold ml-auto">
                        {formatTime(entry.timetable.departDest)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-400 font-semibold text-xs w-8 shrink-0">ARR</span>
                      <span className="text-[var(--foreground)]">{origin.name}</span>
                      <span className="text-compass-gold font-semibold ml-auto">
                        {formatTime(entry.timetable.returnHome)}
                      </span>
                    </div>
                  </div>

                  {/* Conditions + Fuel row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                    <span>
                      Wind: <span className={`font-medium ${entry.windKts > currentActivity.maxWind ? 'text-danger-red' : 'text-[var(--foreground)]'}`}>
                        {entry.windKts} kts
                      </span>
                    </span>
                    <span>
                      Waves: <span className={`font-medium ${entry.waveHtFt > currentActivity.maxWave ? 'text-danger-red' : 'text-[var(--foreground)]'}`}>
                        {entry.waveHtFt} ft
                      </span>
                    </span>
                    {entry.scored.fuelGallons !== null ? (
                      <span>
                        Fuel RT:{' '}
                        <span className="font-medium text-[var(--foreground)]">
                          {entry.scored.fuelGallons} gal
                        </span>
                        {entry.fuelPercent !== null && (
                          <span className={`ml-1 ${entry.fuelPercent > 60 ? 'text-warning-amber' : ''}`}>
                            ({entry.fuelPercent}% of tank)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>Paddle power</span>
                    )}
                  </div>

                  {/* Zones */}
                  <div className="flex flex-wrap gap-1.5">
                    {entry.zonesTraversed.map((z) => (
                      <span
                        key={z}
                        className="px-2 py-0.5 rounded text-[10px] bg-ocean-800/50 text-ocean-200 border border-ocean-700/40"
                      >
                        {z}
                      </span>
                    ))}
                  </div>

                  {/* Warnings */}
                  {(entry.scored.riskFactors.length > 0 ||
                    entry.scored.draftWarning ||
                    isOutOfRange) && (
                    <div className="space-y-1 pt-1">
                      {isOutOfRange && (
                        <p className="text-xs text-danger-red font-medium">
                          Out of range for {vessel.name}
                        </p>
                      )}
                      {entry.scored.draftWarning && (
                        <p className="text-xs text-warning-amber">
                          {entry.scored.draftWarning}
                        </p>
                      )}
                      {entry.scored.riskFactors.slice(0, 2).map((r, i) => (
                        <p
                          key={i}
                          className={`text-xs ${
                            r.severity === 'high'
                              ? 'text-danger-red'
                              : 'text-warning-amber'
                          }`}
                        >
                          {r.description}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sorted.length === 0 && (
            <div className="text-center py-16 text-[var(--muted)]">
              <p className="text-lg font-medium">No destinations available</p>
              <p className="text-sm mt-1">
                No reachable destinations from {origin.name} for {currentActivity.name}.
              </p>
            </div>
          )}
        </div>

        {/* ---- Disclaimer ---- */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-xs text-warning-amber space-y-1">
          <p className="font-medium">Planning tool only</p>
          <p className="text-[var(--muted)]">
            Timetables are based on historical weather patterns and typical conditions for {MONTH_FULL[month]}.
            Always check real-time forecasts before departure.
          </p>
        </div>
      </main>
    </div>
  );
}
