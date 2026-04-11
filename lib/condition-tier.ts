/**
 * Three-tier condition assessment system.
 *
 * Replaces user-facing 1-10 scores with a clear, liability-conscious
 * interpretation: "Looks good" / "Check conditions" / "Not recommended."
 *
 * The internal scoring engine (1-10) is unchanged — this module maps
 * scores to tiers and applies safety overrides (NWS warnings, wind-against-tide).
 *
 * Legal basis: No weather interpretation service has ever lost a lawsuit for
 * forecast inaccuracy (Brandt v. Weather Channel, 1997). The three-tier system
 * positions WhenToBoat as an information interpreter, not a safety certifier.
 */

export type ConditionTier = 'looks-good' | 'check-conditions' | 'not-recommended';

export interface TierInfo {
  tier: ConditionTier;
  label: string;
  icon: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

const TIER_MAP: Record<ConditionTier, TierInfo> = {
  'looks-good': {
    tier: 'looks-good',
    label: 'Looks good',
    icon: '✅',
    color: '#10b981',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-400',
  },
  'check-conditions': {
    tier: 'check-conditions',
    label: 'Check conditions',
    icon: '⚠️',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-400',
  },
  'not-recommended': {
    tier: 'not-recommended',
    label: 'Not recommended',
    icon: '🛑',
    color: '#ef4444',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    textClass: 'text-red-400',
  },
};

export function getTierInfo(tier: ConditionTier): TierInfo {
  return TIER_MAP[tier];
}

/**
 * Map an internal 1-10 score to a three-tier condition assessment.
 *
 * Conservative bias: HRRR underpredicts high winds by 4-6 knots (Seto et al., 2025).
 * Thresholds assume actual conditions may be worse than forecast.
 *
 * Overrides:
 * - Active NWS marine warning → force 'not-recommended'
 * - Wind opposing current (>12kt wind, >1.5kt current) → upgrade one tier
 */
export function getConditionTier(
  score: number,
  options?: {
    hasActiveWarning?: boolean;
    windAgainstTide?: boolean;
  },
): ConditionTier {
  // NWS warning override — non-negotiable
  if (options?.hasActiveWarning) {
    return 'not-recommended';
  }

  // Base tier from score
  let tier: ConditionTier =
    score >= 7 ? 'looks-good' :
    score >= 4 ? 'check-conditions' :
    'not-recommended';

  // Wind-against-tide upgrade
  if (options?.windAgainstTide) {
    if (tier === 'looks-good') tier = 'check-conditions';
    else if (tier === 'check-conditions') tier = 'not-recommended';
  }

  return tier;
}

/**
 * Map the old ComfortTier to the new ConditionTier.
 * Used during the transition to avoid breaking existing code paths.
 */
export function comfortToConditionTier(
  comfort: 'comfortable' | 'marginal' | 'challenging',
  options?: { hasActiveWarning?: boolean; windAgainstTide?: boolean },
): ConditionTier {
  if (options?.hasActiveWarning) return 'not-recommended';

  let tier: ConditionTier =
    comfort === 'comfortable' ? 'looks-good' :
    comfort === 'marginal' ? 'check-conditions' :
    'not-recommended';

  if (options?.windAgainstTide) {
    if (tier === 'looks-good') tier = 'check-conditions';
    else if (tier === 'check-conditions') tier = 'not-recommended';
  }

  return tier;
}

/**
 * Map the old DifficultyLevel (1-5) to the new ConditionTier.
 */
export function difficultyToConditionTier(
  level: number,
  options?: { hasActiveWarning?: boolean },
): ConditionTier {
  if (options?.hasActiveWarning) return 'not-recommended';
  if (level <= 2) return 'looks-good';
  if (level <= 3) return 'check-conditions';
  return 'not-recommended';
}
