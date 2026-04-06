/**
 * Parse a human-readable depth string to extract the minimum depth in feet.
 * Returns null if unparseable.
 */
export function parseMinDepthFt(depthStr: string): number | null {
  if (!depthStr) return null;
  const lower = depthStr.toLowerCase();
  if (lower === 'varies' || lower === 'n/a' || lower === 'variable') return null;
  const ltMatch = depthStr.match(/<\s*(\d+\.?\d*)\s*ft/i);
  if (ltMatch) return parseFloat(ltMatch[1]);
  const rangeMatch = depthStr.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*ft/i);
  if (rangeMatch) return Math.min(parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2]));
  const simpleMatch = depthStr.match(/(\d+\.?\d*)\s*ft/i);
  if (simpleMatch) return parseFloat(simpleMatch[1]);
  const bareMatch = depthStr.match(/(\d+\.?\d*)/);
  if (bareMatch) return parseFloat(bareMatch[1]);
  return null;
}
