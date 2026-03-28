import type {
  ActivityProfile,
  City,
  Destination,
  FullConditions,
  RiskFactor,
  ScoreRange,
  ScoredRoute,
  ScoredRouteAlternative,
  VesselProfile,
  Zone,
  ZoneConditions,
} from './types';
import { getTimeConditions } from './interpolation';
import { getRouteZones, transitTime, fuelRoundTrip, isInRange, draftClearance } from './routing';
import { routeDepthCheck } from './depth';
import { getSeasonalConditions } from '@/data/cities/sf-bay/seasonal-conditions';
import { HIGH_CURRENT_ZONES, CURRENT_WARNING_ZONES } from '@/data/cities/sf-bay/current-stations';

// ============================================
// Activity Comfort Scoring
// The core algorithm that makes WhenToBoat work
// ============================================

/** Default water temperature for SF Bay when data is unavailable. */
export const DEFAULT_WATER_TEMP_F = 58;

/** Zones where SUPs are blocked — open water with strong currents and ferry traffic. */
const OPEN_WATER_BLOCK_ZONES = ['central_bay', 'ocean_south', 'ocean_north', 'san_pablo'];

/** Ocean zones where scores are capped at 5/10 due to persistent swell and bar hazards. */
const OCEAN_ZONES = ['ocean_south', 'ocean_north'];

/**
 * Score an activity's comfort for given conditions.
 * Returns 1-10 where 10 is perfect and 1 is dangerous/unusable.
 */
export function activityScore(
  activity: ActivityProfile,
  windKts: number,
  waveHtFt: number,
  periodS: number
): number {
  const [idealLow, idealHigh] = activity.idealWindRange;
  const maxWind = activity.maxWind;

  // Wind score: peak at ideal range center, drops off both sides
  let windScore: number;
  if (windKts >= idealLow && windKts <= idealHigh) {
    windScore = 10; // sweet spot
  } else if (windKts < idealLow) {
    windScore = Math.max(1, 10 - (idealLow - windKts) * 1.5); // too light
  } else if (windKts <= maxWind) {
    windScore = Math.max(2, 10 - (windKts - idealHigh) * 1.0); // getting gusty
  } else {
    windScore = 1; // over max — dangerous
  }

  // Wave score: 10 at 0, drops to 1 at maxWave
  const maxWave = activity.maxWave;
  let waveScore: number;
  if (waveHtFt <= maxWave) {
    waveScore = Math.round(10 - (waveHtFt / maxWave) * 7);
  } else {
    waveScore = Math.max(1, 3 - (waveHtFt - maxWave) * 2);
  }

  // Period adjust: short period = steep dangerous chop
  let periodAdjust = 0;
  if (activity.vesselType === 'powerboat' && periodS < 4 && waveHtFt > 1.5) {
    periodAdjust = -1; // short period chop is worse for powerboats
  }
  if (activity.vesselType === 'sailboat' && periodS > 6) {
    periodAdjust = 1; // long period swell is manageable for sailboats
  }
  if (activity.vesselType === 'kayak' && periodS < 4 && waveHtFt > 0.5) {
    periodAdjust = -2; // short period chop is extremely dangerous for kayaks
  }

  // Activity-specific wind/wave weighting
  const windWeight: Record<string, number> = { kayak: 0.55, sup: 0.65, powerboat: 0.40, sailboat: 0.60 };
  const ww = windWeight[activity.vesselType] ?? 0.5;
  const raw = windScore * ww + waveScore * (1 - ww) + periodAdjust;
  return Math.max(1, Math.min(10, Math.round(raw)));
}

/**
 * Comprehensive scoring using ALL environmental factors.
 * This is the full scoring function that considers:
 * wind, waves, period, water temp, air temp, current, tide, visibility.
 *
 * Returns 1-10 with detailed breakdown of what contributed to the score.
 */
