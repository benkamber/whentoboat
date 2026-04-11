'use client';

import { useState } from 'react';

export function EmergencyButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-2 py-1.5 rounded-lg text-xs font-bold bg-danger-red/20 text-danger-red border border-danger-red/30 hover:bg-danger-red/30 transition-colors"
        aria-label="Emergency information"
        title="Emergency contacts and safety procedures"
      >
        SOS
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-[var(--background)] border border-danger-red/30 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-danger-red">Emergency Information</h2>
              <button onClick={() => setOpen(false)} className="text-[var(--muted)] hover:text-[var(--foreground)]">✕</button>
            </div>

            <div className="bg-danger-red/10 border border-danger-red/30 rounded-lg p-4 space-y-2">
              <div className="text-sm font-bold text-danger-red">Life-Threatening Emergency</div>
              <a href="tel:911" className="block text-2xl font-bold text-[var(--foreground)] hover:text-danger-red">
                Call 911
              </a>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 space-y-3">
              <div className="text-sm font-semibold text-[var(--foreground)]">Coast Guard</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">VHF Radio</span>
                  <span className="font-bold text-compass-gold">Channel 16</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">USCG Sector SF</span>
                  <a href="tel:+14153993547" className="font-medium text-safety-blue hover:underline">(415) 399-3547</a>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Station Golden Gate</span>
                  <a href="tel:+14155567608" className="font-medium text-safety-blue hover:underline">(415) 556-7608</a>
                </div>
              </div>
            </div>

            <div className="bg-warning-amber/10 border border-warning-amber/30 rounded-lg p-4 space-y-2">
              <div className="text-sm font-semibold text-warning-amber">Person Overboard</div>
              <ol className="text-sm text-[var(--secondary)] space-y-1 list-decimal pl-4">
                <li>Throw any flotation device immediately</li>
                <li>Point continuously at the person in the water</li>
                <li>Call VHF Channel 16: &quot;MAYDAY MAYDAY MAYDAY&quot;</li>
                <li>Give position (use GPS or landmark)</li>
                <li>Do NOT jump in after them</li>
              </ol>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <a
                href="https://www.uscgboating.org/recreational-boaters/floating-plan.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-safety-blue hover:underline"
              >
                File a Float Plan with USCG →
              </a>
              <a
                href="https://www.weather.gov/marine"
                target="_blank"
                rel="noopener noreferrer"
                className="text-safety-blue hover:underline"
              >
                NOAA Marine Forecast →
              </a>
            </div>

            <p className="text-2xs text-[var(--muted)] text-center">
              Save this info to your phone. Cell service may be unavailable on the water.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
