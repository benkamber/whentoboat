import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/app/components/Header';
import { destinations } from '@/data/cities/sf-bay/destinations';
import { zones } from '@/data/cities/sf-bay/zones';
import { zoneVerifyLinks } from '@/data/cities/sf-bay/verify-links';
import { activities } from '@/data/activities';
import type { ActivityType } from '@/engine/types';

// ---------------------------------------------------------------------------
// Static params — pre-render all 13 destinations
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return destinations.map((d) => ({ id: d.id }));
}

// ---------------------------------------------------------------------------
// Per-destination metadata for SEO
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dest = destinations.find((d) => d.id === id);
  if (!dest) return { title: 'Destination Not Found — WhenToBoat' };

  const activityNames = dest.activityTags
    .map((tag) => activities.find((a) => a.id === tag)?.name)
    .filter(Boolean)
    .join(', ');

  return {
    title: `Boating Conditions at ${dest.name} — WhenToBoat`,
    description: `${dest.name} on San Francisco Bay. ${dest.dockInfo}. Best for ${activityNames}. Check conditions and plan your trip.`,
    openGraph: {
      title: `Boating Conditions at ${dest.name} — WhenToBoat`,
      description: `Plan your trip to ${dest.name}. Activity-specific comfort scores, monthly conditions, and safety links.`,
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function scoreColor(score: number): string {
  if (score >= 9) return 'bg-score-10 text-ocean-950';
  if (score >= 7) return 'bg-score-8 text-ocean-950';
  if (score >= 5) return 'bg-score-5 text-ocean-950';
  if (score >= 3) return 'bg-score-3 text-white';
  return 'bg-score-1 text-white';
}

function verifyTypeIcon(type: string): string {
  switch (type) {
    case 'forecast': return '🌤️';
    case 'buoy': return '🔵';
    case 'tide': return '🌊';
    case 'current': return '💨';
    case 'wind': return '🌬️';
    default: return '🔗';
  }
}

// ---------------------------------------------------------------------------
// Page component (server)
// ---------------------------------------------------------------------------

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dest = destinations.find((d) => d.id === id);
  if (!dest) notFound();

  const zone = zones.find((z) => z.id === dest.zone);
  const verifyLinks = zoneVerifyLinks[dest.zone] ?? [];
  const destActivities = dest.activityTags
    .map((tag) => activities.find((a) => a.id === tag))
    .filter(Boolean);

  // Collect all before-you-go items relevant to this destination's activities
  const beforeYouGoItems: { text: string; url: string | null }[] = [];
  const seenTexts = new Set<string>();
  for (const act of destActivities) {
    if (!act) continue;
    for (const item of act.beforeYouGo) {
      if (seenTexts.has(item.text)) continue;
      const isRelevant =
        item.activityTypes === 'all' ||
        item.activityTypes.some((t: ActivityType) =>
          dest.activityTags.includes(t)
        );
      if (isRelevant) {
        seenTexts.add(item.text);
        beforeYouGoItems.push({ text: item.text, url: item.url });
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-[var(--muted)] mb-6">
          <Link href="/" className="hover:text-compass-gold transition-colors">
            WhenToBoat
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--foreground)]">{dest.name}</span>
        </nav>

        {/* Hero */}
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-compass-gold mb-2">
            {dest.name}
          </h1>
          {zone && (
            <p className="text-lg text-[var(--muted)]">
              {zone.name} Zone &middot; San Francisco Bay
            </p>
          )}
        </header>

        {/* Info grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <InfoCard label="Dock Info" value={dest.dockInfo} />
          {dest.minDepth !== null && (
            <InfoCard label="Min Depth (MLLW)" value={`${dest.minDepth} ft`} />
          )}
          {zone && (
            <InfoCard label="Zone Characteristics" value={zone.characteristics} />
          )}
          {dest.notes && <InfoCard label="Notes" value={dest.notes} />}
        </section>

        {/* Activity tags */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">
            Suitable Activities
          </h2>
          <div className="flex flex-wrap gap-2">
            {destActivities.map(
              (act) =>
                act && (
                  <span
                    key={act.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--card-elevated)] border border-[var(--border)] text-[var(--foreground)]"
                  >
                    <span>{act.icon}</span>
                    {act.name}
                  </span>
                )
            )}
          </div>
        </section>

        {/* Launch ramp */}
        {dest.launchRamp && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">
              Launch Ramp
            </h2>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="font-semibold text-compass-gold mb-3">
                {dest.launchRamp.name}
              </h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <dt className="text-[var(--muted)]">Type</dt>
                <dd className="capitalize">{dest.launchRamp.type}</dd>
                <dt className="text-[var(--muted)]">Hours</dt>
                <dd>{dest.launchRamp.hours}</dd>
                <dt className="text-[var(--muted)]">Fee</dt>
                <dd>{dest.launchRamp.fee}</dd>
                <dt className="text-[var(--muted)]">Parking</dt>
                <dd>{dest.launchRamp.parking}</dd>
                {dest.launchRamp.maxBoatLength && (
                  <>
                    <dt className="text-[var(--muted)]">Max Boat Length</dt>
                    <dd>{dest.launchRamp.maxBoatLength} ft</dd>
                  </>
                )}
                <dt className="text-[var(--muted)]">Source</dt>
                <dd className="text-[var(--muted)] text-xs italic">
                  {dest.launchRamp.source}
                </dd>
              </dl>
            </div>
          </section>
        )}

        {/* Monthly conditions grid */}
        {zone && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">
              Monthly Conditions
            </h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              Average comfort scores for the {zone.name} zone. Scale: 1 (poor)
              to 10 (perfect).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left pr-3 py-2 text-[var(--muted)] font-medium" />
                    {MONTHS.map((m) => (
                      <th
                        key={m}
                        className="px-1 py-2 text-center text-[var(--muted)] font-medium text-xs"
                      >
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="pr-3 py-1 text-[var(--muted)] text-xs font-medium whitespace-nowrap">
                      AM
                    </td>
                    {zone.monthlyConditions.map((mc) => (
                      <td key={mc.month} className="px-1 py-1 text-center">
                        <span
                          className={`inline-block w-7 h-7 leading-7 rounded text-xs font-bold ${scoreColor(
                            mc.am.comfort
                          )}`}
                        >
                          {mc.am.comfort}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="pr-3 py-1 text-[var(--muted)] text-xs font-medium whitespace-nowrap">
                      PM
                    </td>
                    {zone.monthlyConditions.map((mc) => (
                      <td key={mc.month} className="px-1 py-1 text-center">
                        <span
                          className={`inline-block w-7 h-7 leading-7 rounded text-xs font-bold ${scoreColor(
                            mc.pm.comfort
                          )}`}
                        >
                          {mc.pm.comfort}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Verify links */}
        {verifyLinks.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">
              Verify Before You Go
            </h2>
            <div className="grid gap-2">
              {verifyLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-elevated)] transition-colors"
                >
                  <span className="text-lg">{verifyTypeIcon(link.type)}</span>
                  <span className="text-sm font-medium">{link.label}</span>
                  <span className="ml-auto text-xs text-[var(--muted)]">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Before you go checklist */}
        {beforeYouGoItems.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">
              Before You Go Checklist
            </h2>
            <ul className="space-y-2">
              {beforeYouGoItems.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-[var(--foreground)]"
                >
                  <span className="mt-0.5 w-5 h-5 rounded border border-[var(--border)] bg-[var(--card-elevated)] flex-shrink-0 flex items-center justify-center text-xs text-[var(--muted)]">
                    ✓
                  </span>
                  <span>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 decoration-[var(--muted)] hover:text-compass-gold transition-colors"
                      >
                        {item.text}
                      </a>
                    ) : (
                      item.text
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA links */}
        <section className="flex flex-col sm:flex-row gap-3 mb-10">
          <Link
            href={`/?destination=${dest.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-ocean-950 bg-reef-teal hover:bg-reef-teal/90 transition-colors text-sm"
          >
            Plan a trip to {dest.name} →
          </Link>
          <Link
            href={`/explore?destination=${dest.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-compass-gold border border-compass-gold/40 hover:bg-compass-gold/10 transition-colors text-sm"
          >
            See {dest.name} on the map →
          </Link>
        </section>

        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Place',
              name: dest.name,
              description: `${dest.name} on San Francisco Bay. ${dest.dockInfo}. ${dest.notes}`,
              geo: {
                '@type': 'GeoCoordinates',
                latitude: dest.lat,
                longitude: dest.lng,
              },
              isPartOf: {
                '@type': 'Place',
                name: 'San Francisco Bay',
              },
            }),
          }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-6 px-4 text-center text-xs text-[var(--muted)]">
        <p>
          Conditions are estimates based on historical averages. Always verify
          with{' '}
          <a
            href="https://www.weather.gov/mtr/MarineProducts"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-compass-gold"
          >
            NOAA
          </a>{' '}
          before departure.
        </p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <dt className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd className="text-sm text-[var(--foreground)]">{value}</dd>
    </div>
  );
}
