'use client';

import { useRef, useState, useEffect } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { activities, getActivity } from '@/data/activities';
import { BoatSelector } from './BoatSelector';
import { getDocksForDestination } from '@/data/cities/sf-bay/docks';
import { parseMinDepthFt } from '@/lib/depth-parse';
import { verifiedRoutes } from '@/data/cities/sf-bay/verified-routes';
import { track } from '@/lib/analytics';
import type { ActivityType, VesselProfile } from '@/engine/types';
import type { Destination } from '@/engine/types';
import type { ComfortTier } from '@/lib/route-comfort';

interface SimplifiedRoute {
  dest: Destination;
  distance: number;
  transitMinutes: number;
  destinationId: string;
  comfort: ComfortTier;
  crossesTss: boolean;
  isValidatedRoute: boolean;
}

interface SidebarProps {
  activity: ActivityType;
  setActivity: (a: ActivityType) => void;
  homeBaseId: string;
  setHomeBase: (id: string) => void;
  vessel: VesselProfile;
  destinations: SimplifiedRoute[];
  onCardClick: (destId: string) => void;
  onCardHover: (destId: string | null) => void;
  selectedDestId: string | null;
  hoveredDestId: string | null;
  hideShallow: boolean;
  setHideShallow: (v: boolean) => void;
  sidebarOpen: boolean;
}

