'use client';

import { useState, useMemo } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { useAppStore } from '@/store';
import { getActivity } from '@/data/activities';
import { getDocksForDestination } from '@/data/cities/sf-bay/docks';
import { routeDifficulty } from '@/lib/route-difficulty';
import { difficultyToConditionTier, getTierInfo } from '@/lib/condition-tier';
import { getEventsForTrip } from '@/lib/event-relevance';
import { haversineDistanceMi } from '@/engine/scoring';

interface CompareProps {
  destIds: string[];
  onClose: () => void;
  originId: string;
}

export function ComparePanel({ destIds, onClose, originId }: CompareProps) {
  const { activity, vessel, month, hour } = useAppStore();
  const act = getActivity(activity);
  const origin = sfBay.destinations.find(d => d.id === originId);

  const columns = useMemo(() => {
    return destIds.map(id => {
      const dest = sfBay.destinations.find(d => d.id === id);
      if (!dest || !origin) return null;

      const key = `${originId}-${id}`;
      const revKey = `${id}-${originId}`;
      const dist = sfBay.distances[key] ?? sfBay.distances[revKey] ??
        Math.round(haversineDistanceMi(origin.lat, origin.lng, dest.lat, dest.lng) * 10) / 10;
      const transit = vessel.cruiseSpeed > 0 ? Math.round((dist / vessel.cruiseSpeed) * 60) : 0;
      const difficulty = routeDifficulty(dist, id, vessel, act, month, hour);
      const tier = difficultyToConditionTier(difficulty.level);
      const tierInfo = getTierInfo(tier);
      const docks = getDocksForDestination(id);
      const events = getEventsForTrip(month + 1, activity).filter(e => e.sentiment !== 'neutral');
      const diningCount = docks.reduce((sum, d) => sum + d.dineOptions.length, 0);

      return { dest, dist, transit, difficulty, tier, tierInfo, docks, events, diningCount };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [destIds, originId, origin, activity, vessel, month, hour, act]);

  if (columns.length < 2) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-5 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-compass-gold">Compare Destinations</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]">✕</button>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map(col => (
            <div key={col.dest.id} className="space-y-3">
              {/* Name + tier */}
              <div className={`${col.tierInfo.bgClass} border ${col.tierInfo.borderClass} rounded-xl p-3 text-center`}>
                <h3 className="font-semibold text-[var(--foreground)]">{col.dest.name}</h3>
                <div className={`text-sm font-medium mt-1 ${col.tierInfo.textClass}`}>
                  {col.tierInfo.icon} {col.tierInfo.label}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Distance</span>
                  <span className="font-medium">{col.dist} mi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Transit</span>
                  <span className="font-medium">{col.transit} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Docks</span>
                  <span className="font-medium">{col.docks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Dining</span>
                  <span className="font-medium">{col.diningCount > 0 ? `${col.diningCount} restaurant${col.diningCount !== 1 ? 's' : ''}` : 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Difficulty</span>
                  <span className="font-medium">{col.difficulty.reason}</span>
                </div>
              </div>

              {/* Events this month */}
              {col.events.length > 0 && (
                <div className="text-2xs text-[var(--muted)]">
                  {col.events.filter(e => e.sentiment === 'fun').length > 0 && (
                    <span className="text-reef-teal">{col.events.filter(e => e.sentiment === 'fun').length} fun events</span>
                  )}
                  {col.events.filter(e => e.sentiment === 'avoid').length > 0 && (
                    <span className="text-danger-red ml-2">{col.events.filter(e => e.sentiment === 'avoid').length} to avoid</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-2xs text-[var(--muted)] text-center">
          Conditions based on seasonal patterns for {act.name.toLowerCase()}. Verify before departure.
        </p>
      </div>
    </div>
  );
}
