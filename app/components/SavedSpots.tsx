'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store';
import { sfBay } from '@/data/cities/sf-bay';
import { getActivity } from '@/data/activities';
import { routeComfort } from '@/engine/scoring';
import { ScoreBadge } from './ScoreBadge';

const STORAGE_KEY = 'whentoboat-saved-spots';
const MAX_SAVED = 10;

export function useSavedSpots() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSavedIds(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
  }, []);

  const persist = useCallback((ids: string[]) => {
    setSavedIds(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignore storage errors
    }
  }, []);

  const addSpot = useCallback(
    (id: string) => {
      if (savedIds.includes(id) || savedIds.length >= MAX_SAVED) return;
      persist([...savedIds, id]);
    },
    [savedIds, persist]
  );

  const removeSpot = useCallback(
    (id: string) => {
      persist(savedIds.filter((s) => s !== id));
    },
    [savedIds, persist]
  );

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  return { savedIds, addSpot, removeSpot, isSaved };
}

export function SavedSpots() {
  const { savedIds, addSpot, removeSpot } = useSavedSpots();
  const { activity, month, hour, vessel, homeBaseId } = useAppStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentActivity = getActivity(activity);
  const origin = sfBay.destinations.find((d) => d.id === homeBaseId) ?? sfBay.destinations[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showDropdown]);

  // Compute scores for saved destinations
  const savedSpots = savedIds
    .map((id) => {
      const dest = sfBay.destinations.find((d) => d.id === id);
      if (!dest) return null;
      try {
        const scored = routeComfort(origin, dest, month, hour, currentActivity, vessel, sfBay);
        return { dest, score: scored.score };
      } catch {
        return { dest, score: 0 };
      }
    })
    .filter(Boolean) as { dest: (typeof sfBay.destinations)[number]; score: number }[];

  // Available destinations not yet saved
  const availableToAdd = sfBay.destinations.filter(
    (d) => !savedIds.includes(d.id) && d.id !== homeBaseId
  );

  if (savedIds.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          Save your favorite destinations for quick access
        </p>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((s) => !s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-reef-teal/10 text-reef-teal border border-reef-teal/30 hover:bg-reef-teal/20 transition-colors"
          >
            + Add
          </button>
          {showDropdown && (
            <AddDropdown
              destinations={availableToAdd}
              onAdd={(id) => {
                addSpot(id);
                setShowDropdown(false);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
          Saved Spots
        </h3>
        {savedIds.length < MAX_SAVED && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((s) => !s)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-reef-teal/10 text-reef-teal border border-reef-teal/30 hover:bg-reef-teal/20 transition-colors"
            >
              + Add
            </button>
            {showDropdown && (
              <AddDropdown
                destinations={availableToAdd}
                onAdd={(id) => {
                  addSpot(id);
                  setShowDropdown(false);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Horizontal scroll list */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {savedSpots.map((spot) => (
          <div
            key={spot.dest.id}
            className="flex items-center gap-2 bg-[var(--card-elevated)] rounded-lg px-3 py-2 shrink-0 border border-[var(--border)] group"
          >
            <ScoreBadge score={spot.score} size="sm" />
            <span className="text-sm font-medium whitespace-nowrap">
              {spot.dest.name}
            </span>
            <button
              onClick={() => removeSpot(spot.dest.id)}
              className="text-[var(--muted)] hover:text-danger-red transition-colors text-xs ml-1 opacity-0 group-hover:opacity-100"
              aria-label={`Remove ${spot.dest.name}`}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddDropdown({
  destinations,
  onAdd,
}: {
  destinations: (typeof sfBay.destinations)[number][];
  onAdd: (id: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = destinations.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="absolute right-0 top-full mt-1 w-64 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="p-2 border-b border-[var(--border)]">
        <input
          type="text"
          placeholder="Search destinations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[var(--card-elevated)] border border-[var(--border)] rounded px-2.5 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-compass-gold focus:outline-none"
          autoFocus
        />
      </div>
      <div className="max-h-48 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-xs text-[var(--muted)]">No destinations found</div>
        ) : (
          filtered.map((d) => (
            <button
              key={d.id}
              onClick={() => onAdd(d.id)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--card-elevated)] transition-colors border-b border-[var(--border)] last:border-b-0"
            >
              <span className="font-medium">{d.name}</span>
              <span className="text-xs text-[var(--muted)] ml-2">{d.area}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
