'use client';

import { useMemo } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { useAppStore } from '@/store';
import { getActivity } from '@/data/activities';
import { analyzeTrajectory } from '@/engine/trajectory';

// Popular destinations to compute departure window for (in priority order)
const POPULAR_DESTS = ['ang', 'tib', 'clp', 'p39', 'brk'];

export function DepartureBanner() {
  const { activity, month, hour, vessel, homeBaseId } = useAppStore();

  const window = useMemo(() => {
    const origin = sfBay.destinations.find(d => d.id === homeBaseId);
    if (!origin) return null;

    const act = getActivity(activity);

    // Find first popular destination that's valid for this activity
    for (const destId of POPULAR_DESTS) {
      const dest = sfBay.destinations.find(d => d.id === destId);
      if (!dest || !dest.activityTags.includes(activity)) continue;
      if (dest.id === origin.id) continue;

      try {
        const trajectory = analyzeTrajectory(origin, dest, month, hour, act, vessel, sfBay);
        if (trajectory.departureWindow && trajectory.departureWindow.start !== trajectory.departureWindow.end) {
          return {
            label: trajectory.departureWindow.label,
            destName: dest.name,
            score: trajectory.overallScore,
          };
        }
      } catch {
        continue;
      }
    }
    return null;
  }, [activity, month, hour, vessel, homeBaseId]);

  if (!window) return null;

  const scoreColor = window.score >= 7 ? 'text-reef-teal' : window.score >= 4 ? 'text-compass-gold' : 'text-warning-amber';

  return (
    <div className="px-2 pt-2">
      <div className="bg-reef-teal/5 border border-reef-teal/20 rounded-lg px-3 py-2 space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-reef-teal">Best departure today</span>
          <span className={`text-2xs font-semibold ${scoreColor}`}>{window.score}/10</span>
        </div>
        <div className="text-sm font-semibold text-[var(--foreground)]">{window.label}</div>
        <div className="text-2xs text-[var(--muted)]">
          For {window.destName} · Based on tidal patterns
        </div>
      </div>
    </div>
  );
}
