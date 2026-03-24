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
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-lg',
  };

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

export function getScoreLabel(score: number): string {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Fair';
  if (score >= 3) return 'Marginal';
  return 'Poor';
}
