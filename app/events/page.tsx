'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { activities } from '@/data/activities';
import { allBayEvents, getEventsForMonth, type EventCategory, type BayEvent } from '@/data/cities/sf-bay/events';
import { getEventsForTrip, eventSentimentSummary, type EventForTrip, type EventSentiment } from '@/lib/event-relevance';
import { Header } from '../components/Header';
import type { ActivityType } from '@/engine/types';

// ── Constants ────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type ViewTab = 'racing' | 'shows' | 'activity';

const VIEW_TABS: { id: ViewTab; label: string; description: string }[] = [
  { id: 'racing', label: 'Regattas & Racing', description: 'Yacht club regattas, beer-can racing, offshore races, foil events' },
  { id: 'shows', label: 'Shows & Events', description: 'Boat shows, parades, heritage events, community gatherings' },
  { id: 'activity', label: 'For Your Activity', description: 'Events filtered and rated for your selected activity' },
];

const RACING_CATEGORIES: EventCategory[] = [
  'major-regatta', 'club-regatta', 'one-design', 'midwinter', 'beer-can', 'offshore', 'foil-race', 'youth',
];

const SHOWS_CATEGORIES: EventCategory[] = [
  'boat-show', 'parade', 'fleet-week', 'lighted-parade', 'holiday', 'heritage', 'community',
  'swim', 'paddle', 'dragon-boat', 'fishing',
];

const CATEGORY_LABELS: Record<EventCategory, string> = {
  'major-regatta': 'Major Regattas',
  'club-regatta': 'Club Regattas',
  'one-design': 'One-Design',
  'beer-can': 'Beer Can Racing',
  'midwinter': 'Midwinter Series',
  'foil-race': 'Foil Racing',
  'offshore': 'Offshore Races',
  'boat-show': 'Boat Shows',
  'parade': 'Parades',
  'fleet-week': 'Fleet Week',
  'lighted-parade': 'Lighted Parades',
  'holiday': 'Holidays',
  'swim': 'Open Water Swims',
  'paddle': 'Paddle Events',
  'dragon-boat': 'Dragon Boat',
  'fishing': 'Fishing',
  'heritage': 'Heritage',
  'youth': 'Youth Sailing',
  'community': 'Community',
};

const SENTIMENT_STYLE: Record<EventSentiment, { bg: string; border: string; text: string }> = {
  avoid:   { bg: 'bg-danger-red/10', border: 'border-danger-red/30', text: 'text-danger-red' },
  caution: { bg: 'bg-warning-amber/10', border: 'border-warning-amber/30', text: 'text-warning-amber' },
  fun:     { bg: 'bg-reef-teal/10', border: 'border-reef-teal/30', text: 'text-reef-teal' },
  neutral: { bg: 'bg-[var(--card)]', border: 'border-[var(--border)]', text: 'text-[var(--muted)]' },
};