export function fullConditionsScore(
  activity: ActivityProfile,
  conditions: FullConditions,
  vessel: VesselProfile
): { score: number; factors: RiskFactor[] } {
  const factors: RiskFactor[] = [];

  // ABSOLUTE SAFETY BLOCKS — these override all other scoring
  const zoneId = conditions.zoneId ?? '';

  // 1. Fog in ferry/shipping lanes: kayak/SUP in visibility < 1 mile = BLOCK
  if ((activity.vesselType === 'kayak' || activity.vesselType === 'sup') && conditions.visibilityMi < 1) {
    if (typeof console !== 'undefined') console.warn('[SAFETY_BLOCK]', { block: 'fog_paddlecraft', vesselType: activity.vesselType, visibility: conditions.visibilityMi, zoneId });
    return { score: 1, factors: [{
      factor: 'DANGER: Dense fog near shipping lanes',
      severity: 'high',
      description: 'Ferries travel at 30kt in zero visibility. Kayaks are invisible to radar. Do NOT launch. Wait for fog to clear.'
    }]};
  }

  // 2. Golden Gate max ebb + paddlecraft: current > 4kt + kayak/SUP = BLOCK
  // Only applies when we have REAL current data (not the -1 sentinel)
  if ((activity.vesselType === 'kayak' || activity.vesselType === 'sup') && conditions.currentKts > 4) {
    if (typeof console !== 'undefined') console.warn('[SAFETY_BLOCK]', { block: 'current_exceeds_paddle', vesselType: activity.vesselType, currentKts: conditions.currentKts, zoneId });
    return { score: 1, factors: [{
      factor: 'DANGER: Current exceeds paddle speed',
      severity: 'high',
      description: `${conditions.currentKts.toFixed(1)}kt current exceeds maximum kayak speed (~4kt). You will be swept to sea. Do NOT attempt.`
    }]};
  }

  // 3. SUP in Central Bay or ocean zones = BLOCK
  // SUPs cannot safely cross open water — standing profile catches wind like a sail,
  // and falling off in shipping lanes / strong current is potentially fatal.
  if (activity.vesselType === 'sup' && OPEN_WATER_BLOCK_ZONES.includes(zoneId)) {
    if (typeof console !== 'undefined') console.warn('[SAFETY_BLOCK]', { block: 'sup_open_water', zoneId });
    return { score: 1, factors: [{
      factor: 'DANGER: Open water crossing on SUP',
      severity: 'high',
      description: `SUPs must not cross ${zoneId.replace(/_/g, ' ')}. Strong currents, ferry traffic, and wind exposure make this crossing life-threatening. Stay in sheltered coves within 500m of shore.`
    }]};
  }

  // 4. Moderate current + paddlecraft in high-exposure zones = WARNING
  // SAFETY-CRITICAL: Central Bay, Ocean South, and San Pablo Bay have strong
  // tidal currents that create dangerous conditions even at 2-3 knots when
  // combined with wind chop. Expert validation confirmed these thresholds.
  const isPaddleCraft = activity.vesselType === 'kayak' || activity.vesselType === 'sup';
  const isCurrentWarningZone = (CURRENT_WARNING_ZONES as readonly string[]).includes(zoneId);

  if (isPaddleCraft && conditions.currentKts > 2 && conditions.currentKts <= 4 && isCurrentWarningZone) {
    factors.push({
      factor: 'Strong current in exposed zone',
      severity: 'high',
      description: `${conditions.currentKts.toFixed(1)}kt current in ${zoneId.replace('_', ' ')} — challenging for ${activity.name}. ` +
        `Current will affect your speed and course. Check NOAA current predictions before departing.`,
    });
    // -3 penalty applied below via currentWarningPenalty
  }

  // 4. Current data unavailable — SAFETY-CRITICAL sentinel handling
  // When currentKts === -1, we do NOT have current data. We must NOT default
  // to 0kt (which implies calm). Instead, we add explicit warnings and
  // uncertainty penalties, especially for high-current zones.
  let currentUnavailablePenalty = 0;
  if (conditions.currentKts === -1) {
    const isHighCurrentZone = (HIGH_CURRENT_ZONES as readonly string[]).includes(zoneId);

    if (isPaddleCraft) {
      // Kayak/SUP: current data is safety-critical in high-current zones
      if (isHighCurrentZone) {
        currentUnavailablePenalty = -2;
        factors.push({
          factor: 'Current data unavailable — HIGH PRIORITY',
          severity: 'high',
          description: `Current data unavailable for ${zoneId.replace('_', ' ')}. ` +
            `This zone has strong tidal currents (up to 5kt). ` +
            `Check NOAA current predictions at tidesandcurrents.noaa.gov before crossing any strait or channel.`,
        });
      } else {
        currentUnavailablePenalty = -1;
        factors.push({
          factor: 'Current data unavailable',
          severity: 'medium',
          description: `Current data unavailable — check NOAA before crossing any strait or channel. ` +
            `Do not assume calm conditions.`,
        });
      }
    } else {
      // Powerboat/sail: note it but don't penalize as heavily
      factors.push({
        factor: 'Current data not factored',
        severity: 'low',
        description: `Current data not available for this forecast. ` +
          `Verify current conditions at NOAA tidesandcurrents.noaa.gov for transit planning.`,
      });
    }
  }

  // 1. Base wind/wave/period score (existing algorithm)
  const adjWave = conditions.waveHtFt / vesselWaveToleranceMultiplier(vessel.loa, vessel.hullType);
  let baseScore = activityScore(activity, conditions.windKts, adjWave, conditions.wavePeriodS);

  // 1b. Missing wave data warning — when wave data is unavailable, the 2.5ft fallback
  // may significantly affect scores (especially SUP where maxWave = 0.3ft). Surface
  // this as an explicit factor so users understand why their score is low.
  if (conditions.isMissingWaveData) {
    factors.push({
      factor: 'Wave data unavailable',
      severity: isPaddleCraft ? 'medium' : 'low',
      description: isPaddleCraft
        ? 'Wave data is not available for this forecast. Score assumes moderate chop (2.5ft) as a safety precaution. Actual conditions may be calmer in sheltered areas.'
        : 'Wave data is not available for this forecast. Score uses a conservative estimate.',
    });
  }

  // 1c. Gust factor — gusts are what capsize kayaks and slam passengers.
  // A 12kt sustained wind with 25kt gusts is fundamentally different from steady 12kt.
  let gustPenalty = 0;
  if (conditions.windGustKts && conditions.windKts > 0) {
    const gustRatio = conditions.windGustKts / conditions.windKts;
    if (gustRatio > 2.0) {
      gustPenalty = -2;
      factors.push({
        factor: 'Very gusty conditions',
        severity: 'high',
        description: `Gusts to ${Math.round(conditions.windGustKts)}kt (${gustRatio.toFixed(1)}x sustained). Sudden gusts can capsize small craft and make conditions unpredictable.`,
      });
    } else if (gustRatio > 1.5 && conditions.windGustKts > 10) {
      gustPenalty = -1;
      factors.push({
        factor: 'Gusty conditions',
        severity: 'medium',
        description: `Gusts to ${Math.round(conditions.windGustKts)}kt (${gustRatio.toFixed(1)}x sustained). Conditions may feel rougher than the average wind suggests.`,
      });
    }
  }

  // 1d. Precipitation — rain reduces visibility, makes decks slippery, and kills comfort.
  let precipPenalty = 0;
  if (conditions.precipitationIn !== undefined && conditions.precipitationIn > 0) {
    if (conditions.precipitationIn > 0.25) {
      precipPenalty = -3;
      factors.push({
        factor: 'Heavy rain',
        severity: 'high',
        description: 'Heavy rain significantly reduces visibility and comfort. Slippery decks increase fall risk.',
      });
    } else if (conditions.precipitationIn > 0.1) {
      precipPenalty = -2;
      factors.push({
        factor: 'Rain',
        severity: 'medium',
        description: 'Moderate rain. Reduced visibility and wet conditions. Dress accordingly.',
      });
    } else if (conditions.precipitationIn > 0.02) {
      precipPenalty = -1;
      factors.push({
        factor: 'Light rain',
        severity: 'low',
        description: 'Light rain or drizzle. Minor impact on conditions.',
      });
    }
  } else if (conditions.precipProbPct !== undefined && conditions.precipProbPct > 60) {
    factors.push({
      factor: 'Rain likely',
      severity: 'low',
      description: `${Math.round(conditions.precipProbPct)}% chance of rain. Bring rain gear.`,
    });
  }

  // 1e. Wave direction — beam seas are worst, following seas are best (for powerboats)
  // Beam seas (90 degrees to route) produce maximum roll motion.
  let waveAnglePenalty = 0;
  if (conditions.waveDirDeg !== undefined && conditions.routeHeadingDeg !== undefined && conditions.waveHtFt > 1.0) {
    const encounterAngle = Math.abs(conditions.waveDirDeg - conditions.routeHeadingDeg);
    const normalized = encounterAngle > 180 ? 360 - encounterAngle : encounterAngle;
    // 80-100 degrees = beam seas (worst)
    if (normalized >= 60 && normalized <= 120 && conditions.waveHtFt > 1.5) {
      waveAnglePenalty = activity.vesselType === 'powerboat' ? -2 : -1;
      factors.push({
        factor: 'Beam seas',
        severity: conditions.waveHtFt > 3 ? 'high' : 'medium',
        description: `Waves hitting from the side (${Math.round(normalized)}° off heading). ` +
          `This causes maximum roll motion and is uncomfortable for passengers.`,
      });
    }
  }

  // 1f. Fog detection from dewpoint spread — more reliable than visibility forecast alone
  // When dewpoint approaches air temp (spread < 3F), fog is imminent.
  if (conditions.dewpointF !== undefined && conditions.airTempF > 0 && conditions.dewpointF > 0) {
    const dewpointSpread = conditions.airTempF - conditions.dewpointF;
    if (dewpointSpread < 2 && conditions.visibilityMi > 3) {
      // Forecast says clear, but dewpoint says fog is forming
      factors.push({
        factor: 'Fog forming',
        severity: isPaddleCraft ? 'high' : 'medium',
        description: `Dewpoint spread ${dewpointSpread.toFixed(1)}°F — fog is likely to form even if currently clear. ` +
          `Marine fog in SF Bay can reduce visibility to under 1 mile within minutes.`,
      });
    }
  }

  // 1g. WMO weather code fog confirmation (codes 45, 48)
  if (conditions.weatherCode === 45 || conditions.weatherCode === 48) {
    if (conditions.visibilityMi > 3) {
      // The weather model says fog but visibility forecast is still clear —
      // trust the fog code and add a warning
      factors.push({
        factor: 'Fog forecast',
        severity: 'medium',
        description: 'Weather model indicates fog conditions. Visibility may drop suddenly.',
      });
    }
  }

  // 1h. UV exposure warning for all-day trips
  if (conditions.uvIndex !== undefined && conditions.uvIndex >= 8) {
    factors.push({
      factor: 'High UV exposure',
      severity: 'low',
      description: `UV index ${Math.round(conditions.uvIndex)} — high sun exposure on the water. ` +
        `Reflection from water doubles UV dose. Wear sunscreen and protective clothing.`,
    });
  }

  // 2. Wind-against-current modifier (can dramatically increase wave height)
  // Only applies when we have real current data (currentKts > 0, not -1 sentinel)
  if (conditions.currentKts > 0) {
    const waveMultiplier = windCurrentInteraction(
      conditions.windKts,
      conditions.windDirDeg,
      conditions.currentKts,
      conditions.currentDirDeg
    );
    if (waveMultiplier > 1.3) {
      const effectiveWaves = conditions.waveHtFt * waveMultiplier;
      const penalizedScore = activityScore(activity, conditions.windKts, effectiveWaves / vesselWaveToleranceMultiplier(vessel.loa, vessel.hullType), conditions.wavePeriodS);
      if (penalizedScore < baseScore) {
        factors.push({
          factor: 'Wind against current',
          severity: waveMultiplier > 2 ? 'high' : 'medium',
          description: `Wind opposing ${conditions.currentKts.toFixed(1)}kt ${conditions.tidePhase} current — effective waves ${effectiveWaves.toFixed(1)}ft (${waveMultiplier.toFixed(1)}x amplified).`,
        });
        baseScore = penalizedScore;
      }
    }
  }

  // 3. Tide phase bonus/penalty
  let tidePenalty = 0;
  // Only apply current-based tide penalty when we have real data (not -1 sentinel)
  if (conditions.tidePhase === 'ebb' && conditions.currentKts > 2) {
    // Strong ebb at the Gate is dangerous for all small craft
    if (isPaddleCraft) {
      tidePenalty = -3;
      factors.push({
        factor: 'Strong ebb current',
        severity: 'high',
        description: `${conditions.currentKts.toFixed(1)}kt ebb current — dangerous for ${activity.name}. Paddling against this is extremely difficult.`,
      });
    }
  }

  // Current warning penalty for moderate currents in exposed zones
  const currentWarningPenalty =
    (isPaddleCraft && conditions.currentKts > 2 && conditions.currentKts <= 4 && isCurrentWarningZone)
      ? -3 : 0;

  // 4. Water temperature factor
  // Guard: only apply when we have a realistic reading (> -40°F sanity floor).
  // Uses -40 instead of 0 to support future expansion to freshwater lakes where
  // water can be near freezing (32°F / 0°C).
  let waterTempPenalty = 0;
  if (conditions.waterTempF > -40 && (activity.vesselType === 'kayak' || activity.vesselType === 'sup')) {
    if (conditions.waterTempF < 60 && conditions.waterTempF >= 55) {
      waterTempPenalty = -2;
      factors.push({
        factor: 'Cold water risk',
        severity: 'medium',
        description: `Water temperature ${conditions.waterTempF}°F — cold water shock risk if capsized. Wear a wetsuit or drysuit.`,
      });
    }
    if (conditions.waterTempF < 55 && conditions.waterTempF >= 50) {
      waterTempPenalty = -3;
      factors.push({
        factor: 'Cold water — drysuit required',
        severity: 'high',
        description: `Water temperature ${conditions.waterTempF}°F — serious cold water shock risk if capsized. Drysuit strongly recommended.`,
      });
    }
    if (conditions.waterTempF < 50) {
      waterTempPenalty = -4;
      factors.push({
        factor: 'Very cold water',
        severity: 'high',
        description: `Water temperature ${conditions.waterTempF}°F — hypothermia risk within minutes of immersion. Immersion suit required.`,
      });
    }
  }

  // 5. Air temperature factor
  let airTempPenalty = 0;
  if (conditions.airTempF > 0) {
    if (conditions.airTempF < 50) {
      airTempPenalty = -0.5;
      factors.push({
        factor: 'Cold air temperature',
        severity: 'low',
        description: `Air temperature ${conditions.airTempF}°F — dress in warm layers.`,
      });
    }
    if (conditions.airTempF > 85) {
      // Hot days can be great for water activities
      // But dehydration risk on long trips
      factors.push({
        factor: 'Hot weather',
        severity: 'low',
        description: `Air temperature ${conditions.airTempF}°F — bring extra water, sun protection.`,
      });
    }
  }

  // 6. Visibility / fog penalty
  // NOTE: Guard uses >= 0, not > 0. When visibility = 0 (zero visibility),
  // the fog penalty MUST still apply. The previous > 0 guard silently skipped
  // all penalties at zero visibility for powerboats/sailboats.
  let visibilityPenalty = 0;
  if (conditions.visibilityMi >= 0 && conditions.visibilityMi < 10) {
    if (conditions.visibilityMi < 1) {
      visibilityPenalty = -3;
      factors.push({
        factor: 'Dense fog',
        severity: 'high',
        description: `Visibility ${conditions.visibilityMi.toFixed(1)} miles — cannot see other vessels. Ferry and shipping traffic risk. Do not depart.`,
      });
    } else if (conditions.visibilityMi < 3) {
      // Kayak/SUP get harsher penalty — invisible to ferries and radar
      const isPaddleCraft = activity.vesselType === 'kayak' || activity.vesselType === 'sup';
      visibilityPenalty = isPaddleCraft ? -3 : -1.5;
      factors.push({
        factor: 'Fog',
        severity: isPaddleCraft ? 'high' : 'medium',
        description: isPaddleCraft
          ? `Visibility ${conditions.visibilityMi.toFixed(1)} miles — paddlecraft are nearly invisible to ferries and ship radar. Stay out of shipping lanes or do not depart.`
          : `Visibility ${conditions.visibilityMi.toFixed(1)} miles — reduced visibility. Use navigation lights, sound signals. Stay clear of shipping lanes.`,
      });
    } else if (conditions.visibilityMi < 5) {
      visibilityPenalty = -0.5;
      factors.push({
        factor: 'Haze',
        severity: 'low',
        description: `Visibility ${conditions.visibilityMi.toFixed(1)} miles — light haze. Maintain awareness.`,
      });
    }
  }

  // 7. Combine all factors
  // SAFETY: currentUnavailablePenalty ensures we don't silently present
  // scores as if current were 0kt. currentWarningPenalty catches moderate
  // currents (2-4kt) in high-exposure zones.
  let totalScore = baseScore + tidePenalty + waterTempPenalty + airTempPenalty
    + visibilityPenalty + currentUnavailablePenalty + currentWarningPenalty
    + gustPenalty + precipPenalty + waveAnglePenalty;

  // 8. Ocean zone cap — ocean routes never score above 5/10
  // Ocean swell is persistent (rarely below 4ft), bar crossings are dangerous,
  // and conditions change rapidly. Capping at 5 ensures the app never shows
  // "Excellent" or "Good" for ocean routes, which would create false confidence.
  if (OCEAN_ZONES.includes(zoneId)) {
    // Always warn for ocean routes, even when score is naturally <= 5 (#10: unconditional ocean warning)
    factors.push({
      factor: 'Ocean route — check NWS bar forecast',
      severity: 'medium',
      description: 'Conditions outside the Golden Gate change rapidly. ' +
        'Check the NWS coastal forecast (PZZ545) and NDBC buoy 46026 before transiting the bar.',
    });
    if (totalScore > 5) {
      totalScore = 5;
    }
  }

  return {
    score: Math.max(1, Math.min(10, Math.round(totalScore))),
    factors,
  };
}

