import { sfBay } from '@/data/cities/sf-bay';
import { guides, type Guide } from '@/data/cities/sf-bay/guides';
import { Header } from '../../components/Header';
import Link from 'next/link';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return guides.map(g => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = guides.find(g => g.slug === slug);
  if (!guide) return { title: 'Guide — WhenToBoat' };

  return {
    title: `${guide.title} — WhenToBoat`,
    description: guide.description,
    openGraph: {
      title: `${guide.title} — WhenToBoat`,
      description: guide.description,
      siteName: 'WhenToBoat',
      type: 'article',
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = guides.find(g => g.slug === slug);

  if (!guide) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Guide not found</h1>
            <Link href="/guides" className="text-safety-blue hover:underline">Back to all guides</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full space-y-8">
        {/* Hero */}
        <div className="space-y-3">
          <Link href="/guides" className="text-xs text-safety-blue hover:underline">
            ← All Guides
          </Link>
          <h1 className="text-3xl font-bold text-compass-gold leading-tight">{guide.title}</h1>
          <p className="text-lg text-[var(--secondary)]">{guide.subtitle}</p>
          <p className="text-sm text-[var(--muted)]">{guide.description}</p>
          <div className="flex gap-3 text-xs">
            <span className="px-2 py-1 rounded-full bg-reef-teal/10 text-reef-teal border border-reef-teal/20">
              Best: {guide.bestMonths}
            </span>
          </div>
        </div>

        {/* Routes */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">The Routes</h2>
          {guide.routes.map((route, i) => {
            const origin = sfBay.destinations.find(d => d.id === route.originId);
            const dest = sfBay.destinations.find(d => d.id === route.destinationId);
            const diffColor = route.difficulty === 'Easy' ? 'text-reef-teal' : route.difficulty === 'Medium' ? 'text-compass-gold' : 'text-danger-red';

            return (
              <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-compass-gold">#{i + 1}</span>
                    <h3 className="text-base font-semibold text-[var(--foreground)] mt-0.5">
                      {origin?.name ?? route.originId} → {dest?.name ?? route.destinationId}
                    </h3>
                  </div>
                  <div className="flex gap-2 shrink-0 text-xs">
                    <span className={`font-medium ${diffColor}`}>{route.difficulty}</span>
                    {route.distance > 0 && <span className="text-[var(--muted)]">{route.distance} mi</span>}
                  </div>
                </div>
                <p className="text-sm text-[var(--secondary)]">{route.highlight}</p>
                <div className="flex items-center gap-3 text-2xs text-[var(--muted)]">
                  <span>Season: {route.season}</span>
                  {origin && dest && route.distance > 0 && (
                    <Link
                      href={`/?activity=${guide.activity}&origin=${route.originId}`}
                      className="text-safety-blue hover:underline ml-auto"
                    >
                      Plan this trip →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Tips</h2>
          <div className="bg-reef-teal/5 border border-reef-teal/20 rounded-xl p-5 space-y-2">
            {guide.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-[var(--secondary)]">
                <span className="text-reef-teal shrink-0 mt-0.5">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3 pt-4">
          <Link
            href={`/?activity=${guide.activity === 'all' ? 'kayak' : guide.activity}`}
            className="inline-block px-6 py-3 rounded-xl text-sm font-bold bg-reef-teal text-white hover:bg-reef-teal/80 transition-colors shadow-lg"
          >
            Plan Your Trip
          </Link>
          <p className="text-xs text-[var(--muted)]">
            Free planning tool for SF Bay — no account required
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)] space-y-2">
          <p>Always verify conditions with NOAA before departure. This guide is for planning purposes only.</p>
          <p>
            Data sourced from NOAA, US Coast Pilot, and local boater knowledge. Last updated April 2026.
          </p>
        </div>
      </main>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: guide.title,
            description: guide.description,
            author: { '@type': 'Organization', name: 'WhenToBoat' },
            publisher: { '@type': 'Organization', name: 'WhenToBoat', url: 'https://whentoboat.com' },
          }),
        }}
      />
    </div>
  );
}
