import { describe, it, expect } from 'vitest';
import { parseMinDepthFt } from '../depth-parse';

describe('parseMinDepthFt', () => {
  it('parses "X ft"', () => expect(parseMinDepthFt('8 ft')).toBe(8));
  it('parses "X-Y ft" range', () => expect(parseMinDepthFt('2.5-4 ft MLLW')).toBe(2.5));
  it('parses "< X ft"', () => expect(parseMinDepthFt('< 4 ft')).toBe(4));
  it('returns null for "varies"', () => expect(parseMinDepthFt('varies')).toBeNull());
  it('returns null for empty', () => expect(parseMinDepthFt('')).toBeNull());
  it('handles complex strings', () => {
    expect(parseMinDepthFt('Variable — EXTREME SILTATION. < 4 ft in spots.')).toBe(4);
    expect(parseMinDepthFt('8.5-10 ft draft clearance')).toBe(8.5);
  });
  it('parses "10-14 ft"', () => expect(parseMinDepthFt('10-14 ft')).toBe(10));
  it('returns null for null input', () => expect(parseMinDepthFt(null as any)).toBeNull());
});