/**
 * Build FullConditions from zone data + optional forecast overlay.
 * This bridges the gap between historical zone data and the full scoring engine.
 *
 * SAFETY NOTE on currentKts: When zoneConditions doesn't include current data
 * and no forecast overlay provides it, we use -1 (sentinel for "unavailable")
 * rather than defaulting to 0 or an estimated value. The scoring engine will
 * handle this by adding appropriate warnings. The previous approach of using
 * seasonal average * 0.5 produced scientifically unsound estimates that could
 * mask dangerous conditions.
 */
export function buildFullConditions(
  zoneConditions: ZoneConditions,
  month?: number,
  hour?: number,
  defaults?: Partial<FullConditions>
): FullConditions {
  // Pull seasonal data for temperature, visibility, current
  const seasonal = month !== undefined ? getSeasonalConditions(month) : null;
  const isAM = (hour ?? 9) < 12;

  // SAFETY-CRITICAL: Current speed uses -1 sentinel when not provided.
  // We explicitly do NOT estimate current from seasonal averages — that
  // produced false confidence in invalid data. If real NOAA CO-OPS data
  // is available, it should be passed via defaults?.currentKts.
  const currentKts = zoneConditions.currentKts
    ?? defaults?.currentKts
    ?? -1; // sentinel: current data unavailable

  return {
    windKts: zoneConditions.windKts,
    windDirDeg: defaults?.windDirDeg ?? 270, // prevailing westerly for SF Bay
    waveHtFt: zoneConditions.waveHtFt,
    wavePeriodS: zoneConditions.wavePeriodS,
    waterTempF: zoneConditions.waterTempF ?? seasonal?.waterTempF ?? DEFAULT_WATER_TEMP_F,
    airTempF: zoneConditions.airTempF ?? (isAM
      ? (seasonal?.airTempLowF ?? 55)
      : (seasonal?.airTempHighF ?? 65)),
    currentKts,
    currentDirDeg: zoneConditions.currentDirDeg ?? defaults?.currentDirDeg ?? 0,
    visibilityMi: zoneConditions.visibilityMi ?? (isAM
      ? (seasonal?.typicalVisibilityAM_Mi ?? 10)
      : (seasonal?.typicalVisibilityPM_Mi ?? 10)),
    tideFt: zoneConditions.tideFt ?? defaults?.tideFt ?? 3,
    // SAFETY: Default to 'flood' only when we have no data. While 'unknown' would be
    // more honest, FullConditions requires a valid phase. Since flood and ebb are equally
    // likely, 'flood' is chosen because ebb penalties require currentKts > 2 (which also
    // defaults to -1 sentinel when unavailable), so the ebb penalty won't fire anyway
    // when both tide phase AND current data are missing.
    tidePhase: zoneConditions.tidePhase ?? defaults?.tidePhase ?? 'flood',
    // Gust and precipitation — passed through from forecast data when available
    windGustKts: defaults?.windGustKts,
    precipitationIn: defaults?.precipitationIn,
    precipProbPct: defaults?.precipProbPct,
    // Atmospheric — passed through from forecast data when available
    pressureHpa: defaults?.pressureHpa,
    dewpointF: defaults?.dewpointF,
    uvIndex: defaults?.uvIndex,
    weatherCode: defaults?.weatherCode,
    waveDirDeg: defaults?.waveDirDeg,
    isLiveForecast: defaults?.isLiveForecast ?? false,
    isMissingWaveData: defaults?.isMissingWaveData ?? false,
    zoneId: defaults?.zoneId,
    routeHeadingDeg: defaults?.routeHeadingDeg,
  };
}

