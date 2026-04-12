/**
 * City configuration type for multi-region scaling.
 *
 * Each city/region needs these data layers to function:
 * - Destinations (marinas, launch ramps, popular spots)
 * - Weather zones with monthly conditions
 * - NOAA station mappings (buoys, tide, current)
 * - NWS marine forecast zone IDs
 * - Coastline polygons for the map
 *
 * The goal: minimize manual curation per city by auto-generating
 * as much as possible from NOAA, OSM, and Open-Meteo.
 *
 * Auto-generatable (zero manual work per city):
 * - Monthly wind/wave/temp averages from 5yr NDBC buoy history
 * - Destinations from OSM Overpass (leisure=marina, leisure=slipway)
 * - Coastline polygons from OSM land-polygons
 * - Tide predictions from CO-OPS
 * - Marine forecast zones from NWS
 *
 * Requires manual curation:
 * - Zone boundary fine-tuning (auto-generated from NWS zones, manual refinement)
 * - Dock details (fees, hours, amenities, restaurants)
 * - Events (regattas, parades — region-specific)
 * - Activity-specific notes (local knowledge)
 * - Species-season data for fishing
 */

export interface CityConfig {
  id: string;                    // e.g., 'sf-bay', 'puget-sound', 'miami'
  name: string;                  // e.g., 'San Francisco Bay', 'Puget Sound'
  region: string;                // e.g., 'California', 'Washington', 'Florida'
  center: [number, number];      // [lat, lng] for map center
  defaultZoom: number;           // Mapbox zoom level
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

  /** NOAA NDBC buoy station IDs for real-time observations */
  buoyStations: string[];
  /** NOAA CO-OPS tide prediction station ID (primary) */
  tideStation: string;
  /** NOAA CO-OPS current prediction station IDs */
  currentStations: string[];
  /** NWS marine forecast zone IDs for alerts */
  nwsZones: string[];

  /** Activities supported in this region */
  activities: string[];          // subset of ActivityType

  /** Unique regional challenges */
  notes: string;

  /** Data completeness flags */
  hasVerifiedRoutes: boolean;
  hasEvents: boolean;
  hasFishingData: boolean;
  hasDockDetails: boolean;

  /** Auto-generation status */
  generatedFrom: 'manual' | 'auto-noaa' | 'hybrid';
  lastUpdated: string;           // ISO date
}

/**
 * Registry of all configured cities.
 * Start with SF Bay, expand to target markets.
 */
export const cityRegistry: CityConfig[] = [
  {
    id: 'sf-bay',
    name: 'San Francisco Bay',
    region: 'California',
    center: [37.8, -122.4],
    defaultZoom: 11,
    bbox: [-122.7, 37.4, -122.0, 38.1],
    buoyStations: ['46026', '46237', 'FTPC1', 'TIBC1', 'RCMC1', 'AAMC1', 'OBXC1'],
    tideStation: '9414290',
    currentStations: ['SFB1201', 'SFB1203', 'SFB1205', 'PCT0261', 'SFB1212'],
    nwsZones: ['PZZ530', 'PZZ531', 'PZZ545'],
    activities: ['kayak', 'sup', 'powerboat_cruise', 'casual_sail', 'fishing_boat', 'fishing_kayak'],
    notes: 'Strong afternoon thermal winds, Golden Gate current up to 5kt',
    hasVerifiedRoutes: true,
    hasEvents: true,
    hasFishingData: true,
    hasDockDetails: true,
    generatedFrom: 'manual',
    lastUpdated: '2026-04-11',
  },
  // Future cities — populated by research + auto-generation scripts
  {
    id: 'puget-sound',
    name: 'Puget Sound',
    region: 'Washington',
    center: [47.6, -122.4],
    defaultZoom: 10,
    bbox: [-123.2, 47.0, -122.0, 48.8],
    buoyStations: [], // TBD from research
    tideStation: '9447130', // Seattle
    currentStations: [], // TBD — ~135 stations from 2014-2017 ADCP survey
    nwsZones: ['PZZ131', 'PZZ132', 'PZZ133'],
    activities: ['kayak', 'sup', 'powerboat_cruise', 'casual_sail', 'fishing_boat'],
    notes: 'Convergence Zone weather, extreme tidal ranges, San Juan Islands',
    hasVerifiedRoutes: false,
    hasEvents: false,
    hasFishingData: false,
    hasDockDetails: false,
    generatedFrom: 'auto-noaa',
    lastUpdated: '2026-04-11',
  },
  {
    id: 'miami',
    name: 'Miami & Biscayne Bay',
    region: 'Florida',
    center: [25.76, -80.19],
    defaultZoom: 11,
    bbox: [-80.5, 25.3, -79.8, 26.0],
    buoyStations: [], // TBD
    tideStation: '8723214', // Virginia Key
    currentStations: [], // TBD
    nwsZones: ['AMZ610', 'AMZ630', 'AMZ650'],
    activities: ['powerboat_cruise', 'fishing_boat', 'casual_sail', 'kayak', 'sup'],
    notes: 'Gulf Stream proximity, afternoon thunderstorms May-Oct, year-round season',
    hasVerifiedRoutes: false,
    hasEvents: false,
    hasFishingData: false,
    hasDockDetails: false,
    generatedFrom: 'auto-noaa',
    lastUpdated: '2026-04-11',
  },
  {
    id: 'san-diego',
    name: 'San Diego Bay',
    region: 'California',
    center: [32.71, -117.16],
    defaultZoom: 12,
    bbox: [-117.5, 32.5, -116.9, 33.0],
    buoyStations: [], // TBD
    tideStation: '9410170', // San Diego
    currentStations: [], // TBD
    nwsZones: ['PZZ750', 'PZZ775'],
    activities: ['casual_sail', 'powerboat_cruise', 'fishing_boat', 'kayak', 'sup'],
    notes: 'Best year-round sailing climate in US, kelp beds, La Jolla marine reserve',
    hasVerifiedRoutes: false,
    hasEvents: false,
    hasFishingData: false,
    hasDockDetails: false,
    generatedFrom: 'auto-noaa',
    lastUpdated: '2026-04-11',
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles & Marina del Rey',
    region: 'California',
    center: [33.98, -118.46],
    defaultZoom: 11,
    bbox: [-118.8, 33.6, -118.1, 34.1],
    buoyStations: [], // TBD
    tideStation: '9410660', // Los Angeles
    currentStations: [], // TBD
    nwsZones: ['PZZ650', 'PZZ670'],
    activities: ['powerboat_cruise', 'casual_sail', 'fishing_boat', 'kayak', 'sup'],
    notes: 'Santa Ana winds, Channel Islands offshore, Catalina day trips',
    hasVerifiedRoutes: false,
    hasEvents: false,
    hasFishingData: false,
    hasDockDetails: false,
    generatedFrom: 'auto-noaa',
    lastUpdated: '2026-04-11',
  },
];

/** Get a city config by ID */
export function getCityConfig(id: string): CityConfig | undefined {
  return cityRegistry.find(c => c.id === id);
}

/** Get all cities that have complete data */
export function getReadyCities(): CityConfig[] {
  return cityRegistry.filter(c => c.hasVerifiedRoutes || c.generatedFrom === 'auto-noaa');
}
