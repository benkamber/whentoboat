'use client';

import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { getActivity } from '@/data/activities';
import { useAppStore } from '@/store';
import { seasonalPlanning } from '@/data/cities/sf-bay/seasonal-planning';
import { verifiedRoutes } from '@/data/cities/sf-bay/verified-routes';
import { getDocksForDestination } from '@/data/cities/sf-bay/docks';
import { haversineDistanceMi } from '@/engine/scoring';
import { analyzeTrajectory } from '@/engine/trajectory';
import { parseMinBridgeClearanceFt } from '@/lib/bridge-parse';
import { getCurrentTimingForRoute } from '@/data/cities/sf-bay/current-timing';
import { track } from '@/lib/analytics';
import { routeComfort, type ComfortTier } from '@/lib/route-comfort';
import { getEventsForTrip } from '@/lib/event-relevance';
import { Term } from './Term';
import type { Source } from '@/engine/types';

function BookmarkButton({ originId, destinationId }: { originId: string; destinationId: string }) {
  const { savedRoutes, saveRoute, removeSavedRoute, activity } = useAppStore();
  const isSaved = savedRoutes.some(r => r.originId === originId && r.destinationId === destinationId);

  return (
    <button
      onClick={() => {
        if (isSaved) {
          removeSavedRoute(originId, destinationId);
        } else {
          saveRoute(originId, destinationId, activity);
          track('route_saved', { origin_id: originId, destination_id: destinationId, activity });
        }
      }}
      aria-label={isSaved ? 'Remove from saved routes' : 'Save this route'}
      title={isSaved ? 'Remove bookmark' : 'Bookmark this route'}
      className={`text-sm transition-transform hover:scale-110 ${isSaved ? 'text-compass-gold' : 'text-[var(--muted)] hover:text-compass-gold'}`}
    >
      {isSaved ? '★' : '☆'}
    </button>
  );
}

type TabId = 'route' | 'conditions' | 'checklist';

const VERDICT: Record<ComfortTier, { emoji: string; label: string; tone: string }> = {
  comfortable: { emoji: '✅', label: 'Comfortable trip',           tone: 'text-emerald-400' },
  marginal:    { emoji: '⚠️', label: 'Marginal — watch conditions', tone: 'text-amber-400'   },
  challenging: { emoji: '🛑', label: 'Challenging — expert only',   tone: 'text-red-400'     },
};

interface TrajectoryPanelProps {
  originId: string;
  destinationId: string;
  onClose: () => void;
}

