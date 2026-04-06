/**
 * Parse bridge clearance string to extract minimum clearance in feet.
 * Returns null if no bridges or unparseable.
 *
 * Examples:
 *   "Bay Bridge: 220 ft" → 220
 *   "Richmond-San Rafael Bridge: 185 ft main / 135 ft secondary" → 135
 *   "Bay Bridge: 220 ft; San Mateo-Hayward: 135 ft" → 135
 *   "None" → null
 */
export function parseMinBridgeClearanceFt(bridgeStr: string): number | null {
  if (!bridgeStr || bridgeStr.toLowerCase() === 'none') return null;
  const matches = bridgeStr.matchAll(/(\d+)\s*ft/gi);
  let min: number | null = null;
  for (const match of matches) {
    const val = parseInt(match[1]);
    if (min === null || val < min) min = val;
  }
  return min;
}