export function Sidebar({
  activity,
  setActivity,
  homeBaseId,
  setHomeBase,
  vessel,
  destinations,
  onCardClick,
  onCardHover,
  selectedDestId,
  hoveredDestId,
  hideShallow,
  setHideShallow,
  sidebarOpen,
}: SidebarProps) {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const originSelectRef = useRef<HTMLSelectElement>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [restaurantsOnly, setRestaurantsOnly] = useState(false);
  const currentActivity = getActivity(activity);
  const origin = sfBay.destinations.find((d) => d.id === homeBaseId) ?? sfBay.destinations[0];

  // Auto-expand the controls and focus the origin picker — used by the
  // empty state CTA when the user needs to change something to get results.
  const openControlsAndFocusOrigin = () => {
    setControlsOpen(true);
    // wait one frame for the select to mount, then focus
    requestAnimationFrame(() => {
      originSelectRef.current?.focus();
    });
  };

  // Fire empty_state_shown once per (activity, origin) combo when the
  // result list is empty. Helps measure which configurations dead-end users.
  useEffect(() => {
    if (destinations.length === 0) {
      track('empty_state_shown', {
        activity,
        origin_id: homeBaseId,
        max_range_round_trip_mi: currentActivity.maxRangeRoundTripMi,
      });
    }
  }, [destinations.length, activity, homeBaseId, currentActivity.maxRangeRoundTripMi]);

  return (
    <div
      className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        absolute md:relative z-20
        w-full md:w-[360px] lg:w-[380px]
        h-full
        bg-[var(--background)]
        border-r border-[var(--border)]
        flex flex-col
        transition-transform duration-200 ease-out
        shrink-0
      `}
    >
      {/* Sidebar header: compact summary chip + collapsible controls */}
      <div className="border-b border-[var(--border)] shrink-0 bg-[var(--card)]">
        {/* Summary chip — always visible, tap to expand controls */}
        <button
          onClick={() => setControlsOpen((c) => !c)}
          aria-expanded={controlsOpen}
          aria-controls="sidebar-controls"
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-[var(--card-elevated)] transition-colors text-left"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-base shrink-0" aria-hidden="true">{currentActivity.icon}</span>
            <span className="text-sm font-medium text-[var(--foreground)] truncate">
              {currentActivity.name}
            </span>
            <span className="text-xs text-[var(--muted)] shrink-0">from</span>
            <span className="text-sm font-medium text-[var(--foreground)] truncate">
              {origin.name}
            </span>
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-[var(--muted)] transition-transform ${controlsOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path d="M3 5l4 4 4-4" />
          </svg>
        </button>

        {/* Collapsible controls panel */}
        {controlsOpen && (
          <div id="sidebar-controls" className="p-3 pt-0 space-y-2">
            {/* Activity selector */}
            <div className="flex gap-1">
              {activities.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    if (a.id !== activity) {
                      track('activity_selected', {
                        activity: a.id,
                        previous_activity: activity,
                      });
                    }
                    setActivity(a.id);
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activity === a.id
                      ? 'bg-reef-teal text-white shadow-sm'
                      : 'bg-[var(--card-elevated)] text-[var(--secondary)] border border-[var(--border)] hover:border-reef-teal/50'
                  }`}
                  aria-pressed={activity === a.id}
                >
                  <span aria-hidden="true">{a.icon}</span> {a.name}
                </button>
              ))}
            </div>

            {/* Home base selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted)] shrink-0">From:</span>
              <select
                ref={originSelectRef}
                value={homeBaseId}
                onChange={(e) => {
                  if (e.target.value !== homeBaseId) {
                    track('origin_selected', {
                      origin_id: e.target.value,
                      source: 'picker',
                    });
                  }
                  setHomeBase(e.target.value);
                }}
                className="flex-1 bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-[var(--foreground)] appearance-none cursor-pointer focus:border-compass-gold focus:outline-none"
              >
                {sfBay.destinations
                  .filter((d) => d.launchRamp != null && d.id !== 'ggb')
                  .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vessel selector — inline preset picker + customize */}
            <BoatSelector />

            <label className="flex items-center gap-2 px-1 text-xs text-[var(--muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={restaurantsOnly}
                onChange={(e) => setRestaurantsOnly(e.target.checked)}
                className="rounded accent-reef-teal"
              />
              <span aria-hidden="true">🍽</span> Only show restaurant docks
            </label>

            {vessel.draft > 1 && (
              <label className="flex items-center gap-2 px-1 text-xs text-[var(--muted)] cursor-pointer select-none">
                <input type="checkbox" checked={hideShallow} onChange={(e) => setHideShallow(e.target.checked)} className="rounded accent-reef-teal" />
                Hide too-shallow for {vessel.draft}ft draft
              </label>
            )}
            {hideShallow && (
              <div className="text-2xs text-warning-amber px-2">
                {destinations.filter(r => {
                  if (r.dest.minDepth !== null && r.dest.minDepth < vessel.draft + 1) return true;
                  return getDocksForDestination(r.destinationId).some(d => {
                    const p = parseMinDepthFt(d.depthFt);
                    return p !== null && p < vessel.draft + 1;
                  });
                }).length} hidden (too shallow)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrollable destination list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1.5">
          {destinations.map((route, i) => {
            const isSelected = selectedDestId === route.destinationId;
            const isHovered = hoveredDestId === route.destinationId;

            const isTooShallow = (() => {
              if (route.dest.minDepth !== null && route.dest.minDepth < vessel.draft + 1) return true;
              const dockList = getDocksForDestination(route.destinationId);
              return dockList.some(d => {
                const parsed = parseMinDepthFt(d.depthFt);
                return parsed !== null && parsed < vessel.draft + 1;
              });
            })();

            if (hideShallow && isTooShallow) return null;

            if (restaurantsOnly) {
              const dockList = getDocksForDestination(route.destinationId);
              const hasDining = dockList.some((d) => d.dineOptions.length > 0);
              if (!hasDining) return null;
            }

            return (
              <div
                key={route.destinationId}
                ref={(el) => {
                  if (el) cardRefs.current.set(route.destinationId, el);
                }}
                onClick={() => onCardClick(route.destinationId)}
                onMouseEnter={() => onCardHover(route.destinationId)}
                onMouseLeave={() => onCardHover(null)}
                className={`
                  rounded-lg p-3 cursor-pointer transition-all border
                  ${isTooShallow ? 'opacity-40' : ''}
                  ${isSelected
                    ? 'border-reef-teal bg-reef-teal/10 shadow-md shadow-reef-teal/10'
                    : isHovered
                      ? 'border-[var(--border)] bg-[var(--card-elevated)]'
                      : 'border-transparent bg-[var(--card)] hover:bg-[var(--card-elevated)]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Rank number */}
                  <span className="text-xs font-bold text-[var(--muted)] w-4 text-right shrink-0">
                    {i + 1}
                  </span>

                  {/* Destination info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">
                      {route.dest.name}
                    </h3>
                    <div className="text-2xs text-[var(--muted)]">
                      {(() => {
                        // Conditions multiplier: paddlers face wind/current swing
                        // hardest, sailboats next, powerboats least.
                        const mult =
                          activity === 'kayak' || activity === 'sup' ? 1.8
                          : activity === 'casual_sail' ? 1.5
                          : 1.3;
                        const low = route.transitMinutes;
                        const high = Math.round(route.transitMinutes * mult);
                        const distLabel = route.distance < 0.5 ? '< 1' : route.distance;
                        return `${distLabel} mi · ${low}–${high} min (conditions dependent)`;
                      })()}
                    </div>
                    {/* Dock info */}
                    {(() => {
                      const dockList = getDocksForDestination(route.destinationId);
                      if (dockList.length === 0) return null;
                      const dock = dockList[0]; // primary dock
                      return (
                        <div className="text-2xs text-[var(--muted)] mt-1">
                          {dock.dockType === 'restaurant_dock' ? 'Restaurant dock' :
                           dock.dockType === 'public_guest' ? 'Public guest dock' :
                           dock.dockType === 'state_park' ? 'State park dock' : 'Guest slips'} · {dock.fees}
                          {dock.restrictions.includes('GROUNDING') || dock.restrictions.includes('grounding') ? (
                            <span className="text-warning-amber ml-1">⚠ Shallow</span>
                          ) : null}
                          {(() => {
                            const hasDining = dockList.some(d => d.dineOptions.length > 0);
                            if (!hasDining) return null;
                            const dineCount = dockList.reduce((sum, d) => sum + d.dineOptions.length, 0);
                            return (
                              <span className="text-2xs text-reef-teal ml-1">
                                · {dineCount} restaurant{dineCount !== 1 ? 's' : ''}
                              </span>
                            );
                          })()}
                        </div>
                      );
                    })()}
                    {/* Draft warning */}
                    {route.dest.minDepth !== null && route.dest.minDepth < vessel.draft + 1 && (
                      <div className="text-safety text-warning-amber mt-1">
                        ⚠ Shallow — {route.dest.minDepth}ft depth, your draft is {vessel.draft}ft
                      </div>
                    )}
                    {/* Fuel range warning */}
                    {vessel.gph && vessel.fuelCapacity && (() => {
                      const fuelRT = vessel.cruiseSpeed > 0 ? (route.distance * 2 / vessel.cruiseSpeed) * vessel.gph : 0;
                      if (fuelRT > vessel.fuelCapacity * 0.8) {
                        return (
                          <div className="text-safety text-danger-red mt-1">
                            ⚠ {Math.round(fuelRT)} gal RT — exceeds 80% of {vessel.fuelCapacity} gal tank
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {/* Endurance warning for human-powered vessels */}
                    {vessel.maxEnduranceHours && route.transitMinutes > vessel.maxEnduranceHours * 60 * 0.4 && (
                      <div className="text-safety text-warning-amber mt-1">
                        ⚠ {route.transitMinutes} min one-way — {Math.round(route.transitMinutes / 60 * 10) / 10} hrs of your {vessel.maxEnduranceHours} hr endurance
                      </div>
                    )}
                    {/* TSS crossing warning for human-powered craft */}
                    {(activity === 'kayak' || activity === 'sup') && (() => {
                      const vr = verifiedRoutes.find(r =>
                        (r.from === homeBaseId && r.to === route.destinationId) ||
                        (r.to === homeBaseId && r.from === route.destinationId)
                      );
                      if (vr?.crossesTss) {
                        return (
                          <div className="text-safety text-danger-red font-medium mt-1 bg-danger-red/10 rounded px-1.5 py-1">
                            ⚠ Crosses shipping lanes — advanced paddlers only, check conditions
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            );
          })}

          {destinations.length === 0 && (
            <div className="text-center py-10 px-4 space-y-4">
              <div className="text-2xl" aria-hidden="true">🗺</div>
              <p className="text-base font-semibold text-[var(--foreground)]">
                Nothing&apos;s in range from {origin.name}
              </p>
              <p className="text-sm text-[var(--secondary)] leading-relaxed">
                {currentActivity.maxRangeRoundTripMi != null
                  ? `${currentActivity.name}s are limited to a ${currentActivity.maxRangeRoundTripMi}-mile round-trip range. Try launching closer to where you want to go.`
                  : `No destinations match your current filters from this starting point.`}
              </p>
              <div className="space-y-2">
                <button
                  onClick={openControlsAndFocusOrigin}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-reef-teal text-white hover:bg-reef-teal/90 transition-colors"
                >
                  Try a different starting point
                </button>
                <div className="flex gap-2 justify-center flex-wrap pt-1">
                  {activities.filter(a => a.id !== activity).slice(0, 2).map(a => (
                    <button
                      key={a.id}
                      onClick={() => {
                        track('activity_selected', {
                          activity: a.id,
                          previous_activity: activity,
                        });
                        setActivity(a.id);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--card-elevated)] text-[var(--secondary)] border border-[var(--border)] hover:border-reef-teal transition-colors"
                    >
                      <span aria-hidden="true">{a.icon}</span> Try {a.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