/**
 * Wind-against-current interaction modifier.
 * When wind opposes current, wave heights can multiply dramatically.
 * This is safety-critical — the Potato Patch and Raccoon Strait are lethal in these conditions.
 */
export function windCurrentInteraction(
  windSpeedKts: number,
  windDirDeg: number,
  currentSpeedKts: number,
  currentDirDeg: number
): number {
  const angleDiff = Math.abs(windDirDeg - currentDirDeg);
  const normalizedAngle = angleDiff > 180 ? 360 - angleDiff : angleDiff;

  // Opposing = angle > 120 degrees
  const isOpposing = normalizedAngle > 120;

  if (!isOpposing || currentSpeedKts < 1.5 || windSpeedKts < 10) {
    return 1.0; // no significant interaction
  }

  // Severity scales with both current and wind speed
  const severity = (currentSpeedKts / 3) * (windSpeedKts / 15);
  return Math.min(3.0, 1.0 + severity);
}

/**
 * Vessel wave tolerance multiplier.
 * Combines LOA scaling with hull-type-specific comfort factors.
 * Bigger boats and better hull designs handle more waves.
 */
export function vesselWaveToleranceMultiplier(loa: number, hullType?: string): number {
  const hullMultiplier: Record<string, number> = {
    'deep-v': 1.0,
    'modified-v': 0.85,
    'flat-bottom': 0.5,
    'pontoon': 0.5,
    'displacement': 1.2,
    'monohull': 1.2,
    'catamaran': 1.3,
    'trimaran': 1.3,
    'sit-on-top': 0.6,
    'sit-inside': 0.7,
    'inflatable': 0.5,
    'RIB': 0.9,
    'center-console': 1.0,
    'bowrider': 0.85,
    'cabin-cruiser': 1.1,
  };
  const hullFactor = hullMultiplier[hullType ?? ''] ?? 1.0;
  const loaFactor = 1.0 + (loa - 20) * 0.025;
  return loaFactor * hullFactor;
}

