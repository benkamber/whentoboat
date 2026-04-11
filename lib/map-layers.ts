// Mapbox GL layer style constants for the main map view.
// Extracted from app/page.tsx — purely visual configuration, no logic.

export const routeLineLayer = {
  id: 'route-lines',
  type: 'line' as const,
  filter: ['!=', ['get', 'isApproximate'], true] as any,
  layout: {
    'line-join': 'round' as const,
    'line-cap': 'butt' as const,
  },
  paint: {
    'line-color': ['get', 'color'] as any,
    'line-width': ['get', 'lineWidth'] as any,
    'line-opacity': ['get', 'opacity'] as any,
    'line-dasharray': [2, 2] as any,
  },
};

export const approxRouteLineLayer = {
  id: 'approx-route-lines',
  type: 'line' as const,
  filter: ['==', ['get', 'isApproximate'], true] as any,
  layout: {
    'line-join': 'round' as const,
    'line-cap': 'butt' as const,
  },
  paint: {
    'line-color': ['get', 'color'] as any,
    'line-width': ['get', 'lineWidth'] as any,
    'line-opacity': ['get', 'opacity'] as any,
    'line-dasharray': [1, 4] as any,
  },
};

export const routeHitLayer = {
  id: 'route-lines-hit',
  type: 'line' as const,
  paint: {
    'line-color': 'transparent',
    'line-width': 14,
    'line-opacity': 0,
  },
};

// Non-origin destination circles — color driven by distance from origin
export const destinationCircleLayer = {
  id: 'destination-circles',
  type: 'circle' as const,
  filter: ['!', ['get', 'isOrigin']] as any,
  paint: {
    'circle-radius': 7,
    'circle-color': ['get', 'color'] as any,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#0a1628',
    'circle-opacity': 0.9,
  },
};

// Origin (home base) — bold, large, unmistakable
export const originCircleLayer = {
  id: 'origin-circle',
  type: 'circle' as const,
  filter: ['get', 'isOrigin'] as any,
  paint: {
    'circle-radius': 16,
    'circle-color': ['get', 'color'] as any,
    'circle-stroke-width': 4,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 1,
  },
};

// Origin pulsing ring (outer glow)
export const originRingLayer = {
  id: 'origin-ring',
  type: 'circle' as const,
  filter: ['get', 'isOrigin'] as any,
  paint: {
    'circle-radius': 24,
    'circle-color': 'transparent',
    'circle-stroke-width': 3,
    'circle-stroke-color': '#3b82f6',
    'circle-opacity': 0.4,
  },
};

// Name labels near destination circles (non-origin)
export const destinationLabelLayer = {
  id: 'destination-labels',
  type: 'symbol' as const,
  filter: ['!', ['get', 'isOrigin']] as any,
  layout: {
    'text-field': ['get', 'name'] as any,
    'text-size': 9,
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
    'text-anchor': 'top' as const,
    'text-offset': [0, 1.2] as any,
    'text-allow-overlap': false,
    'text-ignore-placement': false,
  },
  paint: {
    'text-color': '#ffffff',
    'text-halo-color': '#0a1628',
    'text-halo-width': 1,
  },
};

// Origin name label below the circle
export const originNameLayer = {
  id: 'origin-name',
  type: 'symbol' as const,
  filter: ['get', 'isOrigin'] as any,
  layout: {
    'text-field': ['get', 'name'] as any,
    'text-size': 12,
    'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
    'text-anchor': 'top' as const,
    'text-offset': [0, 1.8] as any,
    'text-allow-overlap': true,
    'text-ignore-placement': true,
  },
  paint: {
    'text-color': '#ffffff',
    'text-halo-color': '#0a1628',
    'text-halo-width': 1.5,
  },
};

// Ferry routes + shipping lanes overlay
export const ferryLineLayer = {
  id: 'ferry-routes',
  type: 'line' as const,
  paint: {
    'line-color': ['get', 'color'] as any,
    'line-width': ['get', 'lineWidth'] as any,
    'line-opacity': ['get', 'opacity'] as any,
    'line-dasharray': [4, 4] as any,
  },
};

export const ferryLabelLayer = {
  id: 'ferry-labels',
  type: 'symbol' as const,
  layout: {
    'symbol-placement': 'line' as const,
    'text-field': ['get', 'name'] as any,
    'text-size': 10,
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'] as any,
    'text-offset': [0, -0.8] as any,
    'text-allow-overlap': false,
  },
  paint: {
    'text-color': '#ef4444',
    'text-halo-color': '#0a1628',
    'text-halo-width': 1,
  },
};

