/**
 * Solunar period calculation for fishing.
 *
 * Based on John Alden Knight's solunar theory (1926):
 * - Major periods (~2hr): when the moon is directly overhead (transit) or underfoot (anti-transit)
 * - Minor periods (~1hr): moonrise and moonset
 *
 * We derive approximate times from the moonrise/moonset data already
 * fetched from the US Naval Observatory API (/api/astro).
 *
 * Scientific note: The solunar-to-fish-activity correlation is NOT proven
 * by controlled studies, but the underlying tidal mechanism IS sound:
 * new/full moon = spring tides = stronger currents = more bait movement.
 */

export interface SolunarPeriod {
  type: 'major' | 'minor';
  startHour: number; // 0-23
  endHour: number;
  label: string;
}

/**
 * Calculate solunar feeding periods from moonrise/moonset times.
 *
 * @param moonrise - "HH:MM" format from USNO, or null
 * @param moonset - "HH:MM" format from USNO, or null
 * @returns Array of solunar periods for the day
 */
export function getSolunarPeriods(
  moonrise: string | null,
  moonset: string | null,
): SolunarPeriod[] {
  const periods: SolunarPeriod[] = [];

  const parseTime = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h + m / 60;
  };

  if (moonrise) {
    const riseHour = parseTime(moonrise);
    // Minor period: moonrise ± 30 min
    periods.push({
      type: 'minor',
      startHour: Math.max(0, riseHour - 0.5),
      endHour: Math.min(24, riseHour + 0.5),
      label: `Moonrise ${moonrise}`,
    });
  }

  if (moonset) {
    const setHour = parseTime(moonset);
    // Minor period: moonset ± 30 min
    periods.push({
      type: 'minor',
      startHour: Math.max(0, setHour - 0.5),
      endHour: Math.min(24, setHour + 0.5),
      label: `Moonset ${moonset}`,
    });
  }

  if (moonrise && moonset) {
    const riseHour = parseTime(moonrise);
    const setHour = parseTime(moonset);

    // Major period 1: moon transit (overhead) ≈ midpoint of rise→set
    const transit = (riseHour + setHour) / 2;
    if (transit >= 0 && transit <= 24) {
      periods.push({
        type: 'major',
        startHour: Math.max(0, transit - 1),
        endHour: Math.min(24, transit + 1),
        label: `Moon overhead ~${Math.floor(transit)}:${String(Math.round((transit % 1) * 60)).padStart(2, '0')}`,
      });
    }

    // Major period 2: anti-transit (underfoot) ≈ transit + 12 hours
    const antiTransit = (transit + 12) % 24;
    periods.push({
      type: 'major',
      startHour: Math.max(0, antiTransit - 1),
      endHour: Math.min(24, antiTransit + 1),
      label: `Moon underfoot ~${Math.floor(antiTransit)}:${String(Math.round((antiTransit % 1) * 60)).padStart(2, '0')}`,
    });
  }

  return periods.sort((a, b) => a.startHour - b.startHour);
}

/** Check if a given hour falls within any solunar period */
export function isInSolunarPeriod(hour: number, periods: SolunarPeriod[]): SolunarPeriod | null {
  return periods.find(p => hour >= p.startHour && hour <= p.endHour) ?? null;
}

/**
 * Calculate barometric pressure trend from hourly readings.
 * Falling pressure = fish more active (pre-frontal conditions).
 */
export function getPressureTrend(
  pressureValues: number[],
): { trend: 'falling' | 'rising' | 'stable'; deltaHpa: number } {
  if (pressureValues.length < 2) return { trend: 'stable', deltaHpa: 0 };

  const recent = pressureValues[pressureValues.length - 1];
  const earlier = pressureValues[0];
  const delta = recent - earlier;

  if (delta < -2) return { trend: 'falling', deltaHpa: delta };
  if (delta > 2) return { trend: 'rising', deltaHpa: delta };
  return { trend: 'stable', deltaHpa: delta };
}
