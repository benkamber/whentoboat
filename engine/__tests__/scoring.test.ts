import { describe, it, expect } from 'vitest';
import {
  activityScore,
  fullConditionsScore,
  vesselWaveToleranceMultiplier,
  windCurrentInteraction,
  DEFAULT_WATER_TEMP_F,
} from '../scoring';
import { getActivity } from '@/data/activities';
import { vesselPresets } from '@/data/vessels';
import type { FullConditions } from '../types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Build a FullConditions object with sane defaults, overriding specific fields. */
function makeConditions(overrides: Partial<FullConditions> = {}): FullConditions {
  return {
    windKts: 8,
    windDirDeg: 270,
    waveHtFt: 1.0,
    wavePeriodS: 4,
    waterTempF: DEFAULT_WATER_TEMP_F,
    airTempF: 65,
    currentKts: -1, // sentinel: unavailable
    currentDirDeg: 0,
    visibilityMi: 10,
    tideFt: 3,
    tidePhase: 'flood',
    isLiveForecast: false,
    isMissingWaveData: false,
    ...overrides,
  };
}

const kayakActivity = getActivity('kayak');
const supActivity = getActivity('sup');
const powerboatActivity = getActivity('powerboat_cruise');
const sailActivity = getActivity('casual_sail');

const kayakVessel = vesselPresets.find(v => v.type === 'kayak')!;
const supVessel = vesselPresets.find(v => v.type === 'sup')!;
const powerboatVessel = vesselPresets.find(v => v.type === 'powerboat')!;
const sailVessel = vesselPresets.find(v => v.type === 'sailboat')!;

// ---------------------------------------------------------------------------
// SAFETY BLOCKS — these are the most critical tests
// ---------------------------------------------------------------------------