// Navigation hazard markers
export const hazardCircleLayer = {
  id: 'hazard-markers',
  type: 'circle' as const,
  paint: {
    'circle-radius': 6,
    'circle-color': [
      'match', ['get', 'severity'],
      'critical', '#dc2626',
      'warning', '#f59e0b',
      'caution', '#d4a853',
      '#f59e0b', // default
    ] as any,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#0a1628',
    'circle-opacity': 0.9,
  },
};

export const hazardLabelLayer = {
  id: 'hazard-labels',
  type: 'symbol' as const,
  layout: {
    'text-field': ['get', 'name'] as any,
    'text-size': 9,
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
    'text-anchor': 'top' as const,
    'text-offset': [0, 1.0] as any,
    'text-allow-overlap': false,
  },
  paint: {
    'text-color': '#f59e0b',
    'text-halo-color': '#0a1628',
    'text-halo-width': 1,
  },
};

// Bay event markers — colored by sentiment (avoid=red, caution=amber, fun=green)
export const eventCircleLayer = {
  id: 'event-markers',
  type: 'circle' as const,
  paint: {
    'circle-radius': 8,
    'circle-color': ['get', 'color'] as any,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#0a1628',
    'circle-opacity': 0.85,
  },
};

export const eventLabelLayer = {
  id: 'event-labels',
  type: 'symbol' as const,
  layout: {
    'text-field': ['get', 'name'] as any,
    'text-size': 9,
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
    'text-anchor': 'top' as const,
    'text-offset': [0, 1.2] as any,
    'text-allow-overlap': false,
  },
  paint: {
    'text-color': ['get', 'color'] as any,
    'text-halo-color': '#0a1628',
    'text-halo-width': 1,
  },
};

// SUP radius circle — shows practical paddling range around origin
export const supRadiusLayer = {
  id: 'sup-radius',
  type: 'circle' as const,
  paint: {
    // ~2.4km radius (1.5mi) at map zoom. Mapbox 'circle-radius' is in pixels,
    // so we use a fill layer with a GeoJSON polygon instead. This is a fallback
    // definition; the actual radius is rendered as a polygon in useMapData.
    'circle-radius': 1,
    'circle-color': '#14b8a6',
    'circle-opacity': 0,
  },
};

export const supRadiusFillLayer = {
  id: 'sup-radius-fill',
  type: 'fill' as const,
  paint: {
    'fill-color': '#14b8a6',
    'fill-opacity': 0.08,
  },
};

export const supRadiusBorderLayer = {
  id: 'sup-radius-border',
  type: 'line' as const,
  paint: {
    'line-color': '#14b8a6',
    'line-width': 2,
    'line-opacity': 0.4,
    'line-dasharray': [4, 4] as any,
  },
};

// Zone comfort overlay — semi-transparent colored polygons
export const zoneOverlayFillLayer = {
  id: 'zone-overlay-fill',
  type: 'fill' as const,
  paint: {
    'fill-color': ['get', 'color'] as any,
    'fill-opacity': 0.12,
  },
};

export const zoneOverlayBorderLayer = {
  id: 'zone-overlay-border',
  type: 'line' as const,
  paint: {
    'line-color': '#ffffff',
    'line-width': 1,
    'line-opacity': 0.2,
  },
};

export const zoneOverlayLabelLayer = {
  id: 'zone-overlay-labels',
  type: 'symbol' as const,
  layout: {
    'text-field': ['concat', ['get', 'zoneName'], '\n', ['get', 'tierLabel']] as any,
    'text-size': 11,
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
    'text-allow-overlap': true,
  },
  paint: {
    'text-color': ['get', 'color'] as any,
    'text-halo-color': '#0a1628',
    'text-halo-width': 1.5,
    'text-opacity': 0.9,
  },
};

// Wind arrow indicators at zone centroids
export const windArrowLayer = {
  id: 'wind-arrows',
  type: 'symbol' as const,
  layout: {
    'icon-image': 'arrow',
    'icon-size': 0.8,
    'icon-rotate': ['get', 'rotation'] as any,
    'icon-allow-overlap': true,
    'icon-rotation-alignment': 'map' as const,
    'text-field': ['get', 'windLabel'] as any,
    'text-size': 10,
    'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
    'text-offset': [0, 1.5] as any,
    'text-allow-overlap': true,
  },
  paint: {
    'icon-color': ['get', 'color'] as any,
    'text-color': ['get', 'color'] as any,
    'text-halo-color': '#0a1628',
    'text-halo-width': 1.5,
  },
};
