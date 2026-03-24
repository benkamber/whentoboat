/**
 * Generate a curved arc between two points for visual route display.
 * Uses a quadratic bezier with a midpoint offset perpendicular to the line.
 */
export function generateArc(
  start: [number, number], // [lng, lat]
  end: [number, number],
  numPoints: number = 30,
  curveFactor: number = 0.15
): [number, number][] {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Perpendicular offset for the arc midpoint
  const midX = (start[0] + end[0]) / 2 + (-dy * curveFactor);
  const midY = (start[1] + end[1]) / 2 + (dx * curveFactor);

  const coordinates: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const u = 1 - t;
    // Quadratic bezier: P = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
    const lng = u * u * start[0] + 2 * u * t * midX + t * t * end[0];
    const lat = u * u * start[1] + 2 * u * t * midY + t * t * end[1];
    coordinates.push([lng, lat]);
  }
  return coordinates;
}
