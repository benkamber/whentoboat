'use client';

import { useState, useEffect } from 'react';

/**
 * Click-through disclaimer shown on first use.
 * Must be accepted before using the app.
 * Separate from onboarding — this is the legal gate.
 */
export function Disclaimer() {
  const [accepted, setAccepted] = useState(true); // default true to prevent flash
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('whentoboat-disclaimer-accepted');
    if (!stored) setAccepted(false);
  }, []);

  if (!mounted || accepted) return null;

  const handleAccept = () => {
    localStorage.setItem('whentoboat-disclaimer-accepted', 'true');
    setAccepted(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ocean-950/95 backdrop-blur-sm p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-lg w-full p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-compass-gold">
            Important Safety Notice
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Please read before using WhenToBoat
          </p>
        </div>

        <div className="space-y-4 text-sm text-[var(--secondary)] leading-relaxed">
          <p>
            <strong className="text-[var(--foreground)]">WhenToBoat is a planning tool, not a real-time conditions authority.</strong>{' '}
            Comfort scores and recommendations are based on historical weather patterns and statistical models. They are not forecasts and do not reflect current conditions.
          </p>

          <p>
            <strong className="text-[var(--foreground)]">Always verify conditions before departure.</strong>{' '}
            Check NOAA marine forecasts, live buoy data, and tide predictions before going on the water. Links to authoritative sources are provided throughout the app.
          </p>

          <p>
            <strong className="text-[var(--foreground)]">Conditions can change rapidly.</strong>{' '}
            San Francisco Bay weather can shift from calm to dangerous in under an hour, especially during afternoon thermal winds (April–August). Historical averages do not capture sudden changes.
          </p>

          <p>
            <strong className="text-[var(--foreground)]">You are responsible for your own safety.</strong>{' '}
            The captain of any vessel bears sole responsibility for the decision to depart, the safety of passengers and crew, and compliance with all maritime regulations. WhenToBoat provides information for planning purposes only.
          </p>

          <p className="text-xs text-[var(--muted)]">
            By using this application, you acknowledge that you rely on its information solely at your own risk. WhenToBoat makes no guarantees about the accuracy, completeness, or timeliness of any data presented. See our{' '}
            <a href="/terms" className="text-safety-blue hover:underline">Terms of Service</a>{' '}
            for full details.
          </p>
        </div>

        <button
          onClick={handleAccept}
          className="w-full py-3 rounded-xl bg-reef-teal text-white font-semibold hover:bg-reef-teal/90 transition-colors"
        >
          I understand — let me plan
        </button>
      </div>
    </div>
  );
}
