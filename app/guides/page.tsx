import { guides } from '@/data/cities/sf-bay/guides';
import { Header } from '../components/Header';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Boating Guides — WhenToBoat',
  description: 'Trip guides for kayaking, sailing, SUP, and powerboating on San Francisco Bay. Routes, tips, and seasonal advice.',
};

const ACTIVITY_ICONS: Record<string, string> = {
  kayak: '🛶',
  powerboat_cruise: '🚤',
  casual_sail: '⛵',
  sup: '🏄‍♂️',
  all: '🌊',
};

export default function GuidesIndex() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-compass-gold">Boating Guides</h1>
          <p className="text-sm text-[var(--muted)] mt-2">
            Trip planning guides for San Francisco Bay — curated from local knowledge, yacht club routes, and rental operator recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map(guide => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-3 hover:border-compass-gold/40 hover:shadow-lg hover:shadow-compass-gold/5 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ACTIVITY_ICONS[guide.activity] ?? '🌊'}</span>
                <h2 className="text-base font-semibold text-[var(--foreground)] leading-tight">{guide.title}</h2>
              </div>
              <p className="text-sm text-[var(--secondary)]">{guide.subtitle}</p>
              <div className="flex items-center gap-3 text-2xs">
                <span className="px-2 py-0.5 rounded-full bg-reef-teal/10 text-reef-teal border border-reef-teal/20">
                  {guide.bestMonths}
                </span>
                <span className="text-[var(--muted)]">{guide.routes.length} routes</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl text-sm font-bold bg-reef-teal text-white hover:bg-reef-teal/80 transition-colors"
          >
            Plan Your Trip
          </Link>
        </div>
      </main>
    </div>
  );
}
