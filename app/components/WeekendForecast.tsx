'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store';
import { activityScore } from '@/engine/scoring';
import { getActivity } from '@/data/activities';
import { ScoreBadge, getScoreLabel } from './ScoreBadge';
import type { ForecastHour, ForecastResponse } from '@/app/api/forecast/route';

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
  bestWindowStart: number | null;
  bestWindowEnd: number | null;
  bestWindowLabel: string;
  hours: ForecastHour[];
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

    // Compute score for each daytime hour
    const hourScores = daytimeHours.map((h) => ({
      hour: new Date(h.time).getHours(),
      score: activityScore(
        activity,
        h.windSpeedKts,
        h.waveHeightFt,
        h.wavePeriodS > 0 ? h.wavePeriodS : 3 // default 3s period if missing
      ),
      data: h,
    }));

    // Average score across daytime hours
    const avgScore =
      hourScores.reduce((sum, hs) => sum + hs.score, 0) / hourScores.length;

    // Peak wind/wave during the day
    const peakWind = Math.max(...daytimeHours.map((h) => h.windSpeedKts));
    const peakWave = Math.max(...daytimeHours.map((h) => h.waveHeightFt));

    // Average temperature
    const avgTemp =
      daytimeHours.reduce((sum, h) => sum + h.tempF, 0) / daytimeHours.length;

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
      dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
      isWeekend,
      score: Math.round(avgScore),
      peakWindKts: Math.round(peakWind),
      peakWaveHtFt: Math.round(peakWave * 10) / 10,
      avgTempF: Math.round(avgTemp),
      bestWindowStart: bestStart,
      bestWindowEnd: bestEnd,
      bestWindowLabel,
      hours: daytimeHours,
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

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/forecast?lat=${SF_BAY_LAT}&lng=${SF_BAY_LNG}&days=7`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ForecastResponse = await res.json();
      setForecast(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forecast');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const days = useMemo(() => {
    if (!forecast?.hours.length) return [];
    return computeDaySummaries(forecast.hours, activity);
  }, [forecast, activity]);

  const bestDayIdx = useMemo(() => {
    if (days.length === 0) return -1;
    let bestIdx = 0;
    let bestScore = -1;
    for (let i = 0; i < days.length; i++) {
      if (days[i].score > bestScore) {
        bestScore = days[i].score;
        bestIdx = i;
      }
    }
    return bestIdx;
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-[var(--foreground)]">
            7-Day Forecast
          </h2>
          <span className="text-xs text-[var(--muted)]">
            SF Bay &middot; Live from Open-Meteo
          </span>
        </div>
        <button
          onClick={fetchForecast}
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          title="Refresh forecast"
        >
          Refresh
        </button>
      </div>

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

            {/* Conditions */}
            <div className="space-y-0.5 text-[11px] text-[var(--muted)]">
              <div className="flex justify-between">
                <span>Wind</span>
                <span className="font-mono text-[var(--foreground)]">
                  {day.peakWindKts}kt
                </span>
              </div>
              <div className="flex justify-between">
                <span>Waves</span>
                <span className="font-mono text-[var(--foreground)]">
                  {day.peakWaveHtFt}ft
                </span>
              </div>
              <div className="flex justify-between">
                <span>Temp</span>
                <span className="font-mono text-[var(--foreground)]">
                  {day.avgTempF}&deg;F
                </span>
              </div>
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
              <th className="text-right py-1 px-2 font-medium">Score</th>
              <th className="text-right py-1 px-2 font-medium">Wind</th>
              <th className="text-right py-1 px-2 font-medium">Gust</th>
              <th className="text-right py-1 px-2 font-medium">Waves</th>
              <th className="text-right py-1 px-2 font-medium">Temp</th>
              <th className="text-right py-1 pl-2 font-medium">Cloud</th>
            </tr>
          </thead>
          <tbody>
            {day.hours.map((h) => {
              const hour = new Date(h.time).getHours();
              const score = activityScore(
                activity,
                h.windSpeedKts,
                h.waveHeightFt,
                h.wavePeriodS > 0 ? h.wavePeriodS : 3
              );
              return (
                <tr
                  key={h.time}
                  className="border-b border-[var(--border)]/50 hover:bg-[var(--card)]"
                >
                  <td className="py-1 pr-3 font-mono text-[var(--foreground)]">
                    {formatHour(hour)}
                  </td>
                  <td className="py-1 px-2 text-right">
                    <ScoreBadge score={score} size="sm" />
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-[var(--foreground)]">
                    {Math.round(h.windSpeedKts)}kt
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-[var(--muted)]">
                    {Math.round(h.windGustKts)}kt
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-[var(--foreground)]">
                    {(Math.round(h.waveHeightFt * 10) / 10).toFixed(1)}ft
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-[var(--foreground)]">
                    {Math.round(h.tempF)}&deg;
                  </td>
                  <td className="py-1 pl-2 text-right font-mono text-[var(--muted)]">
                    {Math.round(h.cloudCoverPct)}%
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