export function TrajectoryPanel({ originId, destinationId, onClose }: TrajectoryPanelProps) {
  const { activity, vessel, month, hour } = useAppStore();

  // Default tab is Checklist — that's the highest-value exit (the user's
  // pre-departure prep), so it's the right thing to surface first.
  const [activeTab, setActiveTab] = useState<TabId>('checklist');
  // Reset to Checklist whenever the user opens a new destination.
  useEffect(() => {
    setActiveTab('checklist');
  }, [destinationId]);

  // One feedback submission per panel-open.
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  useEffect(() => {
    setFeedback(null);
  }, [destinationId]);

  // Fire trusted_plan_confirmed at most once per panel-open. Resets when
  // the destinationId changes (i.e., user opens a new trajectory).
  const trustedFired = useRef<string | null>(null);
  const markTrusted = useCallback((via: 'source_click' | 'checklist_tick') => {
    if (trustedFired.current === destinationId) return;
    trustedFired.current = destinationId;
    track('trusted_plan_confirmed', {
      destination_id: destinationId,
      via,
      activity,
    });
  }, [destinationId, activity]);

  const trackSourceClick = useCallback((source_name: string, source_type: string) => {
    track('source_link_clicked', {
      source_name,
      source_type,
      destination_id: destinationId,
    });
    markTrusted('source_click');
  }, [destinationId, markTrusted]);

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
    const fuelGallons = vessel.gph && vessel.cruiseSpeed > 0
      ? Math.round((distanceMi * 2 / vessel.cruiseSpeed) * vessel.gph * 10) / 10
      : null;

    // Docking options
    const dockList = getDocksForDestination(destinationId);

    // Before You Go checklist from activity
    const beforeYouGo = act.beforeYouGo;

    // Verify links from city
    const verifyLinks = sfBay.verifyLinks;

    // Comfort verdict — same logic as the sidebar/map color tier so the
    // user sees a consistent reading of "is this a good trip for me".
    const comfort = routeComfort(distanceMi, vessel, act, dest.minDepth);

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
      comfort,
    };
  }, [originId, destinationId, activity, vessel]);

  if (!routeInfo) return null;

  const { origin, destination, verified, distanceMi, transitMinutes, fuelGallons, dockList, beforeYouGo, verifyLinks, comfort } = routeInfo;
  const verdict = VERDICT[comfort];

  // Top warning: pick the highest-severity message that applies, in order
  // of importance, so the verdict line tells the user what to actually worry
  // about (rather than dumping every advisory).
  const topWarning: string | null = (() => {
    if (fuelGallons !== null && vessel.fuelCapacity && fuelGallons > vessel.fuelCapacity * 0.8) {
      return 'fuel margin too tight';
    }
    if (verified?.crossesTss && (activity === 'kayak' || activity === 'sup')) {
      return 'crosses ship traffic';
    }
    if (verified && verified.minDepthFt < vessel.draft + 2) {
      return 'shallow for your draft';
    }
    if (vessel.maxEnduranceHours && transitMinutes !== null && transitMinutes > vessel.maxEnduranceHours * 60 * 0.4) {
      return 'long for your endurance';
    }
    return null;
  })();

  const shareHref = `/share?activity=${activity}&dest=${destinationId}&origin=${originId}&month=${month}&hour=${hour}`;

  const submitFeedback = (rating: 'up' | 'down') => {
    if (feedback) return;
    setFeedback(rating);
    track('feedback_submitted', {
      destination_id: destinationId,
      rating,
      activity,
      comfort_tier: comfort,
    });
  };

  const currentAdvice = verified ? getCurrentTimingForRoute(verified.hazards) : [];

  // Departure window advisor — uses full trajectory engine
  const trajectory = useMemo(() => {
    if (!routeInfo) return null;
    const act = getActivity(activity);
    return analyzeTrajectory(routeInfo.origin, routeInfo.destination, month, hour, act, vessel, sfBay);
  }, [routeInfo, activity, month, hour, vessel]);

  // Events relevant to this trip's month + activity
  const tripEvents = useMemo(() => {
    return getEventsForTrip(month + 1, activity).filter(e => e.sentiment !== 'neutral');
  }, [month, activity]);

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
    <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[340px] md:w-[400px] lg:w-[420px] bg-[var(--background)] border-l border-[var(--border)] overflow-y-auto z-50 shadow-2xl flex flex-col">
      {/* Sticky header — verdict line + close + share + tab strip */}
      <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] z-10 shrink-0">
        {/* Top row: close + route name + bookmark + share */}
        <div className="flex items-center justify-between gap-2 px-4 pt-4">
          <button
            onClick={onClose}
            aria-label="Close trip details"
            className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm shrink-0"
          >
            ✕ Close
          </button>
          <h2 className="text-sm font-semibold truncate flex-1 text-center px-2">
            {origin.name} → {destination.name}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <BookmarkButton originId={originId} destinationId={destinationId} />
            <a
              href={shareHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackSourceClick('share', 'share')}
              className="text-xs text-safety-blue hover:underline"
            >
              Share →
            </a>
          </div>
        </div>

        {/* Verdict block */}
        <div className="px-4 pt-3 pb-3">
          <div className={`flex items-center gap-2 text-base font-semibold ${verdict.tone}`}>
            <span aria-hidden="true">{verdict.emoji}</span>
            <span>{verdict.label}</span>
          </div>
          <div className="text-sm text-[var(--secondary)] mt-1">
            {distanceMi} mi
            {transitMinutes !== null && ` · ${transitMinutes} min one-way`}
            {fuelGallons !== null && ` · ${fuelGallons} gal RT`}
            {topWarning && (
              <span className="text-warning-amber"> · {topWarning}</span>
            )}
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex border-t border-[var(--border)]" role="tablist">
          {(['checklist', 'route', 'conditions'] as const).map((tabId) => {
            const labels: Record<TabId, string> = {
              checklist: 'Checklist',
              route: 'Route',
              conditions: 'Conditions',
            };
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tabId)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-reef-teal text-reef-teal bg-reef-teal/5'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {labels[tabId]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1">

        {/* ───────────────── CHECKLIST TAB ───────────────── */}
        {activeTab === 'checklist' && (
          <>

        {/* Before You Go */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-reef-teal uppercase tracking-wider">
            Before You Go
          </h3>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 space-y-2">
            {beforeYouGo.map((item, i) => (
              <label key={i} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-reef-teal"
                  onChange={(e) => {
                    track('checklist_item_toggled', {
                      item: item.text.slice(0, 60),
                      checked: e.target.checked,
                      destination_id: destinationId,
                    });
                    if (e.target.checked) markTrusted('checklist_tick');
                  }}
                />
                <span className="text-sm text-[var(--secondary)]">
                  {item.text}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackSourceClick(item.text.slice(0, 60), 'before_you_go')}
                      className="text-safety-blue ml-1 hover:underline"
                    >→</a>
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
                onClick={() => trackSourceClick(link.label, 'verify_conditions')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--card)] text-xs text-safety-blue hover:underline border border-[var(--border)]"
              >
                {link.label} →
              </a>
            ))}
          </div>
        </div>

        {/* Sources collapsed */}
        {allSources.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-[var(--muted)] uppercase tracking-wider hover:text-[var(--foreground)]">
              Sources ({allSources.length})
            </summary>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 space-y-1.5 mt-2">
              <p className="text-2xs text-[var(--muted)] mb-2 leading-relaxed">
                Verify all information before departure. Data may have changed since last verified.
              </p>
              {allSources.map((src, i) => (
                <div key={i} className="text-2xs">
                  {src.url ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackSourceClick(src.name, 'attribution')}
                      className="text-safety-blue hover:underline"
                    >
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
          </details>
        )}

        {/* Feedback chip */}
        <div className="border-t border-[var(--border)] pt-4">
          {feedback === null ? (
            <div className="flex items-center justify-center gap-3 text-xs text-[var(--muted)]">
              <span>Was this helpful?</span>
              <button
                onClick={() => submitFeedback('up')}
                aria-label="Mark as helpful"
                className="text-base hover:scale-110 transition-transform"
              >
                <span aria-hidden="true">👍</span>
              </button>
              <button
                onClick={() => submitFeedback('down')}
                aria-label="Mark as not helpful"
                className="text-base hover:scale-110 transition-transform"
              >
                <span aria-hidden="true">👎</span>
              </button>
            </div>
          ) : (
            <div className="text-center text-xs text-reef-teal">
              Thanks for the feedback.
            </div>
          )}
        </div>

          </>
        )}

        {/* ───────────────── ROUTE TAB ───────────────── */}
        {activeTab === 'route' && (
          <>

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
                <span className="text-[var(--muted)]">
                  Depth <Term id="mllw">at lowest tide</Term>
                </span>
                <span className="font-medium">{verified.minDepthFt} ft</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">
                  Crosses <Term id="tss">shipping lane</Term>
                </span>
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
                  <a
                    href={advice.noaaStationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackSourceClick('NOAA Predictions', 'noaa_currents')}
                    className="text-2xs text-safety-blue hover:underline"
                  >
                    NOAA Predictions →
                  </a>
                </div>
                <div className="flex gap-3 text-2xs text-[var(--muted)]">
                  <span>Max ebb: {advice.maxEbbKts}</span>
                  <span>Max flood: {advice.maxFloodKts}</span>
                </div>
                <p className="text-xs text-[var(--secondary)]">{advice.crossingAdvice}</p>
                <p className="text-2xs text-[var(--muted)] italic">{advice.slackAdvice}</p>
              </div>
            ))}
          </div>
        )}

        {/* Departure Windows */}
        {trajectory && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-reef-teal uppercase tracking-wider">
              Departure Windows
            </h3>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-2xs text-[var(--muted)]">Best departure</span>
                  <p className="text-sm font-semibold text-reef-teal">{trajectory.departureWindow.label}</p>
                </div>
                <div>
                  <span className="text-2xs text-[var(--muted)]">Best return</span>
                  <p className="text-sm font-semibold text-compass-gold">{trajectory.returnWindow.label}</p>
                </div>
              </div>

              {/* Mini hourly scores */}
              <div className="flex gap-px items-end h-12">
                {trajectory.hourlyProfile.map((h) => {
                  const height = Math.max(8, (h.score / 10) * 100);
                  const color = h.score >= 7 ? '#10b981' : h.score >= 5 ? '#f59e0b' : '#ef4444';
                  return (
                    <div
                      key={h.hour}
                      className="flex-1 rounded-t-sm"
                      style={{ height: `${height}%`, backgroundColor: color, opacity: 0.8 }}
                      title={`${h.hour}:00 — Score ${h.score}/10`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-2xs text-[var(--muted)]">
                <span>5 AM</span>
                <span>Noon</span>
                <span>10 PM</span>
              </div>

              {/* Warnings */}
              {trajectory.warnings.length > 0 && (
                <div className="border-t border-[var(--border)] pt-2 space-y-1">
                  {trajectory.warnings.slice(0, 2).map((w, i) => (
                    <p key={i} className="text-2xs text-warning-amber">{w}</p>
                  ))}
                </div>
              )}
            </div>
            <p className="text-2xs text-[var(--muted)] italic">
              Based on historical weather patterns and{' '}
              <a href="https://tidesandcurrents.noaa.gov/" target="_blank" rel="noopener noreferrer" className="text-safety-blue hover:underline">
                NOAA tidal predictions
              </a>. Not a real-time assessment. Always verify before departure.
            </p>
          </div>
        )}

          </>
        )}

        {/* ───────────────── CONDITIONS TAB ───────────────── */}
        {activeTab === 'conditions' && (
          <>

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
                    <span className="text-2xs text-reef-teal">
                      {dock.dockType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--muted)]">{dock.fees}</div>
                  <div className="text-xs text-[var(--muted)]">{dock.hours}</div>
                  <div className="text-xs text-[var(--muted)]">Depth: {dock.depthFt} · Max boat length: {dock.maxLoa}</div>
                  {dock.restrictions && (
                    <div className="text-safety text-warning-amber">{dock.restrictions}</div>
                  )}
                  {dock.amenities && (
                    <div className="text-2xs text-[var(--muted)]">{dock.amenities}</div>
                  )}
                  {dock.dineOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dock.dineOptions.map((restaurant, j) => (
                        <span key={j} className="text-2xs px-2 py-0.5 rounded-full bg-reef-teal/10 text-reef-teal border border-reef-teal/20">
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
                  <div className="text-2xs font-medium text-compass-gold uppercase tracking-wider mb-1">
                    {monthData.month} Conditions — {destZone.replace(/_/g, ' ')}
                  </div>
                  <p className="text-xs text-[var(--secondary)]">{zoneConditions.planningSummary}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-2xs text-[var(--muted)]">
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

        {/* Bay Events this month */}
        {tripEvents.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-compass-gold uppercase tracking-wider">
              Bay Events This Month
            </h3>
            {tripEvents.filter(e => e.sentiment === 'avoid').map(event => (
              <div key={event.id} className="bg-danger-red/10 border border-danger-red/30 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span aria-hidden="true">🚫</span>
                  <span className="text-sm font-medium text-danger-red">{event.name}</span>
                </div>
                <p className="text-xs text-danger-red">{event.reason}</p>
                <p className="text-2xs text-[var(--muted)]">{event.schedule} · {event.organizer}</p>
                {event.trafficNote && <p className="text-2xs text-[var(--muted)] italic">{event.trafficNote}</p>}
                {event.url && (
                  <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-2xs text-safety-blue hover:underline">Details →</a>
                )}
              </div>
            ))}
            {tripEvents.filter(e => e.sentiment === 'caution').map(event => (
              <div key={event.id} className="bg-warning-amber/10 border border-warning-amber/30 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span aria-hidden="true">⚠️</span>
                  <span className="text-sm font-medium text-warning-amber">{event.name}</span>
                </div>
                <p className="text-xs text-warning-amber">{event.reason}</p>
                <p className="text-2xs text-[var(--muted)]">{event.schedule} · {event.organizer}</p>
                {event.url && (
                  <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-2xs text-safety-blue hover:underline">Details →</a>
                )}
              </div>
            ))}
            {tripEvents.filter(e => e.sentiment === 'fun').length > 0 && (
              <div className="bg-reef-teal/10 border border-reef-teal/30 rounded-lg p-3 space-y-2">
                <span className="text-xs font-medium text-reef-teal">Things to do on the water</span>
                {tripEvents.filter(e => e.sentiment === 'fun').map(event => (
                  <div key={event.id} className="space-y-0.5">
                    <div className="text-xs font-medium text-[var(--foreground)]">
                      <span aria-hidden="true">🎉</span> {event.name}
                    </div>
                    <p className="text-2xs text-reef-teal">{event.reason}</p>
                    <p className="text-2xs text-[var(--muted)]">{event.schedule}</p>
                    {event.url && (
                      <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-2xs text-safety-blue hover:underline">Details →</a>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                    onClick={() => trackSourceClick(link.name, 'rental')}
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

          </>
        )}

        {/* Data source footer — visible across all tabs */}
        <p className="text-2xs text-[var(--muted)] text-center pb-4 leading-relaxed">
          Route data from NOAA charts and US Coast Pilot. Not a real-time forecast.
        </p>
      </div>
    </div>
  );
}
