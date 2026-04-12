/**
 * Zone boundaries for the Salish Sea region (Puget Sound + San Juan Islands + Gulf Islands).
 *
 * Each zone represents a distinct body of water with its own weather personality.
 * A kayaker in the San Juans faces completely different conditions than one in South Sound.
 *
 * Coordinates are [lng, lat] and each polygon is a closed ring (first = last point).
 * All vertices must be in WATER, not on land.
 */

export interface ZoneBoundary {
  zoneId: string;
  polygon: [number, number][]; // [lng, lat] ring (closed)
}

export const zoneBoundaries: ZoneBoundary[] = [
  {
    // Central Sound: Elliott Bay (Seattle) south to Tacoma Narrows
    // Protected by surrounding hills, but convergence zone weather creates localized squalls
    zoneId: 'central_sound',
    polygon: [
      [-122.45, 47.72],
      [-122.40, 47.70],
      [-122.35, 47.65],
      [-122.30, 47.60],
      [-122.33, 47.55],
      [-122.38, 47.50],
      [-122.42, 47.45],
      [-122.48, 47.40],
      [-122.55, 47.35],
      [-122.60, 47.38],
      [-122.58, 47.45],
      [-122.55, 47.52],
      [-122.52, 47.58],
      [-122.50, 47.65],
      [-122.48, 47.70],
      [-122.45, 47.72],
    ],
  },
  {
    // South Sound: Tacoma Narrows south to Olympia
    // Very protected, light winds, shallow areas, warm (relatively) water
    zoneId: 'south_sound',
    polygon: [
      [-122.55, 47.35],
      [-122.48, 47.32],
      [-122.45, 47.28],
      [-122.50, 47.20],
      [-122.55, 47.12],
      [-122.60, 47.08],
      [-122.68, 47.05],
      [-122.75, 47.08],
      [-122.78, 47.15],
      [-122.75, 47.22],
      [-122.70, 47.28],
      [-122.65, 47.32],
      [-122.60, 47.35],
      [-122.55, 47.35],
    ],
  },
  {
    // Admiralty Inlet: Port Townsend, Whidbey Island, Deception Pass approach
    // Strong tidal currents (up to 3.6kt at narrows), funneling wind effect
    zoneId: 'admiralty_inlet',
    polygon: [
      [-122.80, 48.20],
      [-122.70, 48.15],
      [-122.60, 48.10],
      [-122.50, 48.05],
      [-122.45, 47.95],
      [-122.42, 47.85],
      [-122.45, 47.75],
      [-122.50, 47.72],
      [-122.58, 47.75],
      [-122.65, 47.80],
      [-122.72, 47.85],
      [-122.80, 47.92],
      [-122.85, 48.00],
      [-122.88, 48.08],
      [-122.85, 48.15],
      [-122.80, 48.20],
    ],
  },
  {
    // San Juan Islands (US): Friday Harbor, Orcas Island, Lopez Island
    // Complex tidal channels, fog, whale watching, island lee effects
    zoneId: 'san_juan_islands',
    polygon: [
      [-123.20, 48.65],
      [-123.10, 48.60],
      [-122.95, 48.55],
      [-122.80, 48.50],
      [-122.70, 48.45],
      [-122.65, 48.40],
      [-122.60, 48.38],
      [-122.65, 48.32],
      [-122.75, 48.30],
      [-122.85, 48.32],
      [-122.95, 48.35],
      [-123.05, 48.40],
      [-123.15, 48.48],
      [-123.22, 48.55],
      [-123.25, 48.60],
      [-123.20, 48.65],
    ],
  },
  {
    // Gulf Islands (Canada): Salt Spring, Galiano, Mayne, Pender, Saturna
    // Similar to San Juans but under Canadian jurisdiction (ECCC weather, CHS tides)
    // Strong tidal currents in Active Pass (up to 8 knots!) and Porlier Pass
    zoneId: 'gulf_islands',
    polygon: [
      [-123.60, 49.00],
      [-123.50, 48.95],
      [-123.40, 48.90],
      [-123.30, 48.85],
      [-123.20, 48.80],
      [-123.10, 48.75],
      [-123.05, 48.70],
      [-123.10, 48.65],
      [-123.20, 48.65],
      [-123.30, 48.68],
      [-123.40, 48.72],
      [-123.50, 48.78],
      [-123.55, 48.85],
      [-123.58, 48.92],
      [-123.60, 49.00],
    ],
  },
  {
    // Hood Canal: Entire canal from the Great Bend to the Bridge
    // Very protected, unique water chemistry (sometimes low oxygen), light winds
    zoneId: 'hood_canal',
    polygon: [
      [-122.90, 47.85],
      [-122.85, 47.80],
      [-122.82, 47.72],
      [-122.85, 47.65],
      [-122.88, 47.55],
      [-122.92, 47.45],
      [-122.98, 47.38],
      [-123.05, 47.35],
      [-123.12, 47.40],
      [-123.10, 47.48],
      [-123.05, 47.55],
      [-123.00, 47.62],
      [-122.98, 47.70],
      [-122.95, 47.78],
      [-122.92, 47.83],
      [-122.90, 47.85],
    ],
  },
  {
    // Strait of Juan de Fuca: Victoria to Port Angeles
    // Open ocean exposure from the Pacific, large swells, commercial shipping
    zoneId: 'strait_juan_de_fuca',
    polygon: [
      [-124.00, 48.45],
      [-123.80, 48.40],
      [-123.60, 48.38],
      [-123.40, 48.35],
      [-123.20, 48.32],
      [-123.00, 48.30],
      [-122.80, 48.28],
      [-122.70, 48.22],
      [-122.75, 48.15],
      [-122.85, 48.12],
      [-123.00, 48.15],
      [-123.20, 48.18],
      [-123.40, 48.20],
      [-123.60, 48.22],
      [-123.80, 48.25],
      [-124.00, 48.30],
      [-124.10, 48.35],
      [-124.05, 48.42],
      [-124.00, 48.45],
    ],
  },
];
