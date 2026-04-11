import { sfBay } from '@/data/cities/sf-bay';
import { zones } from '@/data/cities/sf-bay/zones';
import { getDocksForDestination } from '@/data/cities/sf-bay/docks';
import { getHistoricalInsights, getZoneSummary } from '@/lib/historical-patterns';
import { Header } from '../../../components/Header';
import Link from 'next/link';
import type { Metadata } from 'next';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ACTIVITY_LABELS: Record<string, string> = {
  kayak: 'Kayaking', sup: 'SUP', powerboat_cruise: 'Powerboat', casual_sail: 'Sailing',
};

export function generateStaticParams() {
  return sfBay.destinations
    .filter(d => d.launchRamp != null || d.activityTags.length > 0)
    .map(d => ({ id: d.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dest = sfBay.destinations.find(d => d.id === id);
  if (!dest) return { title: 'Location — WhenToBoat' };

  const summary = getZoneSummary(dest.zone);

  return {
    title: `${dest.name} Boating Conditions — WhenToBoat`,
    description: `Real-time conditions, tide predictions, and historical weather patterns for ${dest.name} on San Francisco Bay. ${summary}`,
    openGraph: {
      title: `${dest.name} Boating Conditions — WhenToBoat`,
      description: `See today's conditions and seasonal patterns for ${dest.name}. Activity-specific guidance for kayaking, SUP, sailing, and powerboating.`,
      siteName: 'WhenToBoat',
      type: 'article',
    },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dest = sfBay.destinations.find(d => d.id === id);

  if (!dest) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold">Location not found</h1>
            <Link href="/" className="text-safety-blue hover:underline">Back to map</Link>
          </div>
        </main>
      </div>
    );
  }

  const zone = zones.find(z => z.id === dest.zone);
  const docks = getDocksForDestination(dest.id);
  const insights = getHistoricalInsights(dest.zone);
  const mc = zone?.monthlyConditions ?? [];

  const INSIGHT_STYLE = {
    good: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', icon: '✅' },
    neutral: { bg: 'bg-compass-gold/5', border: 'border-compass-gold/20', icon: '💡' },
    caution: { bg: 'bg-warning-amber/5', border: 'border-warning-amber/20', icon: '⚠️' },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full space-y-8">
        {/* Breadcrumbs */}
        <div className="flex gap-2 text-xs text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--foreground)]">Home</Link>
          <span>/</span>
          <Link href="/guides" className="hover:text-[var(--foreground)]">Guides</Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">{dest.name}</span>
        </div>

        {/* Hero */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-compass-gold">{dest.name}</h1>
          <p className="text-sm text-[var(--secondary)]">
            {zone?.name ?? dest.zone} · {zone?.characteristics}
          </p>
          <div className="flex flex-wrap gap-2">
            {dest.activityTags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-2xs font-medium bg-reef-teal/10 text-reef-teal border border-reef-teal/20">
                {ACTIVITY_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA — check live conditions */}
        <div className="bg-reef-teal/10 border border-reef-teal/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-reef-teal">Check today&apos;s conditions</span>
            <p className="text-2xs text-[var(--muted)]">Live forecast + tide predictions + activity scoring</p>
          </div>
          <Link
            href={`/?origin=${dest.id}`}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-reef-teal text-white hover:bg-reef-teal/80 transition-colors"
          >
            Open Planner
          </Link>
        </div>

        {/* Historical patterns — the unique SEO content */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Weather Patterns</h2>
            <p className="text-sm text-[var(--muted)]">
              Based on historical conditions data for {zone?.name ?? dest.zone}.
            </p>
            {insights.map((insight, i) => {
              const style = INSIGHT_STYLE[insight.severity];
              return (
                <div key={i} className={`${style.bg} border ${style.border} rounded-xl p-4 space-y-1`}>
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">{style.icon}</span>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">{insight.title}</h3>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">{insight.text}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Monthly conditions table */}
        {mc.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Monthly Conditions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-3 text-[var(--muted)] font-medium">Month</th>
                    <th className="text-right py-2 px-2 text-[var(--muted)] font-medium">AM Wind</th>
                    <th className="text-right py-2 px-2 text-[var(--muted)] font-medium">PM Wind</th>
                    <th className="text-right py-2 px-2 text-[var(--muted)] font-medium">AM Waves</th>
                    <th className="text-right py-2 px-2 text-[var(--muted)] font-medium">PM Waves</th>
                  </tr>
                </thead>
                <tbody>
                  {mc.map((m, i) => {
                    const pmWindColor = m.pm.windKts > 15 ? 'text-danger-red' : m.pm.windKts > 10 ? 'text-warning-amber' : 'text-[var(--foreground)]';
                    return (
                      <tr key={i} className="border-b border-[var(--border)]/50">
                        <td className="py-1.5 pr-3 font-medium text-[var(--foreground)]">{MONTH_SHORT[i]}</td>
                        <td className="py-1.5 px-2 text-right text-[var(--foreground)]">{m.am.windKts} kt</td>
                        <td className={`py-1.5 px-2 text-right font-medium ${pmWindColor}`}>{m.pm.windKts} kt</td>
                        <td className="py-1.5 px-2 text-right text-[var(--foreground)]">{m.am.waveHtFt} ft</td>
                        <td className="py-1.5 px-2 text-right text-[var(--foreground)]">{m.pm.waveHtFt} ft</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Launch ramp info */}
        {dest.launchRamp && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Launch Access</h2>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-2">
              <h3 className="font-medium text-[var(--foreground)]">{dest.launchRamp.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-[var(--secondary)]">
                <div><span className="text-[var(--muted)]">Hours:</span> {dest.launchRamp.hours}</div>
                <div><span className="text-[var(--muted)]">Fee:</span> {dest.launchRamp.fee}</div>
                <div><span className="text-[var(--muted)]">Parking:</span> {dest.launchRamp.parking}</div>
                {dest.launchRamp.maxBoatLength && (
                  <div><span className="text-[var(--muted)]">Max boat:</span> {dest.launchRamp.maxBoatLength} ft</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Docking options */}
        {docks.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Docking</h2>
            {docks.map((dock, i) => (
              <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-1">
                <h3 className="text-sm font-medium text-[var(--foreground)]">{dock.name}</h3>
                <div className="text-xs text-[var(--muted)]">{dock.fees} · {dock.hours}</div>
                <div className="text-xs text-[var(--muted)]">Depth: {dock.depthFt} · Max LOA: {dock.maxLoa}</div>
                {dock.dineOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dock.dineOptions.map((r, j) => (
                      <span key={j} className="text-2xs px-2 py-0.5 rounded-full bg-reef-teal/10 text-reef-teal border border-reef-teal/20">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {dest.notes && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <p className="text-sm text-[var(--secondary)]">{dest.notes}</p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center space-y-3 pt-4">
          <Link
            href={`/?origin=${dest.id}`}
            className="inline-block px-6 py-3 rounded-xl text-sm font-bold bg-reef-teal text-white hover:bg-reef-teal/80 transition-colors shadow-lg"
          >
            Plan a Trip from {dest.name}
          </Link>
          <p className="text-xs text-[var(--muted)]">
            Free planning tool — no account required
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)] space-y-2">
          <p>
            Historical patterns based on NOAA NDBC, NWS, and US Coast Pilot data.
            Conditions can change rapidly. Always verify with{' '}
            <a href="https://www.weather.gov/marine" target="_blank" rel="noopener noreferrer" className="text-safety-blue hover:underline">
              NOAA
            </a>{' '}
            before departure.
          </p>
        </div>
      </main>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Place',
            name: dest.name,
            description: `Boating conditions and trip planning for ${dest.name}, San Francisco Bay.`,
            geo: { '@type': 'GeoCoordinates', latitude: dest.lat, longitude: dest.lng },
            url: `https://whentoboat.com/location/sf-bay/${dest.id}`,
          }),
        }}
      />
    </div>
  );
}