/**
 * Adjust wave height for vessel tolerance.
 * Returns the "effective" wave height that the vessel experiences.
 */
function effectiveWaveHeight(waveHtFt: number, vessel: VesselProfile): number {
  const multiplier = vesselWaveToleranceMultiplier(vessel.loa, vessel.hullType);
  // Bigger boat = lower effective wave height (waves feel smaller)
  return waveHtFt / multiplier;
}

/**
 * Generate a simple variability range from zone data.
 * In the full version this would come from 44 years of NDBC data.
 * For MVP, we estimate P10/P90 as ±30% of the median score.
 */
function estimateScoreRange(score: number): ScoreRange {
  const variance = Math.round(score * 0.3);
  return {
    p10: Math.max(1, score - variance - 1),
    p25: Math.max(1, score - Math.round(variance * 0.5)),
    p50: score,
    p75: Math.min(10, score + Math.round(variance * 0.5)),
    p90: Math.min(10, score + variance + 1),
  };
}

/**
 * Identify risk factors for a route based on zone conditions.
 */
function identifyRiskFactors(
  zones: Zone[],
  month: number,
  hour: number,
  activity: ActivityProfile
): RiskFactor[] {
  const risks: RiskFactor[] = [];

  for (const zone of zones) {
    const conditions = getTimeConditions(zone, hour, month);

    // Afternoon wind buildup warning
    if (hour < 12) {
      const pmConditions = zone.monthlyConditions[month]?.pm;
      if (pmConditions && pmConditions.windKts > activity.maxWind) {
        risks.push({
          factor: 'Afternoon wind buildup',
          severity: 'high',
          description: `${zone.name} typically builds from ${conditions.windKts} to ${pmConditions.windKts} kts between 10 AM and 2 PM. Plan your return before noon.`,
        });
      }
    }

    // High wave warning
    if (conditions.waveHtFt > activity.maxWave * 0.8) {
      risks.push({
        factor: 'Wave height near limit',
        severity: conditions.waveHtFt > activity.maxWave ? 'high' : 'medium',
        description: `${zone.name}: ${conditions.waveHtFt} ft waves (your limit: ${activity.maxWave} ft).`,
      });
    }

    // Short period steep chop
    if (conditions.wavePeriodS < 4 && conditions.waveHtFt > 1.0) {
      risks.push({
        factor: 'Steep, short-period chop',
        severity: 'medium',
        description: `${zone.name}: ${conditions.wavePeriodS}s wave period creates steep, closely-spaced waves that feel worse than the height suggests.`,
      });
    }
  }

  return risks;
}

