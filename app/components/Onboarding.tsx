'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { getNearestLaunchRamp } from '@/lib/geolocation';
import { track } from '@/lib/analytics';

const steps = [
  {
    title: 'Pick Your Activity',
    body: 'WhenToBoat scores conditions differently for each activity. A kayaker and a racing sailor see completely different maps of the same bay.',
    illustration: (
      <div className="flex items-center justify-center gap-4 text-5xl py-6">
        <span>🛶</span>
        <span className="text-2xl text-[var(--muted)]">/</span>
        <span>⛵</span>
        <span className="text-2xl text-[var(--muted)]">/</span>
        <span>🚤</span>
      </div>
    ),
  },
  {
    title: 'Plan Your Route',
    body: 'Pick a destination to see distance, transit time, docking options, and hazards. Click any route on the map for full details.',
    illustration: (
      <div className="flex items-center justify-center gap-6 py-6">
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-xl bg-reef-teal/20 border border-reef-teal/40 flex items-center justify-center text-2xl">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-reef-teal"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </div>
          <span className="text-xs text-[var(--muted)]">Distance</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-xl bg-compass-gold/20 border border-compass-gold/40 flex items-center justify-center text-2xl">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-compass-gold"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <span className="text-xs text-[var(--muted)]">Transit</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-xl bg-safety-blue/20 border border-safety-blue/40 flex items-center justify-center text-2xl">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-safety-blue"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <span className="text-xs text-[var(--muted)]">Docks</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Plan Here, Confirm There',
    body: 'We help you understand patterns and plan your outing. Always verify with NOAA before departure. Every recommendation includes direct links to authoritative sources.',
    illustration: (
      <div className="flex items-center justify-center gap-3 py-6">
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-xl bg-reef-teal/20 border border-reef-teal/40 flex items-center justify-center text-2xl">
            📋
          </div>
          <span className="text-xs text-[var(--muted)]">Plan</span>
        </div>
        <span className="text-compass-gold text-2xl">→</span>
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-xl bg-safety-blue/20 border border-safety-blue/40 flex items-center justify-center text-2xl">
            🔗
          </div>
          <span className="text-xs text-[var(--muted)]">Verify</span>
        </div>
        <span className="text-compass-gold text-2xl">→</span>
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-xl bg-reef-teal/20 border border-reef-teal/40 flex items-center justify-center text-2xl">
            🚀
          </div>
          <span className="text-xs text-[var(--muted)]">Go</span>
        </div>
      </div>
    ),
  },
];

export function Onboarding() {
  const homeBaseId = useAppStore((s) => s.homeBaseId);
  const setHomeBase = useAppStore((s) => s.setHomeBase);

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

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

  // First-visit only: try to default the origin to the user's nearest
  // launch ramp via geolocation. Skipped if the user has already moved
  // off the persisted default ('sau') in a previous session.
  useEffect(() => {
    if (!visible) return;
    if (homeBaseId !== 'sau') return; // Respect user's prior choice

    let cancelled = false;
    getNearestLaunchRamp().then((id) => {
      if (cancelled) return;
      if (id && id !== 'sau') {
        track('origin_selected', { origin_id: id, source: 'geolocation' });
        setHomeBase(id);
      }
    });
    return () => {
      cancelled = true;
    };
    // Run once when the modal first becomes visible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const dismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('whentoboat-onboarded', '1');
      } catch {
        // localStorage unavailable
      }
    }
    setVisible(false);
  };

  const goToStep = (next: number) => {
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setTransitioning(false);
    }, 150);
  };

  if (!visible) return null;

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-8 bg-compass-gold'
                  : i < step
                    ? 'w-1.5 bg-compass-gold/50'
                    : 'w-1.5 bg-[var(--border)]'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div
          className={`px-8 pt-6 pb-2 transition-opacity duration-150 ${
            transitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {currentStep.illustration}

          <h2 className="text-xl font-bold text-compass-gold text-center mb-3">
            {currentStep.title}
          </h2>

          <p className="text-sm text-[var(--muted)] text-center leading-relaxed">
            {currentStep.body}
          </p>
        </div>

        {/* Don't show again checkbox — last step only */}
        {isLast && (
          <div className="flex justify-center px-8 pt-3">
            <label className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-[var(--border)] accent-reef-teal"
              />
              Don&apos;t show again
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-8 pt-4 pb-6">
          <button
            onClick={dismiss}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Skip
          </button>

          <div className="flex gap-2">
            {isLast ? (
              <button
                onClick={dismiss}
                className="px-5 py-2 text-sm font-semibold text-ocean-950 bg-reef-teal hover:bg-reef-teal/90 rounded-lg transition-colors"
              >
                Done
              </button>
            ) : (
              <button
                onClick={() => goToStep(step + 1)}
                className="px-5 py-2 text-sm font-semibold text-ocean-950 bg-reef-teal hover:bg-reef-teal/90 rounded-lg transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
