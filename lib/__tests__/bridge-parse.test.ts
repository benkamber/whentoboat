import { describe, it, expect } from 'vitest';
import { parseMinBridgeClearanceFt } from '../bridge-parse';

describe('parseMinBridgeClearanceFt', () => {
  it('parses single bridge', () => expect(parseMinBridgeClearanceFt('Bay Bridge: 220 ft')).toBe(220));
  it('parses multiple bridges, returns minimum', () => {
    expect(parseMinBridgeClearanceFt('Bay Bridge: 220 ft; San Mateo: 135 ft')).toBe(135);
  });
  it('parses main/secondary, returns minimum', () => {
    expect(parseMinBridgeClearanceFt('Richmond-San Rafael Bridge: 185 ft main / 135 ft secondary')).toBe(135);
  });
  it('returns null for "None"', () => expect(parseMinBridgeClearanceFt('None')).toBeNull());
  it('returns null for empty', () => expect(parseMinBridgeClearanceFt('')).toBeNull());
});
