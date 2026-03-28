'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store';
import { fullConditionsScore, buildFullConditions } from '@/engine/scoring';
import { getActivity } from '@/data/activities';
import { vesselPresets } from '@/data/vessels';
import { ScoreBadge, getScoreLabel } from './ScoreBadge';
import type { ForecastHour, ForecastResponse } from '@/app/api/forecast/route';
import type { FullConditions } from '@/engine/types';

/** Default water temperature for SF Bay when data is unavailable. */
const DEFAULT_WATER_TEMP_F = 58;

// ============================================
// 7-Day Live Forecast Strip
// ============================================

// SF Bay center point
const SF_BAY_LAT = 37.8;
const SF_BAY_LNG = -122.4;

// Daytime boating hours (6 AM - 8 PM)
const DAY_START = 6;
const DAY_END = 20;

interface DaySummary {
  date: Date;
  dayName: string;
  dateLabel: string;
  isWeekend: boolean;
  score: number;
  peakWindKts: number;
  peakWaveHtFt: number;
  avgTempF: number;
  waterTempF: number;
  maxPrecipProbPct: number;
  totalPrecipIn: number;
  bestWindowStart: number | null;
  bestWindowEnd: number | null;
  bestWindowLabel: string;
  hours: ForecastHour[];
  waveDataAvailable: boolean;
}

