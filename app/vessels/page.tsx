'use client';

import { useState } from 'react';
import { Header } from '../components/Header';
import { useVesselManager, vesselTemplates } from '@/hooks/useVesselManager';
import type { VesselProfile, VesselType } from '@/engine/types';

const VESSEL_TYPES: { type: VesselType; icon: string; label: string }[] = [
  { type: 'kayak', icon: '🛶', label: 'Kayak' },
  { type: 'sup', icon: '🏄‍♂️', label: 'Stand-Up Paddleboard' },
  { type: 'powerboat', icon: '🚤', label: 'Powerboat' },
  { type: 'sailboat', icon: '⛵', label: 'Sailboat' },
];

const HULL_TYPES: Record<VesselType, string[]> = {
  kayak: ['sit-on-top', 'sit-inside', 'inflatable', 'folding', 'tandem'],
  sup: ['hard', 'inflatable', 'touring', 'racing'],
  powerboat: ['deep-v', 'flat-bottom', 'modified-v', 'catamaran', 'pontoon', 'center-console', 'bowrider', 'cabin-cruiser', 'RIB'],
  sailboat: ['monohull', 'catamaran', 'trimaran', 'dinghy'],
};

const KEEL_TYPES = ['fin', 'full', 'wing', 'bulb', 'centerboard', 'daggerboard', 'bilge', 'lifting'];

