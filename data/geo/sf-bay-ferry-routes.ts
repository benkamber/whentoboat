/**
 * SF Bay Ferry Routes — Safety Overlay
 *
 * These are the approximate routes of ferry services operating on SF Bay.
 * Ferries travel at 25-35 knots and cannot stop quickly. Kayaks and SUPs
 * are nearly invisible to ferry crews, especially in fog.
 *
 * Sources:
 * - Golden Gate Ferry: Sausalito/Larkspur ↔ SF Ferry Building
 * - WETA/SF Bay Ferry: Oakland/Alameda/Richmond/Vallejo ↔ SF
 * - Blue & Gold Fleet: SF ↔ Angel Island/Tiburon/Alcatraz
 *
 * Coordinates are [lng, lat] (GeoJSON order).
 */

export interface FerryRoute {
  name: string;
  operator: string;
  coordinates: [number, number][];
  speedKts: number;
  frequency: string; // e.g., "every 30 min"
}

export const ferryRoutes: FerryRoute[] = [
  {
    name: 'Sausalito Ferry',
    operator: 'Golden Gate Ferry',
    coordinates: [
      [-122.4189, 37.7956], // SF Ferry Building
      [-122.4250, 37.8080], // Mid-bay
      [-122.4700, 37.8510], // Sausalito terminal
    ],
    speedKts: 25,
    frequency: 'Every 30-60 min',
  },
  {
    name: 'Larkspur Ferry',
    operator: 'Golden Gate Ferry',
    coordinates: [
      [-122.4189, 37.7956], // SF Ferry Building
      [-122.4350, 37.8200], // Mid-bay turn
      [-122.4750, 37.8600], // Pass Richardson Bay
      [-122.5095, 37.9455], // Larkspur terminal
    ],
    speedKts: 30,
    frequency: 'Every 30-60 min (commute)',
  },
  {
    name: 'Oakland/Alameda Ferry',
    operator: 'SF Bay Ferry (WETA)',
    coordinates: [
      [-122.4189, 37.7956], // SF Ferry Building
      [-122.3800, 37.7900], // Mid-bay
      [-122.3400, 37.7950], // Jack London Square
    ],
    speedKts: 28,
    frequency: 'Every 30 min',
  },
  {
    name: 'Alameda Harbor Bay Ferry',
    operator: 'SF Bay Ferry (WETA)',
    coordinates: [
      [-122.4189, 37.7956], // SF Ferry Building
      [-122.3700, 37.7800], // Mid-bay
      [-122.3100, 37.7650], // Harbor Bay
    ],
    speedKts: 28,
    frequency: 'Commute hours only',
  },
  {
    name: 'Richmond Ferry',
    operator: 'SF Bay Ferry (WETA)',
    coordinates: [
      [-122.4189, 37.7956], // SF Ferry Building
      [-122.4000, 37.8200], // Through Central Bay
      [-122.3800, 37.8800], // Richmond
      [-122.3570, 37.9130], // Richmond terminal
    ],
    speedKts: 30,
    frequency: 'Every 60 min',
  },
  {
    name: 'Vallejo Ferry',
    operator: 'SF Bay Ferry (WETA)',
    coordinates: [
      [-122.4189, 37.7956], // SF Ferry Building
      [-122.3900, 37.8300], // Through Central Bay
      [-122.3600, 37.8900], // Through San Pablo
      [-122.2590, 37.9480], // Carquinez
      [-122.2600, 38.0990], // Vallejo terminal
    ],
    speedKts: 34,
    frequency: 'Every 60 min',
  },
  {
    name: 'Angel Island Ferry',
    operator: 'Blue & Gold Fleet',
    coordinates: [
      [-122.4189, 37.7956], // SF Ferry Building (Pier 41)
      [-122.4350, 37.8300], // Mid-bay
      [-122.4330, 37.8636], // Ayala Cove, Angel Island
    ],
    speedKts: 20,
    frequency: 'Seasonal, 4-6 trips/day',
  },
  {
    name: 'Tiburon Ferry',
    operator: 'Blue & Gold Fleet',
    coordinates: [
      [-122.4189, 37.7956], // SF Pier 41
      [-122.4300, 37.8400], // Mid-bay
      [-122.4562, 37.8735], // Tiburon
    ],
    speedKts: 20,
    frequency: 'Seasonal',
  },
  {
    name: 'Alcatraz Ferry',
    operator: 'Alcatraz Cruises',
    coordinates: [
      [-122.4105, 37.8080], // Pier 33
      [-122.4220, 37.8270], // Alcatraz landing
    ],
    speedKts: 15,
    frequency: 'Every 30 min (high season)',
  },
];

/**
 * Major shipping channel — deep water channel through SF Bay.
 * Container ships and tankers follow this channel.
 * Very large vessels with limited maneuverability.
 */
export const shippingChannel: [number, number][] = [
  [-122.5100, 37.8100], // Golden Gate entrance
  [-122.4600, 37.8200], // Inside the Gate
  [-122.4100, 37.8100], // Central Bay
  [-122.3700, 37.8050], // Approach Oakland
  [-122.3400, 37.8000], // Oakland container terminal
];

/**
 * Generate GeoJSON for ferry routes + shipping lanes overlay.
 */
export function ferryRoutesGeoJSON() {
  const features = [
    // Ferry routes
    ...ferryRoutes.map(route => ({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: route.coordinates,
      },
      properties: {
        name: route.name,
        operator: route.operator,
        speedKts: route.speedKts,
        frequency: route.frequency,
        type: 'ferry',
        color: '#ef4444', // danger-red — ferries are hazardous to small craft
        opacity: 0.6,
        lineWidth: 2,
        dashArray: [4, 4],
      },
    })),
    // Shipping channel
    {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: shippingChannel,
      },
      properties: {
        name: 'Main Shipping Channel',
        operator: 'Commercial shipping',
        speedKts: 12,
        frequency: 'Continuous',
        type: 'shipping',
        color: '#f59e0b', // warning-amber — shipping lane
        opacity: 0.4,
        lineWidth: 8,
        dashArray: [0, 0],
      },
    },
  ];

  return {
    type: 'FeatureCollection' as const,
    features,
  };
}