/**
 * Generate a variability warning string for high-variance zones.
 */
function getVariabilityWarning(
  zones: Zone[],
  month: number
): string | null {
  for (const zone of zones) {
    const monthData = zone.monthlyConditions[month];
    if (!monthData) continue;

    const windDiff = monthData.pm.windKts - monthData.am.windKts;
    if (windDiff >= 10) {
      return `${zone.name} is highly variable. Wind can build from ${monthData.am.windKts} to ${monthData.pm.windKts} kts between morning and afternoon.`;
    }
  }
  return null;
}

/**
 * Score a complete route: origin → destination with all zones traversed.
 * Returns the full ScoredRoute with variability, risks, verify links, and alternatives.
 */
export function routeComfort(
  origin: Destination,
  destination: Destination,
  month: number,
  hour: number,
  activity: ActivityProfile,
  vessel: VesselProfile,
  city: City
): ScoredRoute {
  const zones = getRouteZones(origin, destination, city);
  const distanceKey = `${origin.id}-${destination.id}`;
  const distance = city.distances[distanceKey] ?? 0;
  const transit = transitTime(distance, vessel.cruiseSpeed);
  const fuel = fuelRoundTrip(distance, vessel.gph, vessel.cruiseSpeed);
  const rangeOk = isInRange(distance, vessel);
  const draft = draftClearance(destination, vessel);

  // Compute route heading for directional wave scoring
  const routeHeadingDeg = computeBearing(origin.lat, origin.lng, destination.lat, destination.lng);

  // Score each zone using full conditions — route comfort = worst zone (bottleneck rule)
  let worstScore = 10;
  let allRiskFactors: RiskFactor[] = [];
  for (const zone of zones) {
    const zoneConditions = getTimeConditions(zone, Math.floor(hour), month);
    // Pass zone ID and route heading so the scoring engine can apply
    // zone-specific current warnings and wave direction scoring
    const fullConds = buildFullConditions(zoneConditions, month, Math.floor(hour), { zoneId: zone.id, routeHeadingDeg });
    const { score, factors } = fullConditionsScore(activity, fullConds, vessel);
    if (score < worstScore) {
      worstScore = score;
    }
    allRiskFactors = allRiskFactors.concat(factors);
  }

  const scoreRange = estimateScoreRange(worstScore);
  // Combine full-conditions risk factors with zone-level risk factors
  const zoneRiskFactors = identifyRiskFactors(zones, month, Math.floor(hour), activity);
  // Deduplicate by factor name
  const seenFactors = new Set<string>();
  const riskFactors = [...allRiskFactors, ...zoneRiskFactors].filter(f => {
    if (seenFactors.has(f.factor)) return false;
    seenFactors.add(f.factor);
    return true;
  });
  const variabilityWarning = getVariabilityWarning(zones, month);

  // Depth/draft check — add warnings for shallow zones
  const depthCheck = routeDepthCheck(zones.map(z => z.id), vessel);
  if (!depthCheck.navigable) {
    // Depth failure is a hard penalty
    worstScore = Math.min(worstScore, 2);
  }
  for (const warning of depthCheck.warnings) {
    riskFactors.push({
      factor: warning.startsWith('UNSAFE') ? 'Insufficient depth' : 'Shallow water',
      severity: warning.startsWith('UNSAFE') ? 'high' : 'medium',
      description: warning,
    });
  }

  // Collect verify links from all traversed zones
  const verifyLinks = zones.flatMap(z => {
    // Look up zone verify links from city data
    const cityVerify = city.verifyLinks || [];
    return cityVerify;
  });

  return {
    originId: origin.id,
    destinationId: destination.id,
    score: worstScore,
    primaryReason: getPrimaryReason(worstScore, riskFactors, zones, month, Math.floor(hour)),
    scoreRange,
    distance,
    transitMinutes: transit,
    fuelGallons: fuel,
    inRange: rangeOk,
    draftClear: draft.clear,
    draftWarning: draft.warning ?? null,
    variabilityWarning,
    riskFactors,
    verifyLinks,
    beforeYouGo: activity.beforeYouGo,
    alternatives: [], // filled by findAlternatives
  };
}

