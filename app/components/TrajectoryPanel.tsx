'use client';

import { useMemo } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { getActivity } from '@/data/activities';
import { useAppStore } from '@/store';
import { seasonalPlanning } from '@/data/cities/sf-bay/seasonal-planning';
import { verifiedRoutes } from '@/data/cities/sf-bay/verified-routes';
import { getDocksForDestination } from '@/data/cities/sf-bay/docks';
import { haversineDistanceMi } from '@/engine/scoring';
import { parseMinBridgeClearanceFt } from '@/lib/bridge-parse';
import { getCurrentTimingForRoute } from '@/data/cities/sf-bay/current-timing';
import type { Source } from '@/engine/types';

interface TrajectoryPanelProps {
  originId: string;
  destinationId: string;
  onClose: () => void;
}

export function TrajectoryPanel({ originId, destinationId, onClose }: TrajectoryPanelProps) {
  const { activity, vessel, month } = useAppStore();

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

  const currentAdvice = verified ? getCurrentTimingForRoute(verified.hazards) : [];

  // Collect all sources for attribution
  const allSources = useMemo(() => {
    const seen = new Set<string>();
    const sources: Source[] = [];

    const addSource = (src: Source) => {
      const key = src.name + (src.section || '');
      if (!seen.has(key)) {
        seen.add(key);
        sources.push(src);
      }
    };

    // Route sources
    if (verified) {
      verified.sources?.forEach(addSource);
    }

    // Dock sources
    dockList.forEach(dock => {
      dock.sources?.forEach(addSource);
    });

    // Current timing sources
    currentAdvice.forEach(advice => {
      advice.sources?.forEach(addSource);
    });

    return sources;
  }, [verified, dockList, currentAdvice]);

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

        {/* Fuel range warning */}
        {fuelGallons !== null && vessel.fuelCapacity && fuelGallons > vessel.fuelCapacity * 0.8 && (
          <div className="bg-danger-red/10 border border-danger-red/30 rounded-lg p-2 text-xs text-danger-red">
            ⚠ Round trip requires {fuelGallons} gal — {Math.round(fuelGallons / vessel.fuelCapacity * 100)}% of your {vessel.fuelCapacity} gal tank. Refuel before departure or plan a fuel stop.
          </div>
        )}

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
            {verified.minDepthFt < vessel.draft + 2 && (
              <div className="bg-warning-amber/10 border border-warning-amber/30 rounded-lg p-2 text-xs text-warning-amber mt-2">
                ⚠ Route min depth ({verified.minDepthFt} ft) is tight for your {vessel.draft} ft draft. Check tide tables.
              </div>
            )}
            {vessel.mastHeight && (() => {
              const minClearance = parseMinBridgeClearanceFt(verified.bridges);
              if (minClearance === null) return null;
              if (minClearance < vessel.mastHeight + 5) {
                return (
                  <div className="bg-danger-red/10 border border-danger-red/30 rounded-lg p-2 text-xs text-danger-red mt-1">
                    ⚠ Bridge clearance ({minClearance} ft) may be insufficient for your {vessel.mastHeight} ft mast. Check tide height — clearance varies with tide.
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Current Timing */}
        {currentAdvice.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-safety-blue uppercase tracking-wider">
              Current Timing
            </h3>
            {currentAdvice.map((advice, i) => (
              <div key={i} className="bg-safety-blue/5 border border-safety-blue/20 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--foreground)]">{advice.zoneName}</span>
                  <a href={advice.noaaStationUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-safety-blue hover:underline">
                    NOAA Predictions →
                  </a>
                </div>
                <div className="flex gap-3 text-[10px] text-[var(--muted)]">
                  <span>Max ebb: {advice.maxEbbKts}</span>
                  <span>Max flood: {advice.maxFloodKts}</span>
                </div>
                <p className="text-xs text-[var(--secondary)]">{advice.crossingAdvice}</p>
                <p className="text-[10px] text-[var(--muted)] italic">{advice.slackAdvice}</p>
              </div>
            ))}
          </div>
        )}

        {/* Docking Options */}
        {dockList.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-reef-teal uppercase tracking-wider">
              Docking Options
            </h3>
            {dockList.map((dock, i) => {
              const dockIcon: Record<string, string> = {
                restaurant_dock: '\u{1F374}',
                marina_guest: '\u2693',
                public_guest: '\u{1F3DB}',
                state_park: '\u{1F332}',
                yacht_club: '\u26F5',
              };
              return (
                <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {dockIcon[dock.dockType] ?? ''} {dock.name}
                    </span>
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
                  {dock.amenities && (
                    <div className="text-[10px] text-[var(--muted)]">{dock.amenities}</div>
                  )}
                  {dock.dineOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dock.dineOptions.map((restaurant, j) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-reef-teal/10 text-reef-teal border border-reef-teal/20">
                          {'\u{1F374}'} {restaurant}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {(() => {
              const monthData = seasonalPlanning.months[month];
              const destZone = destination.zone;
              const zoneConditions = monthData?.zones?.[destZone];
              if (!zoneConditions) return null;
              return (
                <div className="bg-compass-gold/5 border border-compass-gold/20 rounded-lg p-3 mt-2">
                  <div className="text-[10px] font-medium text-compass-gold uppercase tracking-wider mb-1">
                    {monthData.month} Conditions — {destZone.replace(/_/g, ' ')}
                  </div>
                  <p className="text-xs text-[var(--secondary)]">{zoneConditions.planningSummary}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] text-[var(--muted)]">
                    <span>AM: {zoneConditions.morningWind}</span>
                    <span>PM: {zoneConditions.afternoonWind}</span>
                    <span>Waves: {zoneConditions.waveHeight}</span>
                    <span>Water: {zoneConditions.waterTempF}&deg;F</span>
                    <span>Fog: {zoneConditions.fogProbability}</span>
                  </div>
                </div>
              );
            })()}
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

        {/* Sources — every data point is attributed */}
        {allSources.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
              Sources
            </h3>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 space-y-1.5">
              <p className="text-[10px] text-[var(--muted)] mb-2">
                Verify all information before departure. Data may have changed since last verified.
              </p>
              {allSources.map((src, i) => (
                <div key={i} className="text-[11px]">
                  {src.url ? (
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-safety-blue hover:underline">
                      {src.name}
                    </a>
                  ) : (
                    <span className="text-[var(--secondary)]">{src.name}</span>
                  )}
                  {src.section && <span className="text-[var(--muted)] ml-1">({src.section})</span>}
                  <span className="text-[var(--muted)] ml-1">· Verified {src.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
