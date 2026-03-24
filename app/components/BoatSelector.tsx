'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { vesselPresets } from '@/data/vessels';
import { sfBay } from '@/data/cities/sf-bay';
import type { VesselProfile, VesselType } from '@/engine/types';

const VESSEL_ICONS: Record<VesselType, string> = {
  kayak: '🛶',
  sup: '🏄‍♂️',
  powerboat: '🚤',
  sailboat: '⛵',
};

const VESSEL_SPECS: Record<VesselType, string> = {
  kayak: '16ft · 4 mph · paddle',
  sup: '11ft · 3 mph · paddle',
  powerboat: '21ft · 30 mph · 66 gal',
  sailboat: '25ft · 6 mph · 4.5ft draft',
};

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
  const { vessel, setVessel, setVesselPreset } = useAppStore();
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const [showCustomize, setShowCustomize] = useState(false);
  const [customVessel, setCustomVessel] = useState<VesselProfile>(vessel);

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

  const handlePresetSelect = (type: string) => {
    setVesselPreset(type);
    const preset = vesselPresets.find((v) => v.type === type);
    if (preset) setCustomVessel(preset);
    setShowCustomize(false);
  };

  const handleCustomChange = (field: keyof VesselProfile, value: string | number | null) => {
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
          <span className="text-xl">{VESSEL_ICONS[vessel.type]}</span>
          <div>
            <span className="text-sm font-medium text-[var(--foreground)]">
              {vessel.name}
            </span>
            <span className="text-xs text-[var(--muted)] ml-2">
              {VESSEL_SPECS[vessel.type]}
            </span>
          </div>
        </div>
        <span className="text-xs text-reef-teal group-hover:underline">Change vessel</span>
      </button>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Select Vessel</h3>
        <button
          onClick={toggle}
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Collapse
        </button>
      </div>

      {/* Preset cards */}
      <div className="grid grid-cols-2 gap-2 p-4">
        {vesselPresets.map((preset) => (
          <button
            key={preset.type}
            onClick={() => handlePresetSelect(preset.type)}
            className={`rounded-lg p-3 text-left transition-all border ${
              vessel.type === preset.type
                ? 'border-reef-teal bg-reef-teal/10'
                : 'border-[var(--border)] bg-[var(--card-elevated)] hover:border-[var(--muted)]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{VESSEL_ICONS[preset.type]}</span>
              <span className="text-sm font-medium">{preset.name}</span>
            </div>
            <div className="text-xs text-[var(--muted)]">{VESSEL_SPECS[preset.type]}</div>
          </button>
        ))}
      </div>

      {/* Customize toggle */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setShowCustomize((c) => !c)}
          className="text-xs text-reef-teal hover:underline"
        >
          {showCustomize ? 'Hide customization' : 'Customize'}
        </button>
      </div>

      {/* Custom override panel */}
      {showCustomize && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)] pt-3">
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
            {/* LOA */}
            <div className="space-y-1">
              <label className="text-xs text-[var(--muted)]">LOA (feet)</label>
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

            {/* GPH at cruise */}
            <div className="space-y-1">
              <label className="text-xs text-[var(--muted)]">GPH at cruise</label>
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
        </div>
      )}
    </div>
  );
}
