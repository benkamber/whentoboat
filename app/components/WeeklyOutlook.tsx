'use client';

import { useMemo } from 'react';
import { useLiveForecast } from '@/hooks/useLiveForecast';
import { useAppStore } from '@/store';
import { getActivity } from '@/data/activities';
import { sfBay } from '@/data/cities/sf-bay';
import { fullConditionsScore } from '@/engine/scoring';
import { getConditionTier, getTierInfo, type ConditionTier } from '@/lib/condition-tier';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayForecast {
  date: Date;
  dayName: string;
  tier: ConditionTier;
  score: number;
  amWind: number;
  isToday: boolean;
}

export function WeeklyOutlook() {
  const { activity, vessel, homeBaseId } = useAppStore();
  const { forecast, loading } = useLiveForecast();
  const origin = sfBay.destinations.find(d => d.id === homeBaseId);
  const act = getActivity(activity);

  const days = useMemo((): DayForecast[] => {
    if (!forecast || !origin) return [];

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const result: DayForecast[] = [];

    // Group forecast hours by date, score the best morning hour (8-11 AM)
    const byDate = new Map<string, typeof forecast.hours>();
    for (const h of forecast.hours) {
      const dateStr = h.time.split('T')[0];
      if (!byDate.has(dateStr)) byDate.set(dateStr, []);
      byDate.get(dateStr)!.push(h);
    }

    for (const [dateStr, hours] of byDate) {
      const date = new Date(dateStr + 'T12:00:00');
      // Score best morning hour (8-11 AM)
      const morningHours = hours.filter(h => {
        const hr = new Date(h.time).getHours();
        return hr >= 8 && hr <= 11;
      });

      if (morningHours.length === 0) continue;

      // Pick the best morning hour
      let bestScore = 0;
      let bestWind = 0;
      for (const h of morningHours) {
        const conditions = {
          windKts: h.windSpeedKts,
          windDirDeg: h.windDirDeg,
          windGustKts: h.windGustKts,
          waveHtFt: h.waveHeightFt >= 0 ? h.waveHeightFt : 1.5,
          wavePeriodS: h.wavePeriodS > 0 ? h.wavePeriodS : 3,
          waterTempF: h.waterTempF,
          airTempF: h.airTempF,
          currentKts: -1 as number,
          currentDirDeg: 0,
          visibilityMi: h.visibilityMi,
          tideFt: h.tideFt >= 0 ? h.tideFt : 3,
          tidePhase: (h.tidePhase === 'unknown' ? 'flood' : h.tidePhase) as 'flood' | 'ebb' | 'slack_high' | 'slack_low',
          isLiveForecast: true,
          isMissingWaveData: !h.waveDataAvailable,
          zoneId: origin.zone,
        };
        const { score } = fullConditionsScore(act, conditions, vessel);
        if (score > bestScore) {
          bestScore = score;
          bestWind = h.windSpeedKts;
        }
      }

      result.push({
        date,
        dayName: DAY_NAMES[date.getDay()],
        tier: getConditionTier(bestScore),
        score: bestScore,
        amWind: Math.round(bestWind),
        isToday: dateStr === todayStr,
      });
    }

    return result.slice(0, 7);
  }, [forecast, origin, act, vessel]);

  if (loading || days.length < 3) return null;

  const bestDay = days.filter(d => !d.isToday).sort((a, b) => b.score - a.score)[0];

  return (
    <div className="px-2 pt-2">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-medium text-compass-gold uppercase tracking-wider">7-Day Outlook</span>
          <span className="text-2xs text-[var(--muted)]">Morning conditions</span>
        </div>

        {/* Day dots */}
        <div className="flex gap-1">
          {days.map((day, i) => {
            const info = getTierInfo(day.tier);
            return (
              <div key={i} className="flex-1 text-center space-y-1">
                <div className={`text-2xs ${day.isToday ? 'text-compass-gold font-bold' : 'text-[var(--muted)]'}`}>
                  {day.dayName}
                </div>
                <div
                  className="mx-auto w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${info.color}25`, border: `2px solid ${info.color}` }}
                  title={`${day.dayName}: ${info.label} (wind ${day.amWind} kt)`}
                >
                  <span className="text-2xs" style={{ color: info.color }}>
                    {day.tier === 'looks-good' ? '✓' : day.tier === 'check-conditions' ? '!' : '✕'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Best day callout */}
        {bestDay && bestDay.tier === 'looks-good' && (
          <div className="text-2xs text-reef-teal">
            Best day: <span className="font-medium">{bestDay.dayName} morning</span> — {bestDay.amWind} kt wind
          </div>
        )}

        <p className="text-2xs text-[var(--muted)] italic">
          Based on forecast models — conditions can change. Verify before departure.
        </p>
      </div>
    </div>
  );
}
