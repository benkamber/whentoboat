/**
 * Automated accuracy tracking — compares forecast predictions to
 * actual NOAA buoy observations after the fact.
 *
 * The real feedback loop:
 * 1. At time of verdict, save what we predicted (wind, tier)
 * 2. 4-6 hours later, fetch actual buoy observations for that time
 * 3. Compare predicted vs. actual wind speed
 * 4. Store the comparison for accuracy reporting
 *
 * This runs client-side and doesn't require a database — stores
 * comparisons in localStorage via the Zustand store.
 */

export interface AccuracyComparison {
  date: string;
  hour: number;
  activity: string;
  originZone: string;
  /** What we predicted */
  predictedWindKts: number;
  predictedTier: string;
  /** What NDBC actually observed (filled in later) */
  observedWindKts: number | null;
  /** Whether our prediction was within acceptable range */
  withinRange: boolean | null;
  timestamp: number;
}

/**
 * Check if predicted wind was within acceptable accuracy range.
 * We consider "accurate" if observed wind is within ±5 knots of prediction
 * (accounting for known HRRR bias of 4-6 knots).
 */
export function isAccurate(predicted: number, observed: number): boolean {
  return Math.abs(predicted - observed) <= 5;
}

/**
 * Compute accuracy metrics from a list of comparisons.
 */
export function computeAccuracy(comparisons: AccuracyComparison[]): {
  total: number;
  verified: number;
  accurate: number;
  accuracyPct: number;
  avgError: number;
  overPredictCount: number;
  underPredictCount: number;
} {
  const verified = comparisons.filter(c => c.observedWindKts !== null && c.withinRange !== null);
  const accurate = verified.filter(c => c.withinRange);
  const errors = verified.map(c => (c.observedWindKts ?? 0) - c.predictedWindKts);
  const avgError = errors.length > 0 ? errors.reduce((a, b) => a + b, 0) / errors.length : 0;

  return {
    total: comparisons.length,
    verified: verified.length,
    accurate: accurate.length,
    accuracyPct: verified.length > 0 ? Math.round((accurate.length / verified.length) * 100) : 0,
    avgError: Math.round(avgError * 10) / 10,
    overPredictCount: errors.filter(e => e < -2).length,
    underPredictCount: errors.filter(e => e > 2).length,
  };
}
