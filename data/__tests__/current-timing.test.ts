import { describe, it, expect } from 'vitest';
import { getCurrentTimingForRoute } from '../cities/sf-bay/current-timing';

describe('getCurrentTimingForRoute', () => {
  it('returns Golden Gate timing for routes mentioning Harding Rock', () => {
    const advice = getCurrentTimingForRoute('Harding Rock, commercial ship traffic');
    expect(advice.length).toBeGreaterThan(0);
    expect(advice[0].zoneId).toBe('central_bay');
  });

  it('returns Raccoon Strait timing for routes mentioning Raccoon', () => {
    const advice = getCurrentTimingForRoute('Raccoon Strait currents');
    expect(advice.length).toBeGreaterThan(0);
    expect(advice[0].zoneId).toBe('richardson');
  });

  it('returns empty for routes with no current-relevant hazards', () => {
    const advice = getCurrentTimingForRoute('Shallow water only');
    expect(advice).toEqual([]);
  });

  it('returns multiple zones when route crosses several', () => {
    const advice = getCurrentTimingForRoute('Golden Gate ebb, Raccoon Strait, Bay Bridge currents');
    expect(advice.length).toBeGreaterThanOrEqual(3);
  });
});
