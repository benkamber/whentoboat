'use client';

import { useMemo } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { getActivity } from '@/data/activities';
import { useAppStore } from '@/store';
import { verifiedRoutes } from '@/data/cities/sf-bay/verified-routes';
import { getDocksForDestination } from '@/data/cities/sf-bay/docks';
import { haversineDistanceMi } from '@/engine/scoring';

interface TrajectoryPanelProps {
  originId: string;
  destinationId: string;
  onClose: () => void;
}

export function TrajectoryPanel({ originId, destinationId, onClose }: TrajectoryPanelProps) {
  const { activity, vessel } = useAppStore();

  const routeInfo = useMemo(() => {
    const origin = sfBay.destinations.find((d) => d.id === originId);
    const dest = sfBay.destinations.find((d) => d.id === destinationId);
    if (!origin || !dest) return null;

    const act = getActivity(activity);

    // Find verified route
    const verified = verifiedRoutes.find(
      (r) =>
        (r.from === originId && r.to === destinationId) ||
        (r.from === destinationId && r.to === originId),
    );

    // Distance: use verified route NM converted to statute miles, or haversine fallback
    const distanceMi = verified
      ? Math.round(verified.distanceNm * 1.15078 * 10) / 10
      : Math.round(haversineDistanceMi(origin.lat, origin.lng, dest.lat, dest.lng) * 10) / 10;

    // Transit time in minutes
    const transitMinutes = vessel.cruiseSpeed > 0
      ? Math.round((distanceMi / vessel.cruiseSpeed) * 60)
      : null;

    // Round trip fuel: (distance * 2) / cruiseSpeed * GPH
    const fuelGallons = vessel.gph
      ? Math.round((distanceMi * 2 / vessel.cruiseSpeed) * vessel.gph * 10) / 10
      : null;

    // Docking options
    const dockList = getDocksForDestination(destinationId);

    // Before You Go checklist from activity
    const beforeYouGo = act.beforeYouGo;

    // Verify links from city
    const verifyLinks = sfBay.verifyLinks;

    return {
      origin,
      destination: dest,
      verified,
      distanceMi,
      transitMinutes,
      fuelGallons,
      dockList,
      beforeYouGo,
      verifyLinks,
    };
  }, [originId, destinationId, activity, vessel]);

  if (!routeInfo) return null;

  const { origin, destination, verified, distanceMi, transitMinutes, fuelGallons, dockList, beforeYouGo, verifyLinks } = routeInfo;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-[var(--background)] border-l border-[var(--border)] overflow-y-auto z-50 shadow-2xl">
      {/* Sticky header */}
      <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] p-4 z-10">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
            ✕ Close
          </button>
          <span className="text-xs text-[var(--muted)]">Route Details</span>
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold truncate">
            {origin.name} → {destination.name}
          </h2>
          <p className="text-xs text-[var(--muted)]">
            {distanceMi} mi
            {transitMinutes !== null && ` · ${transitMinutes} min`}
            {fuelGallons !== null && ` · ${fuelGallons} gal RT`}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Vessel specs */}
        <div className="bg-[var(--card-elevated)] rounded-lg p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Vessel</span>
            <span className="text-xs font-medium">{vessel.name}</span>
          </div>
          <div className="flex gap-3 mt-1 text-[10px] text-[var(--muted)]">
            <span>{vessel.loa}ft</span>
            <span>{vessel.cruiseSpeed}mph</span>
            {vessel.fuelCapacity && <span>{vessel.fuelCapacity}gal tank</span>}
            {vessel.gph && <span>{vessel.gph}GPH</span>}
            <span>{vessel.draft}ft draft</span>
          </div>
        </div>

        {/* No verified route warning */}
        {!verified && (
          <div className="bg-warning-amber/10 border border-warning-amber/30 rounded-lg p-3 text-sm text-warning-amber">
            ⚠ No verified route available for this destination pair. Route shown is approximate.
          </div>
        )}

        {/* Hazards */}
        {verified && verified.hazards && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-warning-amber uppercase tracking-wider">
              ⚠ Hazards
            </h3>
            <div className="bg-warning-amber/10 border border-warning-amber/30 rounded-lg p-3">
              <p className="text-sm text-warning-amber">{verified.hazards}</p>
            </div>
          </div>
        )}

        {/* Route Details */}
        {verified && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
              Route Details
            </h3>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Min depth</span>
                <span className="font-medium">{verified.minDepthFt} ft MLLW</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">TSS crossing</span>
                <span className={`font-medium ${verified.crossesTss ? 'text-warning-amber' : ''}`}>
                  {verified.crossesTss ? 'Yes — use caution' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Bridges</span>
                <span className="font-medium">{verified.bridges}</span>
              </div>
              {verified.notes && (
                <div className="pt-2 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--secondary)]">{verified.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Docking Options */}
        {dockList.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-reef-teal uppercase tracking-wider">
              Docking Options
            </h3>
            {dockList.map((dock, i) => (
              <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dock.name}</span>
                  <span className="text-[10px] text-reef-teal">
                    {dock.dockType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-xs text-[var(--muted)]">{dock.fees}</div>
                <div className="text-xs text-[var(--muted)]">{dock.hours}</div>
                <div className="text-xs text-[var(--muted)]">Depth: {dock.depthFt} · Max LOA: {dock.maxLoa}</div>
                {dock.restrictions && (
                  <div className="text-[10px] text-warning-amber">{dock.restrictions}</div>
                )}
                {dock.dineOptions.length > 0 && (
                  <div className="text-[10px] text-reef-teal">
                    Dining: {dock.dineOptions.join(', ')}
                  </div>
                )}
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
          Route data from NOAA charts and US Coast Pilot. Not a real-time forecast.
        </p>
      </div>
    </div>
  );
}
