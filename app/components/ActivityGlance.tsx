'use client';

import { useMemo } from 'react';
import { useLiveForecast } from '@/hooks/useLiveForecast';
import { useAppStore } from '@/store';
import { activities } from '@/data/activities';
import { sfBay } from '@/data/cities/sf-bay';
import { fullConditionsScore } from '@/engine/scoring';
import { getConditionTier, getTierInfo } from '@/lib/condition-tier';
import { vesselPresets } from '@/data/vessels';
import type { ActivityType } from '@/engine/types';

/**
 * Shows all activities ranked by current conditions at a glance.
 * This is the default first-screen for new users — answers
 * "What's good right now?" without requiring an activity selection.
 */
export function ActivityGlance({ onSelectActivity }: { onSelectActivity: (id: ActivityType) => void }) {
  const { homeBaseId } = useAppStore();
  const { forecast, loading, getConditionsForHour } = useLiveForecast();

  const origin = sfBay.destinations.find(d => d.id === homeBaseId);

  const ranked = useMemo(() => {
    if (!forecast || !origin) return null;

    const now = new Date();
    const currentHour = now.getHours();
    const conditions = getConditionsForHour(now, currentHour);
    if (!conditions) return null;

    const conditionsWithZone = { ...conditions, zoneId: origin.zone };

    return activities.map(act => {
      const vessel = vesselPresets.find(v => v.type === act.vesselType) ?? vesselPresets[0];
      const { score, factors } = fullConditionsScore(act, conditionsWithZone, vessel);
      const tier = getConditionTier(score);
      const info = getTierInfo(tier);
      const topFactor = factors.find(f => f.severity === 'high' || f.severity === 'medium');

      return {
        activity: act,
        score,
        tier,
        info,
        wind: Math.round(conditions.windKts),
        tidePhase: conditions.tidePhase,
        reason: topFactor?.description ?? (score >= 7 ? 'Good conditions' : 'Mixed conditions'),
      };
    }).sort((a, b) => b.score - a.score);
  }, [forecast, origin, getConditionsForHour]);

  if (loading) {
    return (
      <div className="px-2 pt-2">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-center text-sm text-[var(--muted)]">
          Checking conditions...
        </div>
      </div>
    );
  }

  if (!ranked) return null;

  return (
    <div className="px-2 pt-2">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 space-y-2">
        <div className="text-2xs font-medium text-compass-gold uppercase tracking-wider">
          Right now on SF Bay
        </div>

        <div className="space-y-1">
          {ranked.map(({ activity, info, wind, tidePhase }) => (
            <button
              key={activity.id}
              onClick={() => onSelectActivity(activity.id)}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--card-elevated)] transition-colors text-left"
            >
              <span className="text-lg shrink-0" aria-hidden="true">{activity.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-[var(--foreground)]">{activity.name}</span>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded text-2xs font-semibold border ${info.bgClass} ${info.borderClass} ${info.textClass}`}>
                {info.label}
              </span>
              <span className="text-2xs text-[var(--muted)] shrink-0 w-12 text-right">
                {wind} kt
              </span>
            </button>
          ))}
        </div>

        <p className="text-2xs text-[var(--muted)] italic pt-1 border-t border-[var(--border)]">
          Based on current forecast at {origin?.name ?? 'your location'}. Tap an activity to see destinations.
        </p>
      </div>
    </div>
  );
}
