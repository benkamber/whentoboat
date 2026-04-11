'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { getNearestLaunchRamp } from '@/lib/geolocation';
import { track } from '@/lib/analytics';

/**
 * First-visit decision-support modal.
 * Instead of explaining features, asks the user's actual question
 * and routes them to the right experience in one click.
 */
export function Onboarding() {
  const setHomeBase = useAppStore((s) => s.setHomeBase);
  const homeBaseId = useAppStore((s) => s.homeBaseId);
  const router = useRouter();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const onboarded = localStorage.getItem('whentoboat-onboarded');
      if (!onboarded) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // First-visit: try to default origin to nearest launch ramp
  useEffect(() => {
    if (!visible) return;
    if (homeBaseId !== 'sau') return;

    let cancelled = false;
    getNearestLaunchRamp().then((id) => {
      if (cancelled) return;
      if (id && id !== 'sau') {
        track('origin_selected', { origin_id: id, source: 'geolocation' });
        setHomeBase(id);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const dismiss = (destination?: string) => {
    try {
      localStorage.setItem('whentoboat-onboarded', '1');
    } catch {}
    setVisible(false);
    if (destination) router.push(destination);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-2 text-center">
          <h1 className="text-2xl font-bold text-compass-gold">WhenToBoat</h1>
          <p className="text-sm text-[var(--muted)] mt-2">
            See what today&apos;s conditions mean for your activity on SF Bay
          </p>
        </div>

        {/* Decision question */}
        <div className="px-6 py-6">
          <h2 className="text-base font-semibold text-[var(--foreground)] text-center mb-4">
            What brings you to the water?
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => dismiss()}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-reef-teal/10 border border-reef-teal/30 hover:bg-reef-teal/20 transition-colors"
            >
              <span className="text-3xl">🌊</span>
              <span className="text-sm font-medium text-[var(--foreground)]">Can I go out today?</span>
              <span className="text-2xs text-[var(--muted)]">Check current conditions</span>
            </button>

            <button
              onClick={() => dismiss('/planner')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-compass-gold/10 border border-compass-gold/30 hover:bg-compass-gold/20 transition-colors"
            >
              <span className="text-3xl">📅</span>
              <span className="text-sm font-medium text-[var(--foreground)]">Plan a trip</span>
              <span className="text-2xs text-[var(--muted)]">Pick the best month and spot</span>
            </button>

            <button
              onClick={() => dismiss('/guides')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-safety-blue/10 border border-safety-blue/30 hover:bg-safety-blue/20 transition-colors"
            >
              <span className="text-3xl">🗺️</span>
              <span className="text-sm font-medium text-[var(--foreground)]">Best spots</span>
              <span className="text-2xs text-[var(--muted)]">Curated trip guides</span>
            </button>

            <button
              onClick={() => dismiss('/events')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-warning-amber/10 border border-warning-amber/30 hover:bg-warning-amber/20 transition-colors"
            >
              <span className="text-3xl">🎉</span>
              <span className="text-sm font-medium text-[var(--foreground)]">What&apos;s happening</span>
              <span className="text-2xs text-[var(--muted)]">Regattas, shows, events</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-2xs text-[var(--muted)]">
            Free · No account · No tracking · SF Bay
          </p>
        </div>
      </div>
    </div>
  );
}
