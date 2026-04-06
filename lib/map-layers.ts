// Mapbox GL layer style constants for the main map view.
// Extracted from app/page.tsx — purely visual configuration, no logic.

export const routeLineLayer = {
  id: 'route-lines',
  type: 'line' as const,
  layout: {
    'line-join': 'round' as const,
    'line-cap': 'butt' as const,
  },
  paint: {
    'line-color': '#22d3ee' as any,
    'line-width': 2 as any,
    'line-opacity': 0.5 as any,
    'line-dasharray': [2, 2] as any,
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

// Non-origin destination circles
export const destinationCircleLayer = {
  id: 'destination-circles',
  type: 'circle' as const,
  filter: ['!', ['get', 'isOrigin']] as any,
  paint: {
    'circle-radius': 7,
    'circle-color': '#14b8a6' as any,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#0a1628',
    'circle-opacity': 0.9,
  },
};

// Origin (home base) — larger with distinct white border
export const originCircleLayer = {
  id: 'origin-circle',
  type: 'circle' as const,
  filter: ['get', 'isOrigin'] as any,
  paint: {
    'circle-radius': 12,
    'circle-color': ['get', 'color'] as any,
    'circle-stroke-width': 3,
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
    'circle-radius': 18,
    'circle-color': 'transparent',
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.3,
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
