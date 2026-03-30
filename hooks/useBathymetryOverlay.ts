import { useMemo } from 'react';
import { zoneBoundaries } from '@/data/cities/sf-bay/zone-boundaries';
import { zoneDepths } from '@/data/geo/sf-bay-depths';

/**
 * Depth-to-color mapping for the bathymetry overlay.
 * Shows where the water is deep vs shallow:
 * - Deep water (30+ ft): dark blue, very transparent
 * - Moderate (10-30 ft): medium blue
 * - Shallow (4-10 ft): lighter blue/cyan
 * - Very shallow (0-4 ft): tan/sand color, clearly visible as "caution"
 */
function depthToStyle(typicalDepthFt: number): { color: string; opacity: number } {
  if (typicalDepthFt >= 30) {
    return { color: '#1e40af', opacity: 0.45 };  // Deep — dark blue, clearly visible
  }
  if (typicalDepthFt >= 10) {
    return { color: '#3b82f6', opacity: 0.55 };  // Moderate — bright blue
  }
  if (typicalDepthFt >= 4) {
    return { color: '#22d3ee', opacity: 0.60 };  // Shallow — cyan, prominent
  }
  return { color: '#f59e0b', opacity: 0.70 };    // Very shallow — amber hazard
}

/**
 * Generate GeoJSON for the bathymetry depth overlay.
 * Uses zone boundary polygons colored by typical depth.
 * This overlay sits BEHIND the zone comfort overlay but above the base map water color.
 */
export function useBathymetryOverlay() {
  return useMemo(() => {
    const features = zoneBoundaries.map(({ zoneId, polygon }) => {
      const depth = zoneDepths.find((d) => d.zoneId === zoneId);
      if (!depth) return null;

      const { color, opacity } = depthToStyle(depth.typicalDepthFt);

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [polygon],
        },
        properties: {
          zoneId,
          depthFt: depth.typicalDepthFt,
          minDepthFt: depth.minDepthFt,
          color,
          opacity,
        },
      };
    }).filter((f): f is NonNullable<typeof f> => f !== null);

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, []);
}
