'use client';

import { useState, useEffect } from 'react';

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
    title: 'Find Your Window',
    body: 'Drag the time slider to see how conditions change through the day. Watch the bay go from calm green to rough red as afternoon winds build.',
    illustration: (
      <div className="flex items-end justify-center gap-1.5 py-6">
        {[
          { h: 24, color: 'bg-score-10' },
          { h: 32, color: 'bg-score-9' },
          { h: 40, color: 'bg-score-8' },
          { h: 48, color: 'bg-score-7' },
          { h: 40, color: 'bg-score-5' },
          { h: 32, color: 'bg-score-3' },
          { h: 24, color: 'bg-score-2' },
          { h: 16, color: 'bg-score-1' },
        ].map((bar, i) => (
          <div
            key={i}
            className={`w-6 rounded-t ${bar.color}`}
            style={{ height: `${bar.h * 2}px` }}
          />
        ))}
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
          <div className="w-14 h-14 rounded-xl bg-score-10/20 border border-score-10/40 flex items-center justify-center text-2xl">
            🚀
          </div>
          <span className="text-xs text-[var(--muted)]">Go</span>
        </div>
      </div>
    ),
  },
];

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);
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
            {step > 0 && (
              <button
                onClick={() => goToStep(step - 1)}
                className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg border border-[var(--border)] hover:bg-[var(--card-elevated)] transition-colors"
              >
                Back
              </button>
            )}

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