const RESTRICTION_BADGE: Record<string, { label: string; color: string }> = {
  major: { label: 'USCG Restricted Zone', color: 'bg-danger-red/20 text-danger-red border-danger-red/30' },
  moderate: { label: 'Traffic Advisory', color: 'bg-warning-amber/20 text-warning-amber border-warning-amber/30' },
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const { activity: storeActivity } = useAppStore();
  const [activity, setActivity] = useState<ActivityType>(storeActivity);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [viewTab, setViewTab] = useState<ViewTab>('racing');

  const monthEvents = useMemo(() => getEventsForMonth(selectedMonth + 1), [selectedMonth]);
  const activityEvents = useMemo(() => getEventsForTrip(selectedMonth + 1, activity), [selectedMonth, activity]);
  const activityCounts = useMemo(() => eventSentimentSummary(activityEvents), [activityEvents]);

  const racingEvents = useMemo(() =>
    monthEvents.filter(e => RACING_CATEGORIES.includes(e.category))
      .sort((a, b) => {
        // Major regattas first, then by category
        const order: Record<string, number> = { 'major-regatta': 0, 'offshore': 1, 'club-regatta': 2, 'foil-race': 3, 'beer-can': 4, 'midwinter': 5, 'one-design': 6, 'youth': 7 };
        return (order[a.category] ?? 99) - (order[b.category] ?? 99);
      }),
  [monthEvents]);

  const showsEvents = useMemo(() =>
    monthEvents.filter(e => SHOWS_CATEGORIES.includes(e.category))
      .sort((a, b) => {
        const order: Record<string, number> = { 'fleet-week': 0, 'parade': 1, 'lighted-parade': 2, 'boat-show': 3, 'holiday': 4, 'heritage': 5, 'swim': 6, 'paddle': 7, 'dragon-boat': 8, 'community': 9, 'fishing': 10 };
        return (order[a.category] ?? 99) - (order[b.category] ?? 99);
      }),
  [monthEvents]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-compass-gold">Bay Events Calendar</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {allBayEvents.length} recurring events across San Francisco Bay — regattas, boat shows, parades, and more.
          </p>
        </div>

        {/* Month tab strip */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {MONTHS.map((m, i) => (
            <button
              key={i}
              onClick={() => setSelectedMonth(i)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedMonth === i
                  ? 'bg-compass-gold text-ocean-900 shadow-sm'
                  : 'bg-[var(--card)] text-[var(--secondary)] border border-[var(--border)] hover:border-compass-gold/50'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* View subtabs */}
        <div className="flex border-b border-[var(--border)]" role="tablist">
          {VIEW_TABS.map(tab => {
            const isActive = viewTab === tab.id;
            const count = tab.id === 'racing' ? racingEvents.length
              : tab.id === 'shows' ? showsEvents.length
              : activityEvents.length;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setViewTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-compass-gold text-compass-gold'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-2xs ${isActive ? 'text-compass-gold/70' : 'text-[var(--muted)]'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Month + tab summary */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-compass-gold">{MONTH_FULL[selectedMonth]}</span>
          {viewTab === 'activity' && (
            <div className="flex gap-2 text-xs">
              {activityCounts.avoid > 0 && <span className="text-danger-red">{activityCounts.avoid} avoid</span>}
              {activityCounts.caution > 0 && <span className="text-warning-amber">{activityCounts.caution} caution</span>}
              {activityCounts.fun > 0 && <span className="text-reef-teal">{activityCounts.fun} fun</span>}
            </div>
          )}
        </div>

        {/* ───────── RACING TAB ───────── */}
        {viewTab === 'racing' && (
          <div className="space-y-6">
            {racingEvents.length === 0 ? (
              <EmptyState month={MONTH_FULL[selectedMonth]} type="racing events" />
            ) : (
              <>
                {/* Group by category */}
                {RACING_CATEGORIES.filter(cat => racingEvents.some(e => e.category === cat)).map(cat => {
                  const catEvents = racingEvents.filter(e => e.category === cat);
                  const isMajor = cat === 'major-regatta';
                  return (
                    <div key={cat}>
                      <h2 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${isMajor ? 'text-compass-gold' : 'text-[var(--muted)]'}`}>
                        {CATEGORY_LABELS[cat]} ({catEvents.length})
                      </h2>
                      <div className={`grid gap-2 ${isMajor ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                        {catEvents.map(e => (
                          <RacingCard key={e.id} event={e} isMajor={isMajor} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ───────── SHOWS & EVENTS TAB ───────── */}
        {viewTab === 'shows' && (
          <div className="space-y-6">
            {showsEvents.length === 0 ? (
              <EmptyState month={MONTH_FULL[selectedMonth]} type="shows or events" />
            ) : (
              <>
                {SHOWS_CATEGORIES.filter(cat => showsEvents.some(e => e.category === cat)).map(cat => {
                  const catEvents = showsEvents.filter(e => e.category === cat);
                  const isHighlight = cat === 'fleet-week' || cat === 'parade' || cat === 'lighted-parade';
                  return (
                    <div key={cat}>
                      <h2 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${isHighlight ? 'text-compass-gold' : 'text-[var(--muted)]'}`}>
                        {CATEGORY_LABELS[cat]} ({catEvents.length})
                      </h2>
                      <div className={`grid gap-2 ${isHighlight ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                        {catEvents.map(e => (
                          <ShowCard key={e.id} event={e} isHighlight={isHighlight} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ───────── FOR YOUR ACTIVITY TAB ───────── */}
        {viewTab === 'activity' && (
          <div className="space-y-6">
            {/* Activity selector */}
            <div className="flex gap-1">
              {activities.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setActivity(a.id)}
                  className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activity === a.id
                      ? 'bg-reef-teal text-white shadow-sm'
                      : 'bg-[var(--card)] text-[var(--secondary)] border border-[var(--border)] hover:border-reef-teal/50'
                  }`}
                  aria-pressed={activity === a.id}
                >
                  <span aria-hidden="true">{a.icon}</span> {a.name}
                </button>
              ))}
            </div>

            {activityEvents.length === 0 ? (
              <EmptyState month={MONTH_FULL[selectedMonth]} type="events for this activity" />
            ) : (
              <>
                {/* Avoid */}
                {activityEvents.filter(e => e.sentiment === 'avoid').length > 0 && (
                  <SentimentSection
                    title="Avoid These Areas"
                    subtitle="Restricted zones or dangerous conditions for your activity"
                    events={activityEvents.filter(e => e.sentiment === 'avoid')}
                    sentiment="avoid"
                  />
                )}
                {/* Caution */}
                {activityEvents.filter(e => e.sentiment === 'caution').length > 0 && (
                  <SentimentSection
                    title="Use Caution"
                    subtitle="Events that create congestion or require awareness"
                    events={activityEvents.filter(e => e.sentiment === 'caution')}
                    sentiment="caution"
                  />
                )}
                {/* Fun */}
                {activityEvents.filter(e => e.sentiment === 'fun').length > 0 && (
                  <SentimentSection
                    title="Things to Do"
                    subtitle="Events worth attending or spectating from the water"
                    events={activityEvents.filter(e => e.sentiment === 'fun')}
                    sentiment="fun"
                  />
                )}
                {/* Neutral */}
                {activityEvents.filter(e => e.sentiment === 'neutral').length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
                      + {activityEvents.filter(e => e.sentiment === 'neutral').length} events with no impact on your activity
                    </summary>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {activityEvents.filter(e => e.sentiment === 'neutral').map(e => (
                        <ActivityCard key={e.id} event={e} />
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)] space-y-2">
          <p>
            Event data sourced from YRA, PICYA, Latitude 38, and individual yacht club calendars.
            Last updated: April 2026. Dates shift yearly — always verify with organizers before attending.
          </p>
        </div>
      </main>
    </div>
  );
}

// ── Components ───────────────────────────────────────────────────────────────

function EmptyState({ month, type }: { month: string; type: string }) {
  return (
    <div className="text-center py-12 text-[var(--muted)]">
      <p className="text-lg">No {type} in {month}.</p>
      <p className="text-sm mt-1">Try selecting a different month.</p>
    </div>
  );
}

/** Prominent card for regattas and racing events — shows exact schedule, organizer, size, links */
function RacingCard({ event, isMajor }: { event: BayEvent; isMajor: boolean }) {
  const restriction = RESTRICTION_BADGE[event.restrictedZone];
  return (
    <div className={`border rounded-xl p-4 space-y-2 ${
      isMajor
        ? 'bg-compass-gold/5 border-compass-gold/30'
        : 'bg-[var(--card)] border-[var(--border)]'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`font-semibold leading-tight ${isMajor ? 'text-base text-compass-gold' : 'text-sm text-[var(--foreground)]'}`}>
            {event.name}
          </h3>
          <p className="text-xs text-[var(--secondary)] mt-0.5">{event.organizer}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {restriction && (
            <span className={`px-1.5 py-0.5 rounded text-2xs font-medium border ${restriction.color}`}>
              {restriction.label}
            </span>
          )}
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs font-medium hover:underline ${isMajor ? 'text-compass-gold' : 'text-safety-blue'}`}
            >
              Event Website →
            </a>
          )}
        </div>
      </div>

      <div className={`flex flex-wrap gap-x-4 gap-y-1 ${isMajor ? 'text-sm' : 'text-xs'} text-[var(--secondary)]`}>
        <div>
          <span className="text-[var(--muted)]">When: </span>
          <span className="font-medium text-[var(--foreground)]">
            {event.typicalDate ? (
              <>
                {new Date(event.typicalDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {event.typicalEndDate && ` – ${new Date(event.typicalEndDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                {', '}
                {new Date(event.typicalDate + 'T12:00:00').getFullYear()}
              </>
            ) : event.schedule}
          </span>
        </div>
        <div>
          <span className="text-[var(--muted)]">Where: </span>
          <span>{event.location}</span>
        </div>
        <div>
          <span className="text-[var(--muted)]">Size: </span>
          <span>{event.sizeEstimate}</span>
        </div>
      </div>

      {event.trafficNote && (
        <p className="text-2xs text-warning-amber">{event.trafficNote}</p>
      )}

      <div className="flex items-center gap-3 text-2xs text-[var(--muted)]">
        {event.biennial && (
          <span className="italic">
            {event.biennial === 'even' ? 'Even years only' : 'Odd years only'}
          </span>
        )}
        <span className="italic">Dates shift yearly — verify with organizer</span>
        {event.url && (
          <span>Source: <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-safety-blue hover:underline">{new URL(event.url).hostname.replace('www.', '')}</a></span>
        )}
      </div>
    </div>
  );
}

/** Card for shows, parades, heritage, and community events */
function ShowCard({ event, isHighlight }: { event: BayEvent; isHighlight: boolean }) {
  const restriction = RESTRICTION_BADGE[event.restrictedZone];
  return (
    <div className={`border rounded-xl p-4 space-y-2 ${
      isHighlight
        ? 'bg-compass-gold/5 border-compass-gold/30'
        : 'bg-[var(--card)] border-[var(--border)]'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className={`font-semibold leading-tight ${isHighlight ? 'text-base text-compass-gold' : 'text-sm text-[var(--foreground)]'}`}>
            {event.name}
          </h3>
          <p className="text-xs text-[var(--secondary)] mt-0.5">{event.organizer}</p>
        </div>
        {restriction && (
          <span className={`shrink-0 px-1.5 py-0.5 rounded text-2xs font-medium border ${restriction.color}`}>
            {restriction.label}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--secondary)]">
        <div>
          <span className="text-[var(--muted)]">When: </span>
          <span className="font-medium text-[var(--foreground)]">{event.schedule}</span>
        </div>
        <div>
          <span className="text-[var(--muted)]">Where: </span>
          <span>{event.location}</span>
        </div>
      </div>

      {event.sizeEstimate && (
        <p className="text-2xs text-[var(--muted)]">{event.sizeEstimate}</p>
      )}

      {event.trafficNote && (
        <p className="text-2xs text-warning-amber">{event.trafficNote}</p>
      )}

      <div className="flex items-center gap-3 text-2xs text-[var(--muted)]">
        <span className="italic">Dates shift yearly — verify with organizer</span>
        {event.url && (
          <span>Source: <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-safety-blue hover:underline">{(() => { try { return new URL(event.url).hostname.replace('www.', ''); } catch { return 'link'; } })()}</a></span>
        )}
      </div>

      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-safety-blue hover:underline font-medium"
        >
          Event Website →
        </a>
      )}
    </div>
  );
}

/** Activity-aware event card with sentiment coloring */
function ActivityCard({ event }: { event: EventForTrip }) {
  const style = SENTIMENT_STYLE[event.sentiment];
  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-3 space-y-1.5`}>
      <h3 className="text-sm font-medium text-[var(--foreground)] leading-tight">{event.name}</h3>
      <p className="text-2xs text-[var(--muted)]">{event.organizer}</p>
      <p className={`text-xs ${style.text}`}>{event.reason}</p>
      <div className="text-2xs text-[var(--muted)]">
        <span className="font-medium text-[var(--foreground)]">{event.schedule}</span>
        {' · '}{event.location}
      </div>
      {event.url && (
        <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-2xs text-safety-blue hover:underline">
          Details →
        </a>
      )}
    </div>
  );
}

function SentimentSection({ title, subtitle, events, sentiment }: {
  title: string;
  subtitle: string;
  events: EventForTrip[];
  sentiment: EventSentiment;
}) {
  const style = SENTIMENT_STYLE[sentiment];
  return (
    <div>
      <div className="mb-2">
        <h2 className={`text-sm font-semibold ${style.text}`}>{title}</h2>
        <p className="text-2xs text-[var(--muted)]">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {events.map(e => <ActivityCard key={e.id} event={e} />)}
      </div>
    </div>
  );
}
