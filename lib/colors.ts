/**
 * Map comfort score (1-10) to a hex color.
 */
export function scoreToColor(score: number): string {
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  const colors: Record<number, string> = {
    1: '#dc2626',
    2: '#e53e3e',
    3: '#ed6534',
    4: '#f59e0b',
    5: '#eab308',
    6: '#c4b513',
    7: '#84cc16',
    8: '#22c55e',
    9: '#10b981',
    10: '#059669',
  };
  return colors[clamped];
}

/**
 * Map score to line opacity (higher score = more visible).
 */
export function scoreToOpacity(score: number): number {
  if (score >= 9) return 1.0;
  if (score >= 7) return 0.8;
  if (score >= 5) return 0.5;
  if (score >= 3) return 0.25;
  return 0.08;
}
