import type { Zone, ZoneConditions } from './types';

/**
 * Interpolate zone conditions for a specific hour of day.
 * AM data represents typical 7-10 AM conditions.
 * PM data represents typical 1-5 PM conditions.
 * We interpolate between them across the full day.
 */
export function getTimeConditions(
  zone: Zone,
  hour: number,
  month: number
): ZoneConditions {
  const monthData = zone.monthlyConditions[month];
  if (!monthData) {
    // Fallback to January if month data missing — log warning since this indicates a data gap
    if (typeof console !== 'undefined') {
      console.warn(`[interpolation] No data for zone "${zone.id}" month ${month}, using January fallback`);
    }
    return zone.monthlyConditions[0]?.am ?? { windKts: 5, waveHtFt: 1.0, wavePeriodS: 3, comfort: 5 };
  }

  const { am, pm } = monthData;

  if (hour <= 6) {
    // Pre-dawn: slightly below AM conditions (calmer)
    return blendConditions(am, am, 0, 0.8);
  }

  if (hour <= 10) {
    // Prime morning: full AM conditions
    return am;
  }

  if (hour <= 13) {
    // Transition: linear blend from AM to PM
    const t = (hour - 10) / 3;
    return blendConditions(am, pm, t);
  }

  if (hour <= 17) {
    // Afternoon: full PM conditions
    return pm;
  }

  if (hour <= 19) {
    // Glass-off: partial recovery from PM toward AM
    const t = (hour - 17) / 2;
    return blendConditions(pm, am, t * 0.5);
  }

  // After dark: slightly worse than PM
  return {
    windKts: Math.max(0, pm.windKts - 1),
    waveHtFt: pm.waveHtFt,
    wavePeriodS: pm.wavePeriodS,
    comfort: Math.max(1, pm.comfort - 1),
  };
}

/**
 * Linearly blend two condition sets.
 * t=0 returns 'a', t=1 returns 'b'.
 * Optional scale factor applies to the result.
 */
function blendConditions(
  a: ZoneConditions,
  b: ZoneConditions,
  t: number,
  scale: number = 1.0
): ZoneConditions {
  return {
    windKts: Math.round((a.windKts * (1 - t) + b.windKts * t) * scale * 10) / 10,
    waveHtFt: Math.round((a.waveHtFt * (1 - t) + b.waveHtFt * t) * scale * 10) / 10,
    wavePeriodS: Math.round(a.wavePeriodS * (1 - t) + b.wavePeriodS * t),
    comfort: Math.round((a.comfort * (1 - t) + b.comfort * t) * scale),
  };
}