describe('Safety blocks', () => {
  it('blocks kayak in dense fog (visibility < 1 mile)', () => {
    const conditions = makeConditions({ visibilityMi: 0.5 });
    const { score, factors } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    expect(score).toBe(1);
    expect(factors[0].factor).toContain('DANGER');
    expect(factors[0].factor).toContain('fog');
  });

  it('blocks SUP in dense fog (visibility < 1 mile)', () => {
    const conditions = makeConditions({ visibilityMi: 0.3 });
    const { score } = fullConditionsScore(supActivity, conditions, supVessel);
    expect(score).toBe(1);
  });

  it('does NOT block powerboat in dense fog (penalizes instead)', () => {
    const conditions = makeConditions({ visibilityMi: 0.5 });
    const { score } = fullConditionsScore(powerboatActivity, conditions, powerboatVessel);
    expect(score).toBeGreaterThan(1);
    expect(score).toBeLessThanOrEqual(7); // penalized but not blocked
  });

  it('blocks kayak when current exceeds paddle speed (>4kt)', () => {
    const conditions = makeConditions({ currentKts: 5.0 });
    const { score, factors } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    expect(score).toBe(1);
    expect(factors[0].description).toContain('swept to sea');
  });

  it('does NOT block powerboat in 5kt current', () => {
    const conditions = makeConditions({ currentKts: 5.0 });
    const { score } = fullConditionsScore(powerboatActivity, conditions, powerboatVessel);
    expect(score).toBeGreaterThan(1);
  });

  it('blocks SUP in central_bay zone', () => {
    const conditions = makeConditions({ zoneId: 'central_bay' });
    const { score, factors } = fullConditionsScore(supActivity, conditions, supVessel);
    expect(score).toBe(1);
    expect(factors[0].factor).toContain('Open water');
  });

  it('blocks SUP in ocean_south zone', () => {
    const conditions = makeConditions({ zoneId: 'ocean_south' });
    const { score } = fullConditionsScore(supActivity, conditions, supVessel);
    expect(score).toBe(1);
  });

  it('blocks SUP in ocean_north zone', () => {
    const conditions = makeConditions({ zoneId: 'ocean_north' });
    const { score } = fullConditionsScore(supActivity, conditions, supVessel);
    expect(score).toBe(1);
  });

  it('blocks SUP in san_pablo zone', () => {
    const conditions = makeConditions({ zoneId: 'san_pablo' });
    const { score } = fullConditionsScore(supActivity, conditions, supVessel);
    expect(score).toBe(1);
  });

  it('allows SUP in richardson zone', () => {
    const conditions = makeConditions({ zoneId: 'richardson', windKts: 3, waveHtFt: 0.2 });
    const { score } = fullConditionsScore(supActivity, conditions, supVessel);
    expect(score).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// SENTINEL HANDLING — currentKts === -1
// ---------------------------------------------------------------------------

describe('Current data sentinel (-1)', () => {
  it('adds warning when current data unavailable for paddlecraft', () => {
    const conditions = makeConditions({ currentKts: -1 });
    const { factors } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    const currentFactor = factors.find(f => f.factor.includes('Current data unavailable'));
    expect(currentFactor).toBeDefined();
  });

  it('adds HIGH PRIORITY warning in high-current zones', () => {
    const conditions = makeConditions({ currentKts: -1, zoneId: 'central_bay' });
    const { factors } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    const currentFactor = factors.find(f => f.factor.includes('HIGH PRIORITY'));
    expect(currentFactor).toBeDefined();
    expect(currentFactor!.severity).toBe('high');
  });

  it('does NOT trigger wind-against-current when current is sentinel', () => {
    const conditions = makeConditions({ currentKts: -1, windKts: 20, windDirDeg: 90, currentDirDeg: 270 });
    const { factors } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    const wacFactor = factors.find(f => f.factor === 'Wind against current');
    expect(wacFactor).toBeUndefined();
  });

  it('does NOT trigger ebb penalty when current is sentinel', () => {
    const conditions = makeConditions({ currentKts: -1, tidePhase: 'ebb' });
    const { factors } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    const ebbFactor = factors.find(f => f.factor === 'Strong ebb current');
    expect(ebbFactor).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// OCEAN ZONE CAP
// ---------------------------------------------------------------------------

describe('Ocean zone cap', () => {
  it('caps ocean_south scores at 5', () => {
    const conditions = makeConditions({ zoneId: 'ocean_south', windKts: 5, waveHtFt: 0.5 });
    const { score } = fullConditionsScore(powerboatActivity, conditions, powerboatVessel);
    expect(score).toBeLessThanOrEqual(5);
  });

  it('caps ocean_north scores at 5', () => {
    const conditions = makeConditions({ zoneId: 'ocean_north', windKts: 5, waveHtFt: 0.5 });
    const { score } = fullConditionsScore(powerboatActivity, conditions, powerboatVessel);
    expect(score).toBeLessThanOrEqual(5);
  });

  it('always adds bar forecast warning for ocean zones', () => {
    const conditions = makeConditions({ zoneId: 'ocean_south', windKts: 20, waveHtFt: 8 });
    const { factors } = fullConditionsScore(powerboatActivity, conditions, powerboatVessel);
    const oceanFactor = factors.find(f => f.factor.includes('bar forecast'));
    expect(oceanFactor).toBeDefined();
  });

  it('does NOT cap non-ocean zones at 5', () => {
    const conditions = makeConditions({ zoneId: 'richardson', windKts: 3, waveHtFt: 0.2 });
    const { score } = fullConditionsScore(powerboatActivity, conditions, powerboatVessel);
    expect(score).toBeGreaterThan(5);
  });
});

// ---------------------------------------------------------------------------
// VISIBILITY FIX — zero visibility must trigger fog penalty
// ---------------------------------------------------------------------------

describe('Visibility scoring', () => {
  it('penalizes powerboat at zero visibility (was a bug)', () => {
    const conditions = makeConditions({ visibilityMi: 0 });
    const { score, factors } = fullConditionsScore(powerboatActivity, conditions, powerboatVessel);
    const fogFactor = factors.find(f => f.factor === 'Dense fog');
    expect(fogFactor).toBeDefined();
    expect(score).toBeLessThan(8);
  });

  it('applies fog penalty for visibility 1-3 miles', () => {
    const conditions = makeConditions({ visibilityMi: 2 });
    const { factors } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    const fogFactor = factors.find(f => f.factor === 'Fog');
    expect(fogFactor).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// GUST SCORING
// ---------------------------------------------------------------------------

describe('Gust scoring', () => {
  it('penalizes very gusty conditions (ratio > 2.0)', () => {
    const conditions = makeConditions({ windKts: 10, windGustKts: 22 });
    const { factors } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    const gustFactor = factors.find(f => f.factor === 'Very gusty conditions');
    expect(gustFactor).toBeDefined();
    expect(gustFactor!.severity).toBe('high');
  });

  it('penalizes moderately gusty conditions (ratio > 1.5)', () => {
    const conditions = makeConditions({ windKts: 12, windGustKts: 20 });
    const { factors } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    const gustFactor = factors.find(f => f.factor === 'Gusty conditions');
    expect(gustFactor).toBeDefined();
  });

  it('does NOT penalize steady winds (ratio < 1.5)', () => {
    const conditions = makeConditions({ windKts: 12, windGustKts: 14 });
    const { factors } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    const gustFactor = factors.find(f => f.factor.includes('gusty') || f.factor.includes('Gusty'));
    expect(gustFactor).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// PRECIPITATION SCORING
// ---------------------------------------------------------------------------

describe('Precipitation scoring', () => {
  it('penalizes heavy rain', () => {
    const conditions = makeConditions({ precipitationIn: 0.3 });
    const { factors } = fullConditionsScore(powerboatActivity, conditions, powerboatVessel);
    const rainFactor = factors.find(f => f.factor === 'Heavy rain');
    expect(rainFactor).toBeDefined();
    expect(rainFactor!.severity).toBe('high');
  });

  it('notes rain likely when probability is high', () => {
    const conditions = makeConditions({ precipProbPct: 75 });
    const { factors } = fullConditionsScore(powerboatActivity, conditions, powerboatVessel);
    const rainFactor = factors.find(f => f.factor === 'Rain likely');
    expect(rainFactor).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// COLD WATER SCORING
// ---------------------------------------------------------------------------

describe('Cold water scoring', () => {
  it('penalizes kayak in very cold water (<50F)', () => {
    const conditions = makeConditions({ waterTempF: 48 });
    const { factors } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    const coldFactor = factors.find(f => f.factor === 'Very cold water');
    expect(coldFactor).toBeDefined();
    expect(coldFactor!.severity).toBe('high');
  });

  it('does NOT penalize powerboat for cold water', () => {
    const conditions = makeConditions({ waterTempF: 48 });
    const { factors } = fullConditionsScore(powerboatActivity, conditions, powerboatVessel);
    const coldFactor = factors.find(f => f.factor.includes('cold water') || f.factor.includes('Cold water'));
    expect(coldFactor).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// BEAM-SEA SCORING
// ---------------------------------------------------------------------------

describe('Beam-sea scoring', () => {
  it('penalizes beam seas (waves perpendicular to route)', () => {
    const conditions = makeConditions({
      waveDirDeg: 180,
      routeHeadingDeg: 90,
      waveHtFt: 3,
    });
    const { factors } = fullConditionsScore(powerboatActivity, conditions, powerboatVessel);
    const beamFactor = factors.find(f => f.factor === 'Beam seas');
    expect(beamFactor).toBeDefined();
  });

  it('does NOT penalize following seas', () => {
    const conditions = makeConditions({
      waveDirDeg: 270,
      routeHeadingDeg: 270,
      waveHtFt: 3,
    });
    const { factors } = fullConditionsScore(powerboatActivity, conditions, powerboatVessel);
    const beamFactor = factors.find(f => f.factor === 'Beam seas');
    expect(beamFactor).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// DEWPOINT FOG DETECTION
// ---------------------------------------------------------------------------

describe('Dewpoint fog detection', () => {
  it('warns of fog forming when dewpoint spread is < 2F', () => {
    const conditions = makeConditions({ airTempF: 60, dewpointF: 59 });
    const { factors } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    const fogFactor = factors.find(f => f.factor === 'Fog forming');
    expect(fogFactor).toBeDefined();
  });

  it('does NOT warn when dewpoint spread is large', () => {
    const conditions = makeConditions({ airTempF: 70, dewpointF: 50 });
    const { factors } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    const fogFactor = factors.find(f => f.factor === 'Fog forming');
    expect(fogFactor).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// SCORE CLAMPING — output always 1-10
// ---------------------------------------------------------------------------

describe('Score clamping', () => {
  it('never returns score below 1 even with max penalties', () => {
    const conditions = makeConditions({
      windKts: 50,
      waveHtFt: 10,
      waterTempF: 40,
      visibilityMi: 0.5,
      windGustKts: 80,
      precipitationIn: 0.5,
    });
    const { score } = fullConditionsScore(kayakActivity, conditions, kayakVessel);
    expect(score).toBe(1);
  });

  it('never returns score above 10 even with perfect conditions', () => {
    const conditions = makeConditions({
      windKts: 4,
      waveHtFt: 0.1,
      waterTempF: 68,
      visibilityMi: 15,
      zoneId: 'richardson',
    });
    const { score } = fullConditionsScore(powerboatActivity, conditions, powerboatVessel);
    expect(score).toBeLessThanOrEqual(10);
    expect(score).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// VESSEL WAVE TOLERANCE MULTIPLIER
// ---------------------------------------------------------------------------

describe('vesselWaveToleranceMultiplier', () => {
  it('deep-v hull gets multiplier of 1.0', () => {
    const m = vesselWaveToleranceMultiplier(20, 'deep-v');
    expect(m).toBe(1.0);
  });

  it('flat-bottom hull gets lower multiplier (more affected by waves)', () => {
    const m = vesselWaveToleranceMultiplier(20, 'flat-bottom');
    expect(m).toBeLessThan(1.0);
  });

  it('catamaran gets higher multiplier (more stable)', () => {
    const m = vesselWaveToleranceMultiplier(20, 'catamaran');
    expect(m).toBeGreaterThan(1.0);
  });

  it('larger boats get higher multiplier', () => {
    const small = vesselWaveToleranceMultiplier(16, 'deep-v');
    const large = vesselWaveToleranceMultiplier(30, 'deep-v');
    expect(large).toBeGreaterThan(small);
  });
});

// ---------------------------------------------------------------------------
// WIND-CURRENT INTERACTION
// ---------------------------------------------------------------------------

describe('windCurrentInteraction', () => {
  it('returns 1.0 when wind and current are aligned (same direction)', () => {
    const m = windCurrentInteraction(15, 270, 3, 270);
    expect(m).toBe(1.0);
  });

  it('returns > 1.0 when wind opposes current', () => {
    const m = windCurrentInteraction(15, 270, 3, 90);
    expect(m).toBeGreaterThan(1.0);
  });

  it('returns 1.0 when current is weak (<1.5kt)', () => {
    const m = windCurrentInteraction(20, 270, 1.0, 90);
    expect(m).toBe(1.0);
  });

  it('returns 1.0 when wind is light (<10kt)', () => {
    const m = windCurrentInteraction(5, 270, 3, 90);
    expect(m).toBe(1.0);
  });

  it('caps at 3.0 maximum', () => {
    const m = windCurrentInteraction(30, 270, 5, 90);
    expect(m).toBeLessThanOrEqual(3.0);
  });
});

// ---------------------------------------------------------------------------
// ACTIVITY SCORE — base wind/wave scoring
// ---------------------------------------------------------------------------

describe('activityScore', () => {
  it('gives kayak a high score in ideal conditions', () => {
    const score = activityScore(kayakActivity, 4, 0.3, 5);
    expect(score).toBeGreaterThanOrEqual(8);
  });

  it('gives kayak a low score in dangerous wind', () => {
    const score = activityScore(kayakActivity, 25, 0.5, 4);
    expect(score).toBeLessThanOrEqual(4); // penalized but wave weight pulls up
  });

  it('gives sailboat a low score with no wind', () => {
    const score = activityScore(sailActivity, 2, 0.5, 5);
    expect(score).toBeLessThan(8);
  });

  it('gives sailboat a high score in ideal wind', () => {
    const score = activityScore(sailActivity, 12, 1.0, 6);
    expect(score).toBeGreaterThanOrEqual(8);
  });
});
