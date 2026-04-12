'use client';

import { useState } from 'react';
import { useAppStore, type InboxItem } from '@/store';
import { Header } from '../components/Header';
import Link from 'next/link';

const TYPE_ICONS: Record<string, string> = {
  'perfect-day': '☀️',
  'alert': '⚠️',
  'feedback-thanks': '👍',
  'event-reminder': '📅',
  'system': '📋',
};

const TYPE_COLORS: Record<string, string> = {
  'perfect-day': 'border-reef-teal/30 bg-reef-teal/5',
  'alert': 'border-warning-amber/30 bg-warning-amber/5',
  'feedback-thanks': 'border-reef-teal/30 bg-reef-teal/5',
  'event-reminder': 'border-compass-gold/30 bg-compass-gold/5',
  'system': 'border-[var(--border)] bg-[var(--card)]',
};

export default function InboxPage() {
  const { inbox, markRead, archiveItem, deleteItem } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');

  const filtered = inbox.filter(item => {
    if (filter === 'unread') return !item.read && !item.archived;
    if (filter === 'archived') return item.archived;
    return !item.archived;
  });

  const unreadCount = inbox.filter(i => !i.read && !i.archived).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-compass-gold">Inbox</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Conditions alerts, perfect day notifications, and feedback
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-reef-teal text-white">
              {unreadCount} new
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(['all', 'unread', 'archived'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-compass-gold text-ocean-900'
                  : 'bg-[var(--card)] text-[var(--secondary)] border border-[var(--border)] hover:border-compass-gold/50'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unread' ? `Unread (${unreadCount})` : 'Archived'}
            </button>
          ))}
        </div>

        {/* Items */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted)]">
            <p className="text-lg">No notifications yet</p>
            <p className="text-sm mt-1">
              {filter === 'all'
                ? 'Check conditions on the home page to start receiving updates.'
                : filter === 'unread'
                  ? 'You\'re all caught up!'
                  : 'No archived items.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => (
              <InboxCard
                key={item.id}
                item={item}
                onRead={() => markRead(item.id)}
                onArchive={() => archiveItem(item.id)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </div>
        )}

        {/* Accuracy track record */}
        <AccuracySection />
      </main>
    </div>
  );
}

function InboxCard({ item, onRead, onArchive, onDelete }: {
  item: InboxItem;
  onRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const colorClass = TYPE_COLORS[item.type] ?? TYPE_COLORS.system;
  const icon = TYPE_ICONS[item.type] ?? '📋';
  const age = formatAge(item.timestamp);

  return (
    <div
      className={`border rounded-xl p-4 space-y-2 transition-all ${colorClass} ${!item.read ? 'ring-1 ring-compass-gold/30' : 'opacity-80'}`}
      onClick={onRead}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-lg shrink-0" aria-hidden="true">{icon}</span>
          <div className="min-w-0">
            <h3 className={`text-sm font-semibold ${!item.read ? 'text-[var(--foreground)]' : 'text-[var(--secondary)]'}`}>
              {item.title}
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">{item.body}</p>
          </div>
        </div>
        <span className="text-2xs text-[var(--muted)] shrink-0">{age}</span>
      </div>

      <div className="flex items-center gap-2">
        {item.href && (
          <Link href={item.href} className="text-2xs text-safety-blue hover:underline">
            View →
          </Link>
        )}
        <div className="flex-1" />
        {!item.archived && (
          <button onClick={(e) => { e.stopPropagation(); onArchive(); }} className="text-2xs text-[var(--muted)] hover:text-[var(--foreground)]">
            Archive
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-2xs text-[var(--muted)] hover:text-danger-red">
          Delete
        </button>
      </div>
    </div>
  );
}

function AccuracySection() {
  const { feedbackLog } = useAppStore();

  if (feedbackLog.length < 3) return null;

  const total = feedbackLog.length;
  const aboutRight = feedbackLog.filter(f => f.actualRating === 'about-right').length;
  const worse = feedbackLog.filter(f => f.actualRating === 'worse').length;
  const accuracy = Math.round((aboutRight / total) * 100);

  return (
    <div className="border-t border-[var(--border)] pt-6 space-y-3">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">Forecast Accuracy</h2>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--secondary)]">Your ratings ({total} trips)</span>
          <span className={`text-lg font-bold ${accuracy >= 70 ? 'text-reef-teal' : accuracy >= 50 ? 'text-compass-gold' : 'text-warning-amber'}`}>
            {accuracy}% accurate
          </span>
        </div>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden">
          <div className="bg-reef-teal rounded-l-full" style={{ width: `${(aboutRight / total) * 100}%` }} title="About right" />
          <div className="bg-compass-gold" style={{ width: `${((total - aboutRight - worse) / total) * 100}%` }} title="Better than forecast" />
          <div className="bg-warning-amber rounded-r-full" style={{ width: `${(worse / total) * 100}%` }} title="Worse than forecast" />
        </div>
        <div className="flex gap-4 text-2xs text-[var(--muted)]">
          <span className="text-reef-teal">● About right ({aboutRight})</span>
          <span className="text-compass-gold">● Better ({total - aboutRight - worse})</span>
          <span className="text-warning-amber">● Worse ({worse})</span>
        </div>
      </div>
      <p className="text-2xs text-[var(--muted)]">
        Based on your post-trip ratings. More ratings improve this metric.
      </p>
    </div>
  );
}

function formatAge(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return `${days}d`;
}
