'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { sfBay } from '@/data/cities/sf-bay';
import { activities } from '@/data/activities';
import { zones } from '@/data/cities/sf-bay/zones';
import { Header } from '../components/Header';
import { ShouldIGo } from '../components/ShouldIGo';
import type { ActivityType } from '@/engine/types';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function BriefingContent() {
  const searchParams = useSearchParams();
  const originId = searchParams.get('origin') ?? 'sau';
  const activityId = (searchParams.get('activity') ?? 'kayak') as ActivityType;
  const dateStr = searchParams.get('date');

  const origin = sfBay.destinations.find(d => d.id === originId);
  const act = activities.find(a => a.id === activityId);
  const zone = origin ? zones.find(z => z.id === origin.zone) : null;

  const targetDate = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  const month = targetDate.getMonth();
  const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Get seasonal conditions for the month
  const mc = zone?.monthlyConditions[month];
  const amCond = mc?.am;
  const pmCond = mc?.pm;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-compass-gold">Trip Briefing</h1>
          <p className="text-sm text-[var(--secondary)] mt-1">
            {act?.name ?? 'Boating'} from {origin?.name ?? originId} · {dayName}
          </p>
        </div>

        {/* Live conditions (if today or near-future) */}
        <ShouldIGo />

        {/* Seasonal patterns for this month */}
        {amCond && pmCond && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-compass-gold uppercase tracking-wider">
              Typical {MONTH_NAMES[month]} Conditions — {zone?.name}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <span className="text-xs text-[var(--muted)] font-medium">Morning</span>
                <div className="text-[var(--foreground)]">Wind: {amCond.windKts} kt</div>
                <div className="text-[var(--foreground)]">Waves: {amCond.waveHtFt} ft</div>
              </div>
              <div className="space-y-2">
                <span className="text-xs text-[var(--muted)] font-medium">Afternoon</span>
                <div className="text-[var(--foreground)]">Wind: {pmCond.windKts} kt</div>
                <div className="text-[var(--foreground)]">Waves: {pmCond.waveHtFt} ft</div>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] italic">
              Historical averages. Actual conditions may differ.
            </p>
          </div>
        )}

        {/* Gear recommendations */}
        <div className="bg-reef-teal/5 border border-reef-teal/20 rounded-xl p-5 space-y-2">
          <h2 className="text-sm font-semibold text-reef-teal">What to Bring</h2>
          <ul className="text-sm text-[var(--secondary)] space-y-1">
            <li>• PFD (required by law for all vessel types)</li>
            {(() => {
              // Water temp gear recommendations
              const waterTemp = mc ? (amCond?.windKts ?? 0) < 8 ? 58 : 55 : 56; // rough estimate
              if (waterTemp < 60) return <li>• Wetsuit or drysuit — water temperature around {waterTemp}°F</li>;
              return <li>• Sun protection — water reflects UV</li>;
            })()}
            {(activityId === 'kayak' || activityId === 'sup' || activityId === 'fishing_kayak') && (
              <>
                <li>• Paddle leash</li>
                <li>• Whistle (attached to PFD)</li>
                <li>• Dry bag for phone and keys</li>
              </>
            )}
            {(activityId === 'powerboat_cruise' || activityId === 'casual_sail' || activityId === 'fishing_boat') && (
              <>
                <li>• VHF radio (Channel 16 for emergencies)</li>
                <li>• Navigation lights if returning after sunset</li>
                <li>• Anchor and line</li>
              </>
            )}
            <li>• Water and snacks</li>
            <li>• Sunglasses with strap</li>
          </ul>
        </div>

        {/* Verify links */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Verify Before You Go</h2>
          <div className="flex flex-wrap gap-2">
            <a href="https://www.weather.gov/mtr/MarineProducts" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-xs text-safety-blue bg-[var(--card)] border border-[var(--border)] hover:underline">NOAA Marine Forecast →</a>
            <a href="https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9414290" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-xs text-safety-blue bg-[var(--card)] border border-[var(--border)] hover:underline">Tide Predictions →</a>
            <a href="https://www.ndbc.noaa.gov/station_page.php?station=FTPC1" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-xs text-safety-blue bg-[var(--card)] border border-[var(--border)] hover:underline">Fort Point Buoy →</a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-[var(--border)] pt-4 text-2xs text-[var(--muted)] space-y-2">
          <p>
            This briefing is for planning reference only. Conditions can change rapidly.
            The operator is solely responsible for go/no-go decisions.
            Always verify with NOAA before departure.
          </p>
          <p>
            <a href="https://whentoboat.com" className="text-safety-blue hover:underline">WhenToBoat</a> — free boating conditions for SF Bay
          </p>
        </div>
      </main>
    </div>
  );
}

export default function BriefingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[var(--muted)]">Loading briefing...</div>}>
      <BriefingContent />
    </Suspense>
  );
}
