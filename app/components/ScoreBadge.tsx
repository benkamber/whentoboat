const SCORE_BG: Record<number, string> = {
  1: 'bg-score-1',
  2: 'bg-score-2',
  3: 'bg-score-3',
  4: 'bg-score-4',
  5: 'bg-score-5',
  6: 'bg-score-6',
  7: 'bg-score-7',
  8: 'bg-score-8',
  9: 'bg-score-9',
  10: 'bg-score-10',
};

export type DangerLevel = 'dangerous' | 'poor' | 'marginal' | 'fair' | 'good' | 'excellent';

/**
 * Get categorical danger level from score.
 * SAFETY-CRITICAL: Scores 1-2 are "dangerous" — these represent conditions
 * where someone could die (fog+ferry, current exceeds paddle speed, etc.)
 */
export function getDangerLevel(score: number): DangerLevel {
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  if (clamped <= 2) return 'dangerous';
  if (clamped <= 3) return 'poor';
  if (clamped <= 4) return 'marginal';
  if (clamped <= 6) return 'fair';
  if (clamped <= 8) return 'good';
  return 'excellent';
}

export function ScoreBadge({
  score,
  size = 'md',
  showRange,
}: {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showRange?: { p10: number; p90: number };
}) {
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  const danger = getDangerLevel(clamped);
  const isDangerous = danger === 'dangerous';

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-lg',
  };

  // For dangerous scores: red badge with warning triangle symbol.
  // Uses motion-safe:animate-pulse to respect prefers-reduced-motion (WCAG 2.2.2).
  // ARIA role and label ensure screen readers announce the danger state.
  if (isDangerous) {
    return (
      <div className="flex items-center gap-1.5">
        <div
          className={`bg-score-1 ${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold shadow-sm motion-safe:animate-pulse`}
          role="img"
          aria-label="Dangerous conditions — do not launch"
        >
          {'\u26A0'}
        </div>
        <span className="text-xs text-danger-red font-medium">
          DANGEROUS
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`${SCORE_BG[clamped]} ${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold shadow-sm`}
      >
        {clamped}
      </div>
      {showRange && (
        <span className="text-xs text-[var(--muted)]">
          ({showRange.p10}–{showRange.p90})
        </span>
      )}
    </div>
  );
}

export function getScoreColor(score: number): string {
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  const colors: Record<number, string> = {
    1: '#dc2626', 2: '#e53e3e', 3: '#ed6534', 4: '#f59e0b', 5: '#eab308',
    6: '#c4b513', 7: '#84cc16', 8: '#22c55e', 9: '#10b981', 10: '#059669',
  };
  return colors[clamped];
}

/**
 * Get human-readable score label.
 * SAFETY-CRITICAL: Scores 1-2 use explicit danger language,
 * not euphemisms like "Poor" that understate lethal risk.
 */
export function getScoreLabel(score: number): string {
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  if (clamped <= 2) return 'DANGEROUS';
  if (clamped <= 3) return 'Risky — not recommended';
  if (clamped <= 4) return 'Marginal';
  if (clamped <= 6) return 'Fair';
  if (clamped <= 8) return 'Good';
  return 'Excellent';
}

// ── Three-tier condition badge (replaces numerical scores in user-facing UI) ──

import { type ConditionTier, getTierInfo } from '@/lib/condition-tier';

export function TierBadge({
  tier,
  size = 'md',
  showLabel = true,
}: {
  tier: ConditionTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}) {
  const info = getTierInfo(tier);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-2xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg font-medium border ${info.bgClass} ${info.borderClass} ${info.textClass} ${sizeClasses[size]}`}>
      <span aria-hidden="true">{info.icon}</span>
      {showLabel && <span>{info.label}</span>}
    </div>
  );
}