function formatHour(h: number): string {
  if (h === 0 || h === 12) return h === 0 ? '12am' : '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function computeDaySummaries(
  hours: ForecastHour[],
  activityId: string
): DaySummary[] {
  const activity = getActivity(activityId as 'kayak' | 'sup' | 'powerboat_cruise' | 'casual_sail');

  // Group hours by date
  const byDate = new Map<string, ForecastHour[]>();
  for (const h of hours) {
    const dateKey = h.time.slice(0, 10); // "YYYY-MM-DD"
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey)!.push(h);
  }

  const summaries: DaySummary[] = [];

  for (const [dateKey, dayHours] of byDate) {
    const date = new Date(dateKey + 'T12:00:00');
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Filter to daytime hours
    const daytimeHours = dayHours.filter((h) => {
      const hour = new Date(h.time).getHours();
      return hour >= DAY_START && hour < DAY_END;
    });

    if (daytimeHours.length === 0) continue;

    // Check if wave data is available (sentinel -1 means unavailable)
    const hasWaveData = daytimeHours.some((h) => h.waveHeightFt >= 0);

    // Get vessel for full scoring
    const vesselMap: Record<string, string> = { kayak: 'kayak', sup: 'sup', powerboat_cruise: 'powerboat', casual_sail: 'sailboat' };
    const vessel = vesselPresets.find(v => v.type === (vesselMap[activity.id] ?? 'kayak')) ?? vesselPresets[0];

    // Compute score using FULL conditions (wind, waves, temp, tide, visibility, current)
    // NOTE: The forecast is Bay-wide (no specific zone), so we pass zoneId='central_bay'
    // as a conservative default — this activates SUP open-water blocks and current warnings.
    const hourScores = daytimeHours.map((h) => {
      const conditions: FullConditions = {
        windKts: h.windSpeedKts,
        windDirDeg: h.windDirDeg,
        waveHtFt: h.waveHeightFt >= 0 ? h.waveHeightFt : 2.5, // conservative fallback — assume moderate chop when data unavailable
        wavePeriodS: h.wavePeriodS > 0 ? h.wavePeriodS : 3,
        waterTempF: h.waterTempF ?? DEFAULT_WATER_TEMP_F,
        airTempF: h.airTempF ?? 62,
        // SAFETY-CRITICAL: Use -1 sentinel when current data is missing.
        // Do NOT default to 0 — that falsely implies calm. The scoring engine
        // handles -1 by adding explicit "current data unavailable" warnings.
        currentKts: h.currentKts ?? -1,
        currentDirDeg: h.currentDirDeg ?? 0,
        visibilityMi: h.visibilityMi,
        tideFt: h.tideFt >= 0 ? h.tideFt : 3,
        tidePhase: h.tidePhase === 'unknown' ? 'flood' : h.tidePhase,
        windGustKts: h.windGustKts,
        precipitationIn: h.precipitationIn,
        precipProbPct: h.precipProbPct,
        pressureHpa: h.pressureHpa,
        dewpointF: h.dewpointF,
        uvIndex: h.uvIndex,
        weatherCode: h.weatherCode,
        waveDirDeg: h.waveDirDeg,
        isLiveForecast: true,
        isMissingWaveData: !h.waveDataAvailable,
        zoneId: 'central_bay',
      };
      const { score, factors } = fullConditionsScore(activity, conditions, vessel);
      return { hour: new Date(h.time).getHours(), score, factors, data: h };
    });

    // Average score across daytime hours
    const avgScore =
      hourScores.reduce((sum, hs) => sum + hs.score, 0) / hourScores.length;

    // Peak wind/wave during the day (ignore -1 sentinels)
    const peakWind = Math.max(...daytimeHours.map((h) => h.windSpeedKts));
    const validWaves = daytimeHours.filter((h) => h.waveHeightFt >= 0).map((h) => h.waveHeightFt);
    const peakWave = validWaves.length > 0 ? Math.max(...validWaves) : -1;

    // Temperature and precipitation
    const avgTemp = daytimeHours.reduce((sum, h) => sum + (h.airTempF ?? 0), 0) / daytimeHours.length;
    const avgWaterTemp = daytimeHours.reduce((sum, h) => sum + (h.waterTempF ?? DEFAULT_WATER_TEMP_F), 0) / daytimeHours.length;
    const maxPrecipProb = Math.max(...daytimeHours.map(h => h.precipProbPct ?? 0));
    const totalPrecip = daytimeHours.reduce((sum, h) => sum + (h.precipitationIn ?? 0), 0);

    // Best window: contiguous hours with score >= 7
    let bestStart: number | null = null;
    let bestEnd: number | null = null;
    let longestRun = 0;
    let runStart = -1;
    let runLen = 0;

    for (const hs of hourScores) {
      if (hs.score >= 7) {
        if (runLen === 0) runStart = hs.hour;
        runLen++;
        if (runLen > longestRun) {
          longestRun = runLen;
          bestStart = runStart;
          bestEnd = hs.hour + 1;
        }
      } else {
        runLen = 0;
      }
    }

    let bestWindowLabel = 'No good window';
    if (bestStart !== null && bestEnd !== null) {
      bestWindowLabel = `${formatHour(bestStart)}-${formatHour(bestEnd)}`;
    }

    summaries.push({
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isWeekend,
      score: Math.round(avgScore),
      peakWindKts: Math.round(peakWind),
      peakWaveHtFt: Math.round(peakWave * 10) / 10,
      avgTempF: Math.round(avgTemp),
      waterTempF: Math.round(avgWaterTemp),
      maxPrecipProbPct: Math.round(maxPrecipProb),
      totalPrecipIn: Math.round(totalPrecip * 100) / 100,
      bestWindowStart: bestStart,
      bestWindowEnd: bestEnd,
      bestWindowLabel,
      hours: daytimeHours,
      waveDataAvailable: hasWaveData,
    });
  }

  return summaries;
}

