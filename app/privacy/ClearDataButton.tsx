'use client';

/**
 * One-click clear of all WhenToBoat browser storage.
 *
 * Removes the four localStorage keys the app actually writes:
 *   - whentoboat-prefs            (zustand store: activity, vessel, etc.)
 *   - whentoboat-onboarded        (onboarding completion flag)
 *   - whentoboat-disclaimer-accepted
 *   - whentoboat-vessels          (useVesselManager saved boats)
 *
 * After clearing, redirects to home so the user immediately sees the
 * fresh-install state (onboarding will reappear).
 */

const KEYS = [
  'whentoboat-prefs',
  'whentoboat-onboarded',
  'whentoboat-disclaimer-accepted',
  'whentoboat-vessels',
] as const;

export function ClearDataButton() {
  const handleClear = () => {
    const ok = window.confirm(
      'Clear all WhenToBoat preferences and saved boats? This will reset the app to its default state. Your data is only stored in this browser — there is nothing to recover after clearing.',
    );
    if (!ok) return;

    for (const key of KEYS) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Private mode / storage disabled — ignore.
      }
    }

    // Hard navigate so all in-memory state (zustand, useVesselManager) is
    // re-hydrated from the now-empty localStorage.
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleClear}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning-amber/15 border border-warning-amber/40 text-warning-amber text-sm font-medium hover:bg-warning-amber/25 transition-colors"
    >
      Clear all saved data
    </button>
  );
}
