'use client';

import { useState, useMemo } from 'react';
import { docks } from '@/data/cities/sf-bay/docks';
import type { DockInfo } from '@/data/cities/sf-bay/docks';
import { sfBay } from '@/data/cities/sf-bay';
import { Header } from '../components/Header';
import { SourceAttribution } from '../components/SourceAttribution';

// ---------------------------------------------------------------------------
// Region mapping: destinationId -> display region
// ---------------------------------------------------------------------------

const REGION_MAP: Record<string, string> = {
  sau: 'Marin',
  skm: 'Marin',
  tib: 'Marin',
  ang: 'Marin',
  hsb: 'Marin',
  aqp: 'San Francisco',
  p39: 'San Francisco',
  fbg: 'San Francisco',
  mcc: 'San Francisco',
  jls: 'East Bay',
  alm: 'East Bay',
  brk: 'East Bay',
  ptr: 'East Bay',
  clp: 'East Bay',
  val: 'North Bay',
  ben: 'North Bay',
  oyp: 'South Bay',
  cop: 'South Bay',
  rwc: 'South Bay',
};

const REGION_ORDER = ['Marin', 'San Francisco', 'East Bay', 'North Bay', 'South Bay'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dockTypeLabel(type: DockInfo['dockType']): { icon: string; label: string } {
  switch (type) {
    case 'restaurant_dock':
      return { icon: '\u{1F374}', label: 'Restaurant Dock' };
    case 'marina_guest':
      return { icon: '\u2693', label: 'Marina Guest' };
    case 'state_park':
      return { icon: '\u{1F332}', label: 'State Park' };
    case 'yacht_club':
      return { icon: '\u26F5', label: 'Yacht Club' };
    case 'public_guest':
      return { icon: '\u{1F3DB}', label: 'Public Guest' };
  }
}

function destinationName(destId: string): string {
  const dest = sfBay.destinations.find((d) => d.id === destId);
  return dest?.name ?? destId;
}

function isShallow(dock: DockInfo): boolean {
  const depth = dock.depthFt.toLowerCase();
  const restrictions = dock.restrictions.toLowerCase();
  // Check for explicit shallow depths (< 5 ft)
  const depthMatch = depth.match(/(\d+\.?\d*)/);
  if (depthMatch && parseFloat(depthMatch[1]) < 5) return true;
  if (depth.includes('shallow') || depth.includes('grounding') || depth.includes('siltation')) return true;
  if (restrictions.includes('grounding') || restrictions.includes('shallow')) return true;
  return false;
}

function hasWarning(restrictions: string): boolean {
  const lower = restrictions.toLowerCase();
  return (
    lower.includes('grounding') ||
    lower.includes('shallow') ||
    lower.includes('siltation') ||
    lower.includes('critical') ||
    lower.includes('hazardous') ||
    lower.includes('red-tagged') ||
    lower.includes('strictly enforced')
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function DinePage() {
  const [activeRegion, setActiveRegion] = useState<string>('All');

  // Filter to only docks with dining options
  const diningDocks = useMemo(
    () => docks.filter((d) => d.dineOptions.length > 0),
    [],
  );

  // Group by region
  const grouped = useMemo(() => {
    const map = new Map<string, DockInfo[]>();
    for (const region of REGION_ORDER) {
      map.set(region, []);
    }
    for (const dock of diningDocks) {
      const region = REGION_MAP[dock.destinationId] ?? 'Other';
      const list = map.get(region);
      if (list) {
        list.push(dock);
      } else {
        map.set(region, [dock]);
      }
    }
    // Remove empty regions
    for (const [key, val] of map.entries()) {
      if (val.length === 0) map.delete(key);
    }
    return map;
  }, [diningDocks]);

  // Apply region filter
  const visibleRegions = useMemo(() => {
    if (activeRegion === 'All') return REGION_ORDER.filter((r) => grouped.has(r));
    return grouped.has(activeRegion) ? [activeRegion] : [];
  }, [activeRegion, grouped]);

  const visibleCount = useMemo(() => {
    if (activeRegion === 'All') return diningDocks.length;
    return grouped.get(activeRegion)?.length ?? 0;
  }, [activeRegion, diningDocks, grouped]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-compass-gold tracking-tight">
            Dock &amp; Dine &mdash; SF Bay
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Where to eat when you arrive by boat
          </p>
          <p className="text-xs text-[var(--secondary)] mt-2">
            {diningDocks.length} docks with dining across SF Bay
          </p>
        </div>

        {/* Region filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['All', ...REGION_ORDER.filter((r) => grouped.has(r))].map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeRegion === region
                  ? 'bg-reef-teal text-white shadow-sm'
                  : 'bg-[var(--card-elevated)] text-[var(--secondary)] border border-[var(--border)] hover:border-reef-teal/50'
              }`}
            >
              {region}
              {region === 'All' && (
                <span className="ml-1.5 text-xs opacity-70">({diningDocks.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Dock cards by region */}
        {visibleRegions.map((region) => {
          const regionDocks = grouped.get(region) ?? [];
          return (
            <section key={region} className="mb-10">
              <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 border-b border-[var(--border)] pb-2">
                {region}
                <span className="ml-2 text-sm font-normal text-[var(--muted)]">
                  ({regionDocks.length} dock{regionDocks.length !== 1 ? 's' : ''})
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {regionDocks.map((dock) => (
                  <DockCard key={`${dock.destinationId}-${dock.name}`} dock={dock} />
                ))}
              </div>
            </section>
          );
        })}

        {visibleCount === 0 && (
          <p className="text-center text-[var(--muted)] py-12">
            No dining docks found for this region.
          </p>
        )}

        {/* Safety disclaimer */}
        <div className="mt-12 border-t border-[var(--border)] pt-6 text-center">
          <p className="text-xs text-[var(--muted)] max-w-lg mx-auto">
            WhenToBoat is a planning tool. Always verify dock availability, depths, and hours
            directly with the marina or restaurant before departure. Conditions change.
          </p>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dock card component
// ---------------------------------------------------------------------------

function DockCard({ dock }: { dock: DockInfo }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const { icon, label } = dockTypeLabel(dock.dockType);
  const shallow = isShallow(dock);
  const warningRestrictions = hasWarning(dock.restrictions);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3 hover:border-reef-teal/30 transition-colors">
      {/* Dock name + type badge */}
      <div>
        <h3 className="text-base font-bold text-[var(--foreground)] leading-tight">
          {dock.name}
        </h3>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--card-elevated)] border border-[var(--border)] text-[var(--secondary)]">
            {icon} {label}
          </span>
          <span className="text-xs text-[var(--muted)]">
            {destinationName(dock.destinationId)}
          </span>
        </div>
      </div>

      {/* Fees (prominent) */}
      <div className="text-sm font-semibold text-reef-teal">
        {dock.fees}
      </div>

      {/* Shallow warning */}
      {shallow && (
        <div className="flex items-start gap-1.5 text-xs text-warning-amber bg-warning-amber/10 border border-warning-amber/20 rounded-lg px-3 py-2">
          <span className="shrink-0">{'\u26A0\uFE0F'}</span>
          <span>
            <strong>SHALLOW:</strong> {dock.depthFt}
          </span>
        </div>
      )}

      {/* Restaurant list */}
      <div>
        <p className="text-[11px] text-[var(--muted)] mb-1.5 font-medium uppercase tracking-wide">
          Restaurants
        </p>
        <div className="flex flex-wrap gap-1.5">
          {dock.dineOptions.map((name) => (
            <span
              key={name}
              className="inline-block text-xs px-2.5 py-1 rounded-full bg-reef-teal/10 text-reef-teal border border-reef-teal/20 font-medium"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Details row */}
      <div className="text-xs text-[var(--secondary)] space-y-0.5">
        <p>
          <span className="text-[var(--muted)]">Depth:</span> {dock.depthFt}
          {dock.maxLoa && dock.maxLoa !== 'varies' && (
            <span> &middot; <span className="text-[var(--muted)]">Max:</span> {dock.maxLoa}</span>
          )}
        </p>
        <p>
          <span className="text-[var(--muted)]">Hours:</span> {dock.hours}
        </p>
      </div>

      {/* Restrictions */}
      {dock.restrictions && (
        <div
          className={`text-xs rounded-lg px-3 py-2 ${
            warningRestrictions
              ? 'text-warning-amber bg-warning-amber/5 border border-warning-amber/15'
              : 'text-[var(--secondary)] bg-[var(--card-elevated)]'
          }`}
        >
          {dock.restrictions}
        </div>
      )}

      {/* Amenities */}
      {dock.amenities && (
        <p className="text-[11px] text-[var(--muted)]">
          {dock.amenities}
        </p>
      )}

      {/* Source attribution (collapsible) */}
      {dock.sources.length > 0 && (
        <div className="pt-1 border-t border-[var(--border)]">
          <button
            onClick={() => setSourcesOpen(!sourcesOpen)}
            className="text-[10px] text-[var(--muted)] hover:text-[var(--secondary)] transition-colors flex items-center gap-1"
          >
            <span className="transform transition-transform" style={{ display: 'inline-block', transform: sourcesOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              {'\u25B6'}
            </span>
            {dock.sources.length} source{dock.sources.length !== 1 ? 's' : ''}
          </button>
          {sourcesOpen && (
            <div className="mt-2">
              <SourceAttribution sources={dock.sources} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