export function WeekendForecast() {
  const activity = useAppStore((s) => s.activity);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const fetchForecast = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/forecast?lat=${SF_BAY_LAT}&lng=${SF_BAY_LNG}&days=7`,
        { signal }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ForecastResponse = await res.json();
      if (!signal?.aborted) setForecast(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load forecast');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchForecast(controller.signal);
    return () => controller.abort();
  }, [fetchForecast]);

  const days = useMemo(() => {
    if (!forecast?.hours.length) return [];
    return computeDaySummaries(forecast.hours, activity);
  }, [forecast, activity]);

  const bestDayIdx = useMemo(() => {
    if (days.length === 0) return -1;
    let bestIdx = -1;
    let bestScore = -1;
    for (let i = 0; i < days.length; i++) {
      if (days[i].score > bestScore) {
        bestScore = days[i].score;
        bestIdx = i;
      }
    }
    // Don't highlight "BEST" when even the best day scores below Fair (5/10)
    return bestScore >= 5 ? bestIdx : -1;
  }, [days]);

  if (loading) {
    return (
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-bold text-[var(--foreground)]">
            7-Day Forecast
          </h2>
          <span className="text-xs text-[var(--muted)]">Loading...</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[100px] h-[160px] rounded-lg bg-[var(--card-elevated)] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || days.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-base font-bold text-[var(--foreground)]">
            7-Day Forecast
          </h2>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {error ?? 'Forecast data unavailable.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)]">
            7-Day Forecast
          </h2>
          <span className="text-[10px] text-[var(--muted)]">
            SF Bay &middot; Live from Open-Meteo
          </span>
        </div>
        <button
          onClick={() => fetchForecast()}
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          title="Refresh forecast"
        >
          Refresh
        </button>
      </div>

      {/* Weekend proof point — show explicit "This Weekend" with dates */}
      {(() => {
        const weekendDays = days.filter(d => d.isWeekend);
        if (weekendDays.length === 0) return null;
        const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        const label = weekendDays.length >= 2
          ? `This Weekend: ${fmt(weekendDays[0].date)}–${weekendDays[weekendDays.length - 1].date.getDate()}`
          : `This ${weekendDays[0].dayName === 'SAT' ? 'Saturday' : 'Sunday'}: ${fmt(weekendDays[0].date)}`;
        return (
          <div className="mb-3 text-xs font-medium text-compass-gold">
            {label}
          </div>
        );
      })()}

      {/* Staleness warning — if forecast is >3 hours old, warn the user */}
      {(() => {
        if (!forecast) return null;
        const ageHours = (Date.now() - new Date(forecast.fetchedAt).getTime()) / 3_600_000;
        if (ageHours <= 3) return null;
        return (
          <div className="mb-3 px-3 py-2 rounded-lg bg-warning-amber/10 border border-warning-amber/30 text-xs text-warning-amber">
            Forecast data is {Math.round(ageHours)} hours old. Scores may not reflect current conditions.{' '}
            <button onClick={() => fetchForecast()} className="underline font-medium">Refresh now</button>
          </div>
        );
      })()}

      {/* Day cards strip */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((day, idx) => (
          <button
            key={day.dateLabel}
            onClick={() => setExpandedDay(expandedDay === idx ? null : idx)}
            className={`
              flex-shrink-0 w-[100px] rounded-lg border transition-all text-left
              ${
                day.isWeekend
                  ? 'border-compass-gold/30 bg-compass-gold/5'
                  : 'border-[var(--border)] bg-[var(--card-elevated)]'
              }
              ${expandedDay === idx ? 'ring-1 ring-compass-gold/50' : ''}
              hover:border-compass-gold/40 p-3
            `}
          >
            {/* Day name + date */}
            <div className="mb-2">
              <div
                className={`text-xs font-bold ${
                  day.isWeekend
                    ? 'text-compass-gold'
                    : 'text-[var(--foreground)]'
                }`}
              >
                {day.dayName}
              </div>
              <div className="text-[10px] text-[var(--muted)]">
                {day.dateLabel}
              </div>
            </div>

            {/* Score badge */}
            <div className="mb-2 flex items-center gap-1.5">
              <ScoreBadge score={day.score} size="sm" />
              {bestDayIdx === idx && (
                <span className="text-[9px] font-bold text-compass-gold bg-compass-gold/15 px-1 py-0.5 rounded">
                  BEST
                </span>
              )}
            </div>

            {/* Conditions — all data types */}
            <div className="space-y-0.5 text-[11px] text-[var(--muted)]">
              <div className="flex justify-between">
                <span>Wind</span>
                <span className="font-mono text-[var(--foreground)]">
                  {day.peakWindKts}kt
                </span>
              </div>
              <div className="flex justify-between">
                <span>Waves</span>
                <span className={`font-mono ${day.peakWaveHtFt < 0 ? 'text-warning-amber' : 'text-[var(--foreground)]'}`}>
                  {day.peakWaveHtFt >= 0 ? `${day.peakWaveHtFt}ft` : 'N/A'}
                </span>
              </div>
              {!day.waveDataAvailable && (
                <div className="text-[9px] text-warning-amber">
                  ⚠ Wave data unavailable — conditions may be rougher
                </div>
              )}
              <div className="flex justify-between">
                <span>Air</span>
                <span className="font-mono text-[var(--foreground)]">
                  {day.avgTempF}&deg;F
                </span>
              </div>
              <div className="flex justify-between">
                <span>Water</span>
                <span className={`font-mono ${
                  day.waterTempF < 50 ? 'text-danger-red font-medium' :
                  day.waterTempF < 55 ? 'text-safety-blue font-medium' :
                  day.waterTempF < 60 ? 'text-safety-blue' :
                  'text-[var(--foreground)]'
                }`}>
                  {day.waterTempF}&deg;F
                </span>
              </div>
              {day.waterTempF < 60 && (
                <div className="text-[9px] text-safety-blue">
                  {day.waterTempF < 50 ? '\u2744\uFE0F Drysuit essential' : day.waterTempF < 55 ? '\u2744\uFE0F Drysuit strongly recommended' : '\u2744\uFE0F Wetsuit recommended'}
                </div>
              )}
              {day.maxPrecipProbPct > 10 && (
                <div className="flex justify-between">
                  <span>Rain</span>
                  <span className={`font-mono ${day.maxPrecipProbPct > 50 ? 'text-safety-blue' : 'text-[var(--foreground)]'}`}>
                    {day.maxPrecipProbPct}%
                  </span>
                </div>
              )}
            </div>

            {/* Best window */}
            {day.bestWindowStart !== null && (
              <div className="mt-2 text-[9px] text-reef-teal font-medium truncate">
                {day.bestWindowLabel}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Expanded hourly breakdown */}
      {expandedDay !== null && days[expandedDay] && (
        <HourlyBreakdown day={days[expandedDay]} activity={activity} />
      )}
    </div>
  );
}

// ============================================
// Hourly Breakdown Panel
// ============================================

function HourlyBreakdown({
  day,
  activity: activityId,
}: {
  day: DaySummary;
  activity: string;
}) {
  const activity = getActivity(activityId as 'kayak' | 'sup' | 'powerboat_cruise' | 'casual_sail');
  const vesselMap: Record<string, string> = { kayak: 'kayak', sup: 'sup', powerboat_cruise: 'powerboat', casual_sail: 'sailboat' };
  const vessel = vesselPresets.find(v => v.type === (vesselMap[activity.id] ?? 'kayak')) ?? vesselPresets[0];

  return (
    <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--card-elevated)] p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-bold text-[var(--foreground)]">
          {day.dayName} {day.dateLabel}
        </span>
        <span className="text-xs text-[var(--muted)]">
          Hourly &middot; {getScoreLabel(day.score)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[var(--muted)] border-b border-[var(--border)]">
              <th className="text-left py-1 pr-3 font-medium">Hour</th>
              <th className="text-right py-1 px-1 font-medium">Score</th>
              <th className="text-right py-1 px-1 font-medium">Wind</th>
              <th className="text-right py-1 px-1 font-medium">Gust</th>
              <th className="text-right py-1 px-1 font-medium">Waves</th>
              <th className="text-right py-1 px-1 font-medium">Tide</th>
              <th className="text-right py-1 px-1 font-medium">Air</th>
              <th className="text-right py-1 px-1 font-medium">Water</th>
              <th className="text-right py-1 px-1 font-medium">Vis</th>
              <th className="text-right py-1 px-1 font-medium">Rain</th>
            </tr>
          </thead>
          <tbody>
            {day.hours.map((h) => {
              const hour = new Date(h.time).getHours();
              // SAFETY-CRITICAL: Use fullConditionsScore (not activityScore) so hourly
              // scores reflect the same safety blocks as the day-level score. Previously
              // this used activityScore which ignored fog, current, zone restrictions,
              // and water temperature — creating dangerous contradictions where the
              // day showed "DANGEROUS" but individual hours showed green scores.
              const conditions: FullConditions = {
                windKts: h.windSpeedKts,
                windDirDeg: h.windDirDeg,
                waveHtFt: h.waveHeightFt >= 0 ? h.waveHeightFt : 2.5,
                wavePeriodS: h.wavePeriodS > 0 ? h.wavePeriodS : 3,
                waterTempF: h.waterTempF ?? DEFAULT_WATER_TEMP_F,
                airTempF: h.airTempF ?? 62,
                currentKts: h.currentKts ?? -1,
                currentDirDeg: h.currentDirDeg ?? 0,
                visibilityMi: h.visibilityMi,
                tideFt: h.tideFt >= 0 ? h.tideFt : 3,
                tidePhase: h.tidePhase === 'unknown' ? 'flood' : h.tidePhase,
                windGustKts: h.windGustKts,
                precipitationIn: h.precipitationIn,
                precipProbPct: h.precipProbPct,
                pressureHpa: h.pressureHpa,
                dewpointF: h.dewpointF,
                uvIndex: h.uvIndex,
                weatherCode: h.weatherCode,
                waveDirDeg: h.waveDirDeg,
                isLiveForecast: true,
                isMissingWaveData: !h.waveDataAvailable,
                zoneId: 'central_bay',
              };
              const { score } = fullConditionsScore(activity, conditions, vessel);
              return (
                <tr
                  key={h.time}
                  className="border-b border-[var(--border)]/50 hover:bg-[var(--card)]"
                >
                  <td className="py-1 pr-3 font-mono text-[var(--foreground)]">
                    {formatHour(hour)}
                  </td>
                  <td className="py-1 px-1 text-right">
                    <ScoreBadge score={score} size="sm" />
                  </td>
                  <td className="py-1 px-1 text-right font-mono text-[var(--foreground)]">
                    {Math.round(h.windSpeedKts)}kt
                  </td>
                  <td className="py-1 px-1 text-right font-mono text-[var(--muted)]">
                    {Math.round(h.windGustKts)}kt
                  </td>
                  <td className="py-1 px-1 text-right font-mono text-[var(--foreground)]">
                    {h.waveHeightFt >= 0 ? `${(Math.round(h.waveHeightFt * 10) / 10).toFixed(1)}ft` : 'N/A'}
                  </td>
                  <td className="py-1 px-1 text-right font-mono text-[var(--foreground)]">
                    {h.tideFt >= 0 ? `${h.tideFt.toFixed(1)}` : 'N/A'}
                    <span className="text-[9px] text-[var(--muted)]">
                      {h.tidePhase === 'flood' ? '\u25B2' : h.tidePhase === 'ebb' ? '\u25BC' : h.tidePhase === 'slack_high' ? '\u25CF' : h.tidePhase === 'slack_low' ? '\u25CB' : ''}
                    </span>
                  </td>
                  <td className="py-1 px-1 text-right font-mono text-[var(--foreground)]">
                    {Math.round(h.airTempF)}&deg;
                  </td>
                  <td className={`py-1 px-1 text-right font-mono ${
                    h.waterTempF < 50 ? 'text-danger-red' :
                    h.waterTempF < 55 ? 'text-safety-blue font-medium' :
                    h.waterTempF < 60 ? 'text-safety-blue' :
                    'text-[var(--foreground)]'
                  }`}>
                    {h.waterTempF > 0 ? `${Math.round(h.waterTempF)}\u00B0` : 'N/A'}
                  </td>
                  <td className={`py-1 px-1 text-right font-mono ${h.visibilityMi < 3 ? 'text-warning-amber' : 'text-[var(--muted)]'}`}>
                    {h.visibilityMi > 0 ? `${Math.round(h.visibilityMi)}mi` : 'N/A'}
                  </td>
                  <td className={`py-1 px-1 text-right font-mono ${h.precipProbPct > 50 ? 'text-safety-blue' : 'text-[var(--muted)]'}`}>
                    {h.precipProbPct > 0 ? `${Math.round(h.precipProbPct)}%` : '–'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
