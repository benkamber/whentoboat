import { sfBay } from '@/data/cities/sf-bay';
import { getActivity } from '@/data/activities';
import { vesselPresets } from '@/data/vessels';
import { routeComfort } from '@/engine/scoring';
import { Header } from '../components/Header';
import { ScoreBadge, getScoreLabel } from '../components/ScoreBadge';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ActivityType } from '@/engine/types';

// Dynamic metadata for Open Graph share previews
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const activity = (params.activity ?? 'kayak') as ActivityType;
  const destId = params.dest ?? 'ang';
  const originId = params.origin ?? 'sau';
  const date = params.date ?? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const dest = sfBay.destinations.find(d => d.id === destId);
  const origin = sfBay.destinations.find(d => d.id === originId);
  const act = getActivity(activity);

  const title = `${act.name} to ${dest?.name ?? 'the Bay'} — WhenToBoat`;
  const description = `Best boating conditions from ${origin?.name ?? 'SF Bay'} on ${date}. Plan your trip with live forecast data.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'WhenToBoat',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const activity = (params.activity ?? 'kayak') as ActivityType;
  const destId = params.dest ?? 'ang';
  const originId = params.origin ?? 'sau';
  const month = parseInt(params.month ?? String(new Date().getMonth()), 10);
  const hour = parseInt(params.hour ?? '9', 10);
  const date = params.date ?? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const dest = sfBay.destinations.find(d => d.id === destId);
  const origin = sfBay.destinations.find(d => d.id === originId);
  const act = getActivity(activity);
  const vesselMap: Record<string, string> = { kayak: 'kayak', sup: 'sup', powerboat_cruise: 'powerboat', casual_sail: 'sailboat' };
  const vessel = vesselPresets.find(v => v.type === (vesselMap[activity] ?? 'kayak')) ?? vesselPresets[0];

  let score = 7;
  let primaryReason = 'Great conditions';
  let distance = 0;
  let transitMinutes = 0;

  if (origin && dest) {
    const scored = routeComfort(origin, dest, month, hour, act, vessel, sfBay);
    score = scored.score;
    primaryReason = scored.primaryReason;
    distance = scored.distance;
    transitMinutes = scored.transitMinutes;
  }

  const scoreLabel = getScoreLabel(score);
  const formatHour = (h: number) => {
    if (h === 0 || h === 12) return h === 0 ? '12 AM' : '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {/* Share card */}
        <div className="max-w-md w-full space-y-6">
          {/* The card */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl">
            {/* Header band */}
            <div className={`px-6 py-4 ${score >= 7 ? 'bg-reef-teal' : score >= 5 ? 'bg-compass-gold' : 'bg-danger-red'} text-white`}>
              <p className="text-xs font-medium opacity-80 uppercase tracking-wider">Best for {act.name}</p>
              <h1 className="text-2xl font-bold mt-1">{dest?.name ?? 'SF Bay'}</h1>
              <p className="text-sm opacity-90 mt-0.5">{date} &middot; {formatHour(hour)}</p>
            </div>

            {/* Score + details */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                <ScoreBadge score={score} size="lg" />
                <div>
                  <p className="text-lg font-bold">{scoreLabel}</p>
                  <p className="text-sm text-[var(--muted)]">{primaryReason}</p>
                </div>
              </div>

              {/* Route details */}
              <div className="flex gap-4 text-sm text-[var(--secondary)]">
                <div>
                  <span className="text-[var(--muted)]">From</span>
                  <p className="font-medium text-[var(--foreground)]">{origin?.name ?? 'SF Bay'}</p>
                </div>
                <div>
                  <span className="text-[var(--muted)]">Distance</span>
                  <p className="font-medium text-[var(--foreground)]">{distance} mi</p>
                </div>
                <div>
                  <span className="text-[var(--muted)]">Transit</span>
                  <p className="font-medium text-[var(--foreground)]">{transitMinutes} min</p>
                </div>
              </div>

              {/* Activity + vessel */}
              <div className="flex items-center gap-2 text-xs text-[var(--muted)] pt-2 border-t border-[var(--border)]">
                <span>{act.icon} {act.name}</span>
                <span>&middot;</span>
                <span>{vessel.name}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-[var(--card-elevated)] border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-xs font-bold text-compass-gold">WhenToBoat</span>
              <span className="text-[10px] text-[var(--muted)]">Plan smarter. Boat safer.</span>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-3">
            <Link
              href={`/?activity=${activity}&origin=${originId}`}
              className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold bg-reef-teal text-white hover:bg-reef-teal/80 transition-colors shadow-lg"
            >
              Open in WhenToBoat
            </Link>
            <p className="text-xs text-[var(--muted)]">
              Free boating planner for SF Bay &middot; No account required
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
