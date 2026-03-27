'use client';

import { useMemo, useState } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { useAppStore } from '@/store';
import { recommendActivities } from '@/engine/recommend';
import { ScoreBadge, getScoreLabel } from './ScoreBadge';

/**
 * "What should I do today?" advisor.
 * Given current conditions (month, hour, home base), recommends
 * the best activity AND best destinations for each activity.
 *
 * Inverts the normal flow: instead of picking an activity first,
 * the conditions tell you what to do.
 */
export function ActivityAdvisor() {
  const { month, hour, homeBaseId, setActivity } = useAppStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  const origin = sfBay.destinations.find(d => d.id === homeBaseId) ?? sfBay.destinations[0];

  const recommendations = useMemo(() => {
    try {
      return recommendActivities(origin, month, Math.floor(hour), sfBay);
    } catch {
      return [];
    }
  }, [origin, month, hour]);

  if (recommendations.length === 0) return null;

  const best = recommendations[0];

  const formatTime = (h: number) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    const period = hrs < 12 ? 'AM' : 'PM';
    const displayHrs = hrs === 0 ? 12 : hrs > 12 ? hrs - 12 : hrs;
    return `${displayHrs}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header — best recommendation */}
      <div className="px-4 py-3 bg-[var(--card-elevated)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-medium text-compass-gold uppercase tracking-wider">
              Best for {MONTHS[month]} · {formatTime(hour)}
            </h3>
            <p className="text-sm font-semibold mt-0.5">
              {best.activity.icon} {best.activity.name} at {best.bestDestination.destination.name}
            </p>
          </div>
          <ScoreBadge score={best.overallScore} size="md" />
        </div>
        <p className="text-xs text-[var(--muted)] mt-1">{best.whyThisActivity}</p>
      </div>

      {/* All activities ranked */}
      <div className="divide-y divide-[var(--border)]">
        {recommendations.map((rec) => {
          const isExpanded = expanded === rec.activity.id;
          const isBest = rec === best;

          return (
            <div key={rec.activity.id}>
              <button
                onClick={() => setExpanded(isExpanded ? null : rec.activity.id)}
                className="w-full px-4 py-3 text-left hover:bg-[var(--card-elevated)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{rec.activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{rec.activity.name}</span>
                      {isBest && (
                        <span className="text-[9px] bg-compass-gold/20 text-compass-gold px-1.5 py-0.5 rounded font-medium uppercase">
                          Best choice
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--muted)] truncate">{rec.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ScoreBadge score={rec.overallScore} size="sm" />
                    <span className="text-xs text-[var(--muted)]">{isExpanded ? '−' : '+'}</span>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 space-y-2">
                  <p className="text-xs text-reef-teal">{rec.whyThisActivity}</p>

                  {/* Top 3 destinations for this activity */}
                  {rec.topDestinations.map((dest, i) => (
                    <div
                      key={dest.destination.id}
                      className="flex items-center gap-3 bg-[var(--card-elevated)] rounded-lg p-2.5"
                    >
                      <span className="text-xs font-bold text-[var(--muted)] w-4 text-right">{i + 1}</span>
                      <ScoreBadge score={dest.score} size="sm" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{dest.destination.name}</span>
                        <span className="text-[10px] text-[var(--muted)] ml-2">
                          {dest.distance}mi · {dest.transitMinutes}min
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Switch to this activity */}
                  <button
                    onClick={() => {
                      setActivity(rec.activity.id);
                      setExpanded(null);
                    }}
                    className="w-full py-2 rounded-lg border border-reef-teal/50 text-reef-teal text-xs font-medium hover:bg-reef-teal/10 transition-colors"
                  >
                    Plan a {rec.activity.name.toLowerCase()} outing →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