function VesselForm({
  vessel,
  onChange,
  onSave,
  onCancel,
}: {
  vessel: VesselProfile;
  onChange: (v: VesselProfile) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isPaddle = vessel.type === 'kayak' || vessel.type === 'sup';
  const isSail = vessel.type === 'sailboat';

  const update = (field: string, value: any) => {
    onChange({ ...vessel, [field]: value });
  };

  const updateNum = (field: string, value: string, min: number, max: number) => {
    const n = parseFloat(value);
    if (!isNaN(n)) update(field, Math.max(min, Math.min(max, n)));
  };

  const draftValid = vessel.draft > 0;

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="text-xs text-[var(--muted)] block mb-1">Vessel Name <span className="text-[var(--muted)]">(optional)</span></label>
        <input
          type="text"
          value={vessel.name}
          onChange={(e) => update('name', e.target.value)}
          className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-compass-gold focus:outline-none"
          placeholder="e.g., Sea Breeze"
        />
      </div>

      {/* Core specs — 2 column grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">Length (ft) <span className="text-[var(--muted)]">(optional)</span></label>
          <input
            type="number"
            value={vessel.loa}
            onChange={(e) => updateNum('loa', e.target.value, 4, 200)}
            className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-compass-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">
            {isPaddle ? 'Paddle Speed (mph) (optional)' : isSail ? 'Cruise Speed (mph) (optional)' : 'Cruise Speed (mph) (optional)'}
          </label>
          <input
            type="number"
            value={vessel.cruiseSpeed}
            onChange={(e) => updateNum('cruiseSpeed', e.target.value, 1, 80)}
            className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-compass-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs block mb-1"><span className="text-[var(--foreground)] font-medium">Draft (ft)</span> <span className="text-danger-red">*required</span></label>
          <input
            type="number"
            value={vessel.draft}
            step="0.5"
            onChange={(e) => updateNum('draft', e.target.value, 0, 30)}
            className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-compass-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">Max Passengers <span className="text-[var(--muted)]">(optional)</span></label>
          <input
            type="number"
            value={vessel.passengers ?? 1}
            onChange={(e) => updateNum('passengers', e.target.value, 1, 50)}
            className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-compass-gold focus:outline-none"
          />
        </div>
      </div>

      {/* Fuel (motorized only) */}
      {!isPaddle && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">Fuel Capacity (gal) <span className="text-[var(--muted)]">(optional)</span></label>
            <input
              type="number"
              value={vessel.fuelCapacity ?? 0}
              onChange={(e) => updateNum('fuelCapacity', e.target.value, 0, 2000)}
              className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-compass-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">Fuel Burn (GPH) <span className="text-[var(--muted)]">(optional)</span></label>
            <input
              type="number"
              value={vessel.gph ?? 0}
              step="0.5"
              onChange={(e) => updateNum('gph', e.target.value, 0, 200)}
              className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-compass-gold focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Endurance (paddle only) */}
      {isPaddle && (
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">Max Paddle Time (hrs) <span className="text-[var(--muted)]">(optional)</span></label>
          <input
            type="number"
            value={vessel.maxEnduranceHours ?? 2}
            step="0.5"
            onChange={(e) => updateNum('maxEnduranceHours', e.target.value, 0.5, 12)}
            className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-compass-gold focus:outline-none"
          />
        </div>
      )}

      {/* Hull type */}
      <div>
        <label className="text-xs text-[var(--muted)] block mb-1">Hull Type <span className="text-[var(--muted)]">(optional)</span></label>
        <select
          value={vessel.hullType ?? ''}
          onChange={(e) => update('hullType', e.target.value)}
          className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-compass-gold focus:outline-none appearance-none"
        >
          <option value="">Select...</option>
          {HULL_TYPES[vessel.type].map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>

      {/* Sailboat-specific */}
      {isSail && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">Keel Type <span className="text-[var(--muted)]">(optional)</span></label>
            <select
              value={vessel.keelType ?? ''}
              onChange={(e) => update('keelType', e.target.value)}
              className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-compass-gold focus:outline-none appearance-none"
            >
              <option value="">Select...</option>
              {KEEL_TYPES.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">Sail Area (sq ft) <span className="text-[var(--muted)]">(optional)</span></label>
            <input
              type="number"
              value={vessel.sailArea ?? 0}
              onChange={(e) => updateNum('sailArea', e.target.value, 0, 5000)}
              className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-compass-gold focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Engine */}
      <div>
        <label className="text-xs text-[var(--muted)] block mb-1">
          {isPaddle ? 'Propulsion' : 'Engine'}
        </label>
        <input
          type="text"
          value={vessel.engineType ?? ''}
          onChange={(e) => update('engineType', e.target.value)}
          placeholder={isPaddle ? 'paddle' : isSail ? 'e.g., Yanmar 30hp diesel' : 'e.g., Mercury 200XL'}
          className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-compass-gold focus:outline-none"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-[var(--muted)] block mb-1">Notes <span className="text-[var(--muted)]">(optional)</span></label>
        <textarea
          value={vessel.notes ?? ''}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Any notes about this vessel..."
          rows={2}
          className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-compass-gold focus:outline-none resize-none"
        />
      </div>

      {/* Impact preview */}
      <div className="bg-[var(--card-elevated)] rounded-lg p-3 space-y-1">
        <span className="text-[10px] text-compass-gold uppercase tracking-wider font-medium">Impact</span>
        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
          <div>Wave tolerance: {(1 + (vessel.loa - 20) * 0.025).toFixed(2)}x</div>
          <div>Draft clearance: {vessel.draft}ft needed</div>
          {vessel.fuelCapacity && vessel.gph ? (
            <div>Range: {Math.round(((vessel.fuelCapacity * 0.8) / vessel.gph) * vessel.cruiseSpeed / 2)} mi one-way</div>
          ) : vessel.maxEnduranceHours ? (
            <div>Range: {Math.round((vessel.maxEnduranceHours / 2) * vessel.cruiseSpeed)} mi one-way</div>
          ) : null}
          <div>Transit 5mi: {Math.round((5 / vessel.cruiseSpeed) * 60 + 8)} min</div>
        </div>
      </div>

      {/* Actions */}
      {!draftValid && (
        <p className="text-xs text-danger-red">Draft is required — it determines which waters are safe for your vessel.</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => { if (draftValid) onSave(); }}
          className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
            draftValid
              ? 'bg-reef-teal text-white hover:bg-reef-teal/90'
              : 'bg-[var(--card-elevated)] text-[var(--muted)] cursor-not-allowed'
          }`}
        >
          Save Vessel
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-[var(--border)] text-[var(--muted)] text-sm hover:text-[var(--foreground)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function VesselsPage() {
  const { savedVessels, presets, activeVessel, saveVessel, deleteVessel, selectVessel } = useVesselManager();
  const [editing, setEditing] = useState<VesselProfile | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const handleNewVessel = (type: VesselType) => {
    const template = vesselTemplates[type];
    setEditing({
      ...template,
      type,
      name: template.name ?? 'My Vessel',
      loa: template.loa ?? 20,
      cruiseSpeed: template.cruiseSpeed ?? 10,
      fuelCapacity: template.fuelCapacity ?? null,
      gph: template.gph ?? null,
      draft: template.draft ?? 1,
      maxEnduranceHours: template.maxEnduranceHours ?? null,
    } as VesselProfile);
    setShowTypeSelector(false);
  };

  const handleSave = () => {
    if (!editing) return;
    const saved = saveVessel(editing);
    selectVessel(saved);
    setEditing(null);
  };

  const handleEdit = (vessel: VesselProfile) => {
    setEditing({ ...vessel });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-compass-gold">My Vessels</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Add your boats to get personalized trip planning based on your exact specs.
            </p>
          </div>
          {!editing && !showTypeSelector && (
            <button
              onClick={() => setShowTypeSelector(true)}
              className="px-4 py-2 rounded-lg bg-reef-teal text-white text-sm font-medium hover:bg-reef-teal/90 transition-colors"
            >
              + Add Vessel
            </button>
          )}
        </div>

        {/* Type selector for new vessel */}
        {showTypeSelector && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-medium">What type of vessel?</h2>
            <div className="grid grid-cols-2 gap-2">
              {VESSEL_TYPES.map(({ type, icon, label }) => (
                <button
                  key={type}
                  onClick={() => handleNewVessel(type)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--card-elevated)] border border-[var(--border)] hover:border-reef-teal transition-colors text-left"
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTypeSelector(false)}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="text-sm font-medium mb-4">
              {editing.id ? 'Edit' : 'New'} {VESSEL_TYPES.find(t => t.type === editing.type)?.icon}{' '}
              {VESSEL_TYPES.find(t => t.type === editing.type)?.label}
            </h2>
            <VesselForm
              vessel={editing}
              onChange={setEditing}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}

        {/* Saved vessels */}
        {savedVessels.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Your Vessels</h2>
            {savedVessels.map(vessel => {
              const isActive = activeVessel.id === vessel.id;
              const typeInfo = VESSEL_TYPES.find(t => t.type === vessel.type);
              return (
                <div
                  key={vessel.id}
                  className={`bg-[var(--card)] border rounded-xl p-4 transition-all ${
                    isActive ? 'border-reef-teal shadow-lg shadow-reef-teal/10' : 'border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typeInfo?.icon}</span>
                      <div>
                        <h3 className="font-semibold">{vessel.name}</h3>
                        <p className="text-xs text-[var(--muted)]">
                          {vessel.loa}ft · {vessel.cruiseSpeed}mph · {vessel.draft}ft draft
                          {vessel.fuelCapacity ? ` · ${vessel.fuelCapacity}gal` : ''}
                          {vessel.gph ? ` · ${vessel.gph}GPH` : ''}
                          {vessel.keelType ? ` · ${vessel.keelType} keel` : ''}
                        </p>
                        {vessel.engineType && (
                          <p className="text-[10px] text-[var(--muted)]">{vessel.engineType}</p>
                        )}
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-[9px] bg-reef-teal/20 text-reef-teal px-1.5 py-0.5 rounded font-medium uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {!isActive && (
                      <button
                        onClick={() => selectVessel(vessel)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-reef-teal/10 text-reef-teal border border-reef-teal/30 hover:bg-reef-teal/20 transition-colors"
                      >
                        Use This Vessel
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(vessel)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--card-elevated)] text-[var(--secondary)] border border-[var(--border)] hover:text-[var(--foreground)] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${vessel.name}?`)) deleteVessel(vessel.id!);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-danger-red/70 hover:text-danger-red transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Presets */}
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
            Quick Presets
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Use a preset or add a custom vessel above for personalized results.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {presets.map(vessel => {
              const isActive = !activeVessel.id && activeVessel.type === vessel.type && activeVessel.name === vessel.name;
              const typeInfo = VESSEL_TYPES.find(t => t.type === vessel.type);
              return (
                <button
                  key={vessel.type}
                  onClick={() => selectVessel(vessel)}
                  className={`p-3 rounded-lg text-left border transition-all ${
                    isActive
                      ? 'border-reef-teal bg-reef-teal/10'
                      : 'border-[var(--border)] bg-[var(--card)] hover:border-reef-teal/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{typeInfo?.icon}</span>
                    <span className="text-sm font-medium">{vessel.name}</span>
                  </div>
                  <p className="text-[10px] text-[var(--muted)] mt-1">
                    {vessel.loa}ft · {vessel.cruiseSpeed}mph · {vessel.draft}ft draft
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
