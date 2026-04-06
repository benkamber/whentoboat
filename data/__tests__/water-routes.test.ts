import { describe, it, expect } from 'vitest';
import { getWaterRoute } from '../cities/sf-bay/water-routes';

describe('getWaterRoute', () => {
  it('returns a route for a validated pair', () => {
    // sau → ang is validated: true
    const route = getWaterRoute('sau', 'ang');
    expect(route).not.toBeNull();
    expect(route!.fromId).toBe('sau');
    expect(route!.toId).toBe('ang');
    expect(route!.waypoints.length).toBeGreaterThan(0);
  });

  it('returns reversed waypoints for reverse lookup', () => {
    const forward = getWaterRoute('sau', 'ang');
    const reverse = getWaterRoute('ang', 'sau');
    expect(forward).not.toBeNull();
    expect(reverse).not.toBeNull();
    expect(reverse!.fromId).toBe('ang');
    expect(reverse!.toId).toBe('sau');
    // First waypoint of reverse should be last waypoint of forward
    expect(reverse!.waypoints[0]).toEqual(forward!.waypoints[forward!.waypoints.length - 1]);
  });

  it('returns null for nonexistent route pair', () => {
    const route = getWaterRoute('xxx', 'yyy');
    expect(route).toBeNull();
  });

  it('returns null for a pair with no validated route', () => {
    // If all routes from a hub like 'mry' (Monterey) have no validated route
    const route = getWaterRoute('mry', 'scz');
    expect(route).toBeNull();
  });
});
