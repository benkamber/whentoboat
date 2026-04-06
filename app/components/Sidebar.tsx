'use client';

import { useRef } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { activities, getActivity } from '@/data/activities';
import { BoatSelector } from './BoatSelector';
import { getDocksForDestination } from '@/data/cities/sf-bay/docks';
import { parseMinDepthFt } from '@/lib/depth-parse';
import { verifiedRoutes } from '@/data/cities/sf-bay/verified-routes';
import type { ActivityType, VesselProfile } from '@/engine/types';
import type { Destination } from '@/engine/types';

interface SimplifiedRoute {
  dest: Destination;
  distance: number;
  transitMinutes: number;
  destinationId: string;
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
  const currentActivity = getActivity(activity);
  const origin = sfBay.destinations.find((d) => d.id === homeBaseId) ?? sfBay.destinations[0];

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
      {/* Sidebar header: Activity + Home Base */}
      <div className="p-3 border-b border-[var(--border)] space-y-2 shrink-0 bg-[var(--card)]">
        {/* Activity selector */}
        <div className="flex gap-1">
          {activities.map((a) => (
            <button
              key={a.id}
              onClick={() => setActivity(a.id)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activity === a.id
                  ? 'bg-reef-teal text-white shadow-sm'
                  : 'bg-[var(--card-elevated)] text-[var(--secondary)] border border-[var(--border)] hover:border-reef-teal/50'
              }`}
            >
              {a.icon} {a.name}
            </button>
          ))}
        </div>

        {/* Home base selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)] shrink-0">From:</span>
          <select
            value={homeBaseId}
            onChange={(e) => setHomeBase(e.target.value)}
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

        {vessel.draft > 1 && (
          <label className="flex items-center gap-2 px-1 text-xs text-[var(--muted)] cursor-pointer select-none">
            <input type="checkbox" checked={hideShallow} onChange={(e) => setHideShallow(e.target.checked)} className="rounded accent-reef-teal" />
            Hide too-shallow for {vessel.draft}ft draft
          </label>
        )}
        {hideShallow && (
          <div className="text-[10px] text-warning-amber px-2">
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
                    <div className="text-[11px] text-[var(--muted)]">
                      {route.distance < 0.5 ? '< 1' : route.distance} mi · {(activity === 'kayak' || activity === 'sup')
                        ? `${route.transitMinutes}–${Math.round(route.transitMinutes * 1.8)} min (conditions dependent)`
                        : `${route.transitMinutes} min`
                      }
                    </div>
                    {/* Dock info */}
                    {(() => {
                      const dockList = getDocksForDestination(route.destinationId);
                      if (dockList.length === 0) return null;
                      const dock = dockList[0]; // primary dock
                      return (
                        <div className="text-[10px] text-[var(--muted)] mt-1">
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
                              <span className="text-[10px] text-reef-teal ml-1">
                                · {dineCount} restaurant{dineCount !== 1 ? 's' : ''}
                              </span>
                            );
                          })()}
                        </div>
                      );
                    })()}
                    {/* Draft warning */}
                    {route.dest.minDepth !== null && route.dest.minDepth < vessel.draft + 1 && (
                      <div className="text-[10px] text-warning-amber mt-0.5">
                        ⚠ Shallow — {route.dest.minDepth}ft depth, your draft is {vessel.draft}ft
                      </div>
                    )}
                    {/* Fuel range warning */}
                    {vessel.gph && vessel.fuelCapacity && (() => {
                      const fuelRT = vessel.cruiseSpeed > 0 ? (route.distance * 2 / vessel.cruiseSpeed) * vessel.gph : 0;
                      if (fuelRT > vessel.fuelCapacity * 0.8) {
                        return (
                          <div className="text-[10px] text-danger-red mt-0.5">
                            ⚠ {Math.round(fuelRT)} gal RT — exceeds 80% of {vessel.fuelCapacity} gal tank
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {/* Endurance warning for human-powered vessels */}
                    {vessel.maxEnduranceHours && route.transitMinutes > vessel.maxEnduranceHours * 60 * 0.4 && (
                      <div className="text-[10px] text-warning-amber mt-0.5">
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
                          <div className="text-[10px] text-danger-red font-medium mt-0.5 bg-danger-red/10 rounded px-1.5 py-0.5">
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
            <div className="text-center py-8 px-4 space-y-3">
              <p className="text-sm text-[var(--muted)]">
                No destinations within {currentActivity.name.toLowerCase()} range from {origin.name}
              </p>
              <p className="text-xs text-[var(--secondary)]">
                Try a different departure point or switch to a different activity.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                {activities.filter(a => a.id !== activity).slice(0, 2).map(a => (
                  <button
                    key={a.id}
                    onClick={() => setActivity(a.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--card-elevated)] text-[var(--secondary)] border border-[var(--border)] hover:border-reef-teal transition-colors"
                  >
                    Try {a.icon} {a.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