/**
 * Generate a one-sentence explanation of WHY a route scored the way it did.
 * This replaces raw wind/wave numbers on destination cards with human-readable reasons.
 */
function getPrimaryReason(
  score: number,
  riskFactors: RiskFactor[],
  zones: Zone[],
  month: number,
  hour: number,
): string {
  // Dangerous — use the first high-severity risk factor
  if (score <= 2) {
    const danger = riskFactors.find(r => r.severity === 'high');
    return danger?.factor ?? 'Dangerous conditions';
  }

  // Poor/marginal — show the primary limiting factor
  if (score <= 4) {
    const warning = riskFactors.find(r => r.severity === 'high' || r.severity === 'medium');
    if (warning) return warning.factor;
    // Fall back to worst zone conditions
    const worst = zones.reduce((w, z) => {
      const c = getTimeConditions(z, hour, month);
      return c.windKts > (w?.windKts ?? 0) ? c : w;
    }, getTimeConditions(zones[0], hour, month));
    if (worst.windKts > 15) return `Strong wind (${worst.windKts}kt)`;
    if (worst.waveHtFt > 2) return `Rough water (${worst.waveHtFt}ft waves)`;
    return 'Marginal conditions';
  }

  // Fair — note the moderate limiting factor
  if (score <= 6) {
    const factor = riskFactors.find(r => r.severity === 'medium');
    if (factor) return factor.factor;
    return 'Fair conditions — check forecast';
  }

  // Good — describe what makes it good
  if (score <= 8) {
    const cond = getTimeConditions(zones[0], hour, month);
    if (cond.windKts < 8 && cond.waveHtFt < 1) return 'Calm and sheltered';
    if (cond.windKts < 12) return 'Light wind, manageable chop';
    return 'Good conditions';
  }

  // Excellent
  const cond = getTimeConditions(zones[0], hour, month);
  if (cond.windKts < 5) return 'Glass-calm, perfect conditions';
  return 'Excellent conditions';
}

