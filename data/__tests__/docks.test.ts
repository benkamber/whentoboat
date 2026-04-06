import { describe, it, expect } from 'vitest';
import { getDocksForDestination } from '../cities/sf-bay/docks';

describe('getDocksForDestination', () => {
  it('returns docks for a destination with docks', () => {
    const docks = getDocksForDestination('sau');
    expect(docks.length).toBeGreaterThan(0);
    expect(docks[0].destinationId).toBe('sau');
  });

  it('returns empty array for destination without docks', () => {
    const docks = getDocksForDestination('nonexistent');
    expect(docks).toEqual([]);
  });

  it('every dock has at least one source', () => {
    const docks = getDocksForDestination('tib');
    for (const dock of docks) {
      expect(dock.sources.length).toBeGreaterThan(0);
    }
  });
});
