import { sfBay } from '@/data/cities/sf-bay';
import { activities } from '@/data/activities';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

/**
 * Synthetic bookmark links for partners and sharing.
 *
 * URL patterns:
 *   /go/sausalito                    → home page with origin=sau
 *   /go/sausalito/kayak              → home page with origin=sau, activity=kayak
 *   /go/sausalito/kayak/angel-island → home page with origin=sau, dest=ang, activity=kayak
 *
 * Partners can create branded links:
 *   seatrek.com links to → whentoboat.com/go/sausalito/kayak
 *   "Check today's kayaking conditions at our launch site"
 *
 * These are SEO-friendly, human-readable URLs that redirect to the
 * main app with the right parameters pre-set.
 */

// Map human-readable slugs to destination IDs
const SLUG_TO_ID: Record<string, string> = {};
const ID_TO_SLUG: Record<string, string> = {};
for (const dest of sfBay.destinations) {
  const slug = dest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  SLUG_TO_ID[slug] = dest.id;
  ID_TO_SLUG[dest.id] = slug;
}

// Map activity slugs to IDs
const ACTIVITY_SLUG: Record<string, string> = {
  'kayak': 'kayak',
  'kayaking': 'kayak',
  'sup': 'sup',
  'paddleboard': 'sup',
  'powerboat': 'powerboat_cruise',
  'motor': 'powerboat_cruise',
  'sail': 'casual_sail',
  'sailing': 'casual_sail',
  'fish': 'fishing_boat',
  'fishing': 'fishing_boat',
  'kayak-fishing': 'fishing_kayak',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ params: string[] }>;
}): Promise<Metadata> {
  const segments = (await params).params;
  const originSlug = segments[0];
  const activitySlug = segments[1];
  const destSlug = segments[2];

  const originId = SLUG_TO_ID[originSlug] ?? originSlug;
  const origin = sfBay.destinations.find(d => d.id === originId);
  const actId = activitySlug ? ACTIVITY_SLUG[activitySlug] : null;
  const act = actId ? activities.find(a => a.id === actId) : null;
  const destId = destSlug ? (SLUG_TO_ID[destSlug] ?? destSlug) : null;
  const dest = destId ? sfBay.destinations.find(d => d.id === destId) : null;

  const title = dest
    ? `${act?.name ?? 'Boating'} from ${origin?.name ?? originSlug} to ${dest.name} — WhenToBoat`
    : act
      ? `${act.name} conditions at ${origin?.name ?? originSlug} — WhenToBoat`
      : `Boating conditions at ${origin?.name ?? originSlug} — WhenToBoat`;

  return {
    title,
    description: `See today's conditions for ${act?.name?.toLowerCase() ?? 'boating'} at ${origin?.name ?? originSlug} on San Francisco Bay.`,
    openGraph: { title, siteName: 'WhenToBoat' },
  };
}

export default async function GoPage({
  params,
}: {
  params: Promise<{ params: string[] }>;
}) {
  const segments = (await params).params;
  const originSlug = segments[0];
  const activitySlug = segments[1];
  const destSlug = segments[2];

  const originId = SLUG_TO_ID[originSlug] ?? originSlug;
  const actId = activitySlug ? (ACTIVITY_SLUG[activitySlug] ?? activitySlug) : null;
  const destId = destSlug ? (SLUG_TO_ID[destSlug] ?? destSlug) : null;

  // Build redirect URL with query params
  const queryParts: string[] = [];
  queryParts.push(`origin=${originId}`);
  if (actId) queryParts.push(`activity=${actId}`);
  if (destId) queryParts.push(`dest=${destId}`);

  redirect(`/?${queryParts.join('&')}`);
}