/**
 * Find the best alternative destinations when the primary choice scores low.
 * Returns top 2 alternatives scoring >= 6, sorted by score descending.
 */
export function findAlternatives(
  origin: Destination,
  month: number,
  hour: number,
  activity: ActivityProfile,
  vessel: VesselProfile,
  city: City,
  excludeId: string
): ScoredRouteAlternative[] {
  const candidates: ScoredRouteAlternative[] = [];

  for (const dest of city.destinations) {
    if (dest.id === origin.id || dest.id === excludeId) continue;
    if (!dest.activityTags.includes(activity.id)) continue;

    const scored = routeComfort(origin, dest, month, hour, activity, vessel, city);
    if (scored.score >= 6 && scored.inRange) {
      candidates.push({
        destinationId: dest.id,
        destinationName: dest.name,
        score: scored.score,
        distance: scored.distance,
        transitMinutes: scored.transitMinutes,
        reason: getAlternativeReason(dest, scored.score),
      });
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

function getAlternativeReason(dest: Destination, score: number): string {
  if (score >= 9) return `${dest.name} is in excellent conditions right now`;
  if (score >= 7) return `${dest.name} is sheltered and comfortable`;
  return `${dest.name} has better conditions than your selection`;
}

/**
 * Compute initial bearing from point A to point B in degrees (0-360).
 * Used for route heading to enable directional wave/wind scoring.
 */
function computeBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1R = lat1 * Math.PI / 180;
  const lat2R = lat2 * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2R);
  const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLng);
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}
