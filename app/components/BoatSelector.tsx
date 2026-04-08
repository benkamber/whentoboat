'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/store';
import { vesselPresets } from '@/data/vessels';
import { sfBay } from '@/data/cities/sf-bay';
import { track } from '@/lib/analytics';
import { useVesselManager } from '@/hooks/useVesselManager';
import type { VesselProfile, VesselType } from '@/engine/types';

const VESSEL_ICONS: Record<VesselType, string> = {
  kayak: '🛶',
  sup: '🏄‍♂️',
  powerboat: '🚤',
  sailboat: '⛵',
};

function vesselSpecLine(v: VesselProfile): string {
  if (v.fuelCapacity != null) {
    return `${v.loa}ft · ${v.cruiseSpeed} mph · ${v.fuelCapacity} gal`;
  }
  if (v.draft >= 1) {
    return `${v.loa}ft · ${v.cruiseSpeed} mph · ${v.draft}ft draft`;
  }
  return `${v.loa}ft · ${v.cruiseSpeed} mph · paddle`;
}

function isHumanPowered(vessel: VesselProfile): boolean {
  return vessel.fuelCapacity === null;
}

export function BoatSelector({
  collapsed: controlledCollapsed,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const { vessel, setVessel } = useAppStore();
  const { savedVessels, selectVessel } = useVesselManager();
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const [showCustomize, setShowCustomize] = useState(false);
  const [customVessel, setCustomVessel] = useState<VesselProfile>(vessel);

  // Keep local customVessel in sync when vessel changes from outside
  // (e.g., user picks a different activity which auto-swaps the preset,
  // or the user selects a different saved boat from the My Boats list).
  useEffect(() => {
    setCustomVessel(vessel);
  }, [vessel]);

  const collapsed = controlledCollapsed ?? internalCollapsed;
  const toggle = onToggle ?? (() => setInternalCollapsed((c) => !c));

  // Impact preview: compute derived stats
  const impactPreview = useMemo(() => {
    const items: string[] = [];

    // Wave tolerance multiplier based on LOA
    const baseVessel = vesselPresets.find((v) => v.type === customVessel.type);
    if (baseVessel && customVessel.loa !== baseVessel.loa) {
      const ratio = (customVessel.loa / baseVessel.loa).toFixed(2);
      items.push(`Wave tolerance: ${ratio}x`);
    }

    // Max range for fuel-powered
    if (customVessel.fuelCapacity && customVessel.gph && customVessel.cruiseSpeed) {
      const enduranceHrs = customVessel.fuelCapacity / customVessel.gph;
      const rangeMi = Math.round(enduranceHrs * customVessel.cruiseSpeed * 0.5); // one-way = half
      items.push(`Max range: ${rangeMi} mi`);
    }

    // Max range for human-powered
    if (customVessel.maxEnduranceHours && isHumanPowered(customVessel)) {
      const rangeMi = Math.round(
        customVessel.maxEnduranceHours * customVessel.cruiseSpeed * 0.5
      );
      items.push(`Max range: ${rangeMi} mi`);
    }

    // Draft warnings
    if (customVessel.draft > 0) {
      const shallowDests = sfBay.destinations.filter(
        (d) => d.minDepth !== null && d.minDepth < customVessel.draft + 1
      );
      if (shallowDests.length > 0) {
        const names = shallowDests
          .slice(0, 3)
          .map((d) => d.name)
          .join(', ');
        items.push(
          `Draft warnings at: ${names}${shallowDests.length > 3 ? ` (+${shallowDests.length - 3})` : ''}`
        );
      }
    }

    return items;
  }, [customVessel]);

  const handleCustomChange = (field: keyof VesselProfile, value: string | number | null) => {
    // Validate numeric fields to prevent nonsensical values
    if (typeof value === 'number') {
      const limits: Record<string, [number, number]> = {
        loa: [4, 200],          // 4ft kayak to 200ft yacht
        cruiseSpeed: [1, 80],   // 1mph SUP to 80mph speed boat
        fuelCapacity: [0, 1000],
        gph: [0, 100],
        draft: [0, 30],         // 0ft SUP to 30ft deep keel
        mastHeight: [10, 200],
      };
      const [min, max] = limits[field] ?? [0, Infinity];
      value = Math.max(min, Math.min(max, value));
    }
    track('vessel_customized', {
      field: String(field),
      vessel_type: customVessel.type,
    });
    const updated = { ...customVessel, [field]: value };
    setCustomVessel(updated);
    setVessel(updated);
  };

  if (collapsed) {
    return (
      <button
        onClick={toggle}
        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 text-left hover:border-reef-teal transition-colors flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl" aria-hidden="true">{VESSEL_ICONS[vessel.type]}</span>
          <div>
            <span className="text-sm font-medium text-[var(--foreground)]">
              {vessel.name}
            </span>
            <span className="text-xs text-[var(--muted)] ml-2">
              {vesselSpecLine(vessel)}
            </span>
          </div>
        </div>
        <span className="text-xs text-reef-teal group-hover:underline">Customize</span>
      </button>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header — vessel is determined by selected activity */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0" aria-hidden="true">{VESSEL_ICONS[vessel.type]}</span>
          <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
            {vessel.name}
          </h3>
        </div>
        <button
          onClick={toggle}
          aria-label="Close boat details"
          className="shrink-0 ml-2 p-1 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-elevated)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M3 3L11 11M11 3L3 11" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* My Boats — quick switch list (only when user has saved boats) */}
        {savedVessels.length > 0 && (
          <div className="space-y-2">
            <div className="text-2xs font-medium text-[var(--muted)] uppercase tracking-wider">
              My Boats
            </div>
            {savedVessels.map((v) => {
              const isActive = vessel.id === v.id;
              return (
                <div
                  key={v.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                    isActive
                      ? 'border-reef-teal bg-reef-teal/10'
                      : 'border-[var(--border)] hover:border-reef-teal/50'
                  }`}
                >
                  <span className="text-lg shrink-0" aria-hidden="true">{VESSEL_ICONS[v.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{v.name}</div>
                    <div className="text-2xs text-[var(--muted)]">{vesselSpecLine(v)}</div>
                  </div>
                  {!isActive && (
                    <button
                      onClick={() => selectVessel(v)}
                      aria-label={`Use ${v.name}`}
                      className="text-xs font-medium text-reef-teal hover:underline shrink-0"
                    >
                      Use
                    </button>
                  )}
                  <a
                    href={`/vessels?edit=${v.id}`}
                    aria-label={`Edit ${v.name}`}
                    className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] shrink-0"
                  >
                    Edit
                  </a>
                </div>
              );
            })}
            <a
              href="/vessels"
              className="block text-center text-xs text-reef-teal hover:underline py-1"
            >
              + Add a new boat · Manage all
            </a>
          </div>
        )}

        {/* Customize disclosure — hidden by default, this is the power-user surface */}
        {!showCustomize ? (
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => setShowCustomize(true)}
              className="text-reef-teal hover:underline"
            >
              {savedVessels.length > 0
                ? `Tweak this ${vessel.type === 'sup' ? 'SUP' : vessel.type} for one trip`
                : `Customize this ${vessel.type === 'sup' ? 'SUP' : vessel.type}`}
            </button>
            {savedVessels.length === 0 && (
              <a
                href="/vessels"
                className="text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Save my boat →
              </a>
            )}
          </div>
        ) : (
          <>
          {/* Vessel name */}
          <div className="space-y-1">
            <label className="text-xs text-[var(--muted)]">Vessel name</label>
            <input
              type="text"
              value={customVessel.name}
              onChange={(e) => handleCustomChange('name', e.target.value)}
              className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:border-compass-gold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Length */}
            <div className="space-y-1">
              <label className="text-xs text-[var(--muted)]">Length (feet)</label>
              <input
                type="number"
                value={customVessel.loa}
                onChange={(e) => handleCustomChange('loa', parseFloat(e.target.value) || 0)}
                className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:border-compass-gold focus:outline-none"
              />
            </div>

            {/* Cruise speed */}
            <div className="space-y-1">
              <label className="text-xs text-[var(--muted)]">Cruise speed (mph)</label>
              <input
                type="number"
                value={customVessel.cruiseSpeed}
                onChange={(e) =>
                  handleCustomChange('cruiseSpeed', parseFloat(e.target.value) || 0)
                }
                className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:border-compass-gold focus:outline-none"
              />
            </div>

            {/* Fuel capacity */}
            <div className="space-y-1">
              <label className="text-xs text-[var(--muted)]">Fuel capacity (gal)</label>
              <input
                type="number"
                value={customVessel.fuelCapacity ?? ''}
                disabled={isHumanPowered(vesselPresets.find((v) => v.type === customVessel.type) ?? customVessel)}
                onChange={(e) =>
                  handleCustomChange(
                    'fuelCapacity',
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:border-compass-gold focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            {/* Fuel burn at cruise */}
            <div className="space-y-1">
              <label className="text-xs text-[var(--muted)]">Fuel burn (gal/hr at cruise)</label>
              <input
                type="number"
                value={customVessel.gph ?? ''}
                disabled={isHumanPowered(vesselPresets.find((v) => v.type === customVessel.type) ?? customVessel)}
                onChange={(e) =>
                  handleCustomChange(
                    'gph',
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:border-compass-gold focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            {/* Draft */}
            <div className="space-y-1">
              <label className="text-xs text-[var(--muted)]">Draft (feet)</label>
              <input
                type="number"
                value={customVessel.draft}
                onChange={(e) => handleCustomChange('draft', parseFloat(e.target.value) || 0)}
                className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:border-compass-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Mast height — sailboats only */}
          {customVessel.type === 'sailboat' && (
            <div className="space-y-1">
              <label className="text-xs text-[var(--muted)]">Mast height (feet)</label>
              <input
                type="number"
                value={customVessel.mastHeight ?? ''}
                onChange={(e) => handleCustomChange('mastHeight', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:border-compass-gold focus:outline-none"
              />
            </div>
          )}

          {/* Impact preview */}
          {impactPreview.length > 0 && (
            <div className="bg-[var(--card-elevated)] rounded-lg p-3 space-y-1">
              <div className="text-xs font-medium text-compass-gold mb-1">Impact</div>
              {impactPreview.map((item, i) => (
                <div key={i} className="text-xs text-[var(--muted)]">
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* Reset + manage */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                const preset = vesselPresets.find(v => v.type === vessel.type);
                if (preset) {
                  setCustomVessel(preset);
                  setVessel(preset);
                }
              }}
              className="text-xs font-medium text-warning-amber hover:text-[var(--foreground)] transition-colors px-2 py-1 rounded border border-warning-amber/30 hover:border-warning-amber/60"
            >
              Reset to preset defaults
            </button>
            <button
              onClick={() => setShowCustomize(false)}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Hide
            </button>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
