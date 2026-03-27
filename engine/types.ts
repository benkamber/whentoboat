// ============================================
// WhenToBoat Engine Types
// City-agnostic — ZERO location-specific references
// ============================================

// --- Activity ---

export type ActivityType = 'kayak' | 'sup' | 'powerboat_cruise' | 'casual_sail';

export interface ActivityProfile {
  id: ActivityType;
  name: string;
  description: string;
  icon: string;
  idealWindRange: [number, number]; // [min, max] in knots
  maxWind: number; // absolute max in knots
  maxWave: number; // max wave height in feet
  vesselType: VesselType;
  preferredZoneTypes: string[]; // zone characteristic tags
  beforeYouGo: BeforeYouGoItem[];
  notes: string;
  maxShoreDistanceM: number | null; // max distance from shore in meters (null = unlimited)
  maxRangeRoundTripMi: number | null; // max round trip range in miles (null = vessel-limited)
  requiresOpenWaterCrossing: boolean; // if false, warn when route crosses >500m of open water
}

// --- Vessel ---

export type VesselType = 'kayak' | 'sup' | 'powerboat' | 'sailboat';
// Note: 'sup' was originally grouped with 'kayak' but is now separate due to
// significantly different wind tolerance, wave limits, and near-shore requirements

export interface VesselProfile {
  type: VesselType;
  name: string;
  loa: number; // length overall in feet
  cruiseSpeed: number; // mph
  fuelCapacity: number | null; // gallons, null for human-powered
  gph: number | null; // gallons per hour at cruise, null for human-powered
  draft: number; // feet
  maxEnduranceHours: number | null; // for human-powered craft
}

// --- Location ---

export interface Destination {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  zone: string; // zone ID this destination belongs to
  area: string; // geographic area grouping
  dockInfo: string;
  activityTags: ActivityType[];
  launchRamp: LaunchRamp | null;
  minDepth: number | null; // minimum depth at MLLW in feet, null if unknown
  notes: string;
  rentalLinks?: { name: string; url: string; type: string }[];
}

export interface LaunchRamp {
  name: string;
  type: 'public' | 'private' | 'club';
  hours: string;
  fee: string;
  parking: string;
  maxBoatLength: number | null; // feet
  source: string; // data authority (e.g., "CA Division of Boating & Waterways")
}

// --- Zones ---

export interface Zone {
  id: string;
  name: string;
  characteristics: string;
  monthlyConditions: MonthlyConditions[];
}

export interface MonthlyConditions {
  month: number; // 0-11
  am: ZoneConditions;
  pm: ZoneConditions;
}

export interface ZoneConditions {
  windKts: number;
  waveHtFt: number;
  wavePeriodS: number;
  comfort: number; // 1-10 general comfort baseline
  // Extended conditions (optional — filled from forecast or seasonal data)
  waterTempF?: number; // SF Bay typically 50-65°F
  airTempF?: number; // air temperature
  currentKts?: number; // tidal current speed
  currentDirDeg?: number; // tidal current direction
  visibilityMi?: number; // fog/visibility in miles
  tideFt?: number; // tide height above MLLW
  tidePhase?: 'flood' | 'ebb' | 'slack_high' | 'slack_low';
}

/**
 * Full environmental conditions for scoring — combines zone data with forecast.
 * This is what the scoring engine uses to compute comfort.
 */
export interface FullConditions {
  windKts: number;
  windDirDeg: number;
  waveHtFt: number;
  wavePeriodS: number;
  waterTempF: number;
  airTempF: number;
  currentKts: number;
  currentDirDeg: number;
  visibilityMi: number;
  tideFt: number;
  tidePhase: 'flood' | 'ebb' | 'slack_high' | 'slack_low';
  // Source flags
  isLiveForecast: boolean; // true = from Open-Meteo, false = historical average
  isMissingWaveData: boolean;
}

// --- Scoring ---

export interface ScoreRange {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface RiskFactor {
  factor: string; // e.g., "Afternoon wind buildup"
  severity: 'low' | 'medium' | 'high';
  description: string; // e.g., "Central Bay typically builds from 5 to 25 kts between 10 AM and 2 PM"
}

export interface ScoredRoute {
  originId: string;
  destinationId: string;
  score: number; // P50 — the headline number (1-10)
  scoreRange: ScoreRange;
  distance: number; // statute miles
  transitMinutes: number;
  fuelGallons: number | null;
  inRange: boolean;
  draftClear: boolean;
  draftWarning: string | null;
  variabilityWarning: string | null;
  riskFactors: RiskFactor[];
  verifyLinks: VerifyLink[];
  beforeYouGo: BeforeYouGoItem[];
  alternatives: ScoredRouteAlternative[];
}

export interface ScoredRouteAlternative {
  destinationId: string;
  destinationName: string;
  score: number;
  distance: number;
  transitMinutes: number;
  reason: string; // e.g., "Sheltered from afternoon westerlies"
}

// --- Trajectory ---

export interface TrajectoryAnalysis {
  origin: Destination;
  destination: Destination;
  distance: number;
  legs: TrajectoryLeg[];
  overallScore: number; // min(leg scores) — bottleneck rule
  scoreRange: ScoreRange;
  transitMinutes: number;
  fuelGallons: number | null;
  inRange: boolean;
  departureWindow: TimeWindow;
  returnWindow: TimeWindow;
  hourlyProfile: HourlyScore[];
  monthlyProfile: MonthlyScore[];
  warnings: string[];
  riskFactors: RiskFactor[];
  verifyLinks: VerifyLink[];
  beforeYouGo: BeforeYouGoItem[];
  alternatives: ScoredRouteAlternative[];
}

export interface TrajectoryLeg {
  zone: Zone;
  distanceInZone: number;
  wind: number;
  waveHeight: number;
  wavePeriod: number;
  score: number;
  isBottleneck: boolean;
}

export interface TimeWindow {
  start: number; // hour (e.g., 8)
  end: number; // hour (e.g., 12)
  label: string; // e.g., "8:00 AM – 12:00 PM"
}

export interface HourlyScore {
  hour: number; // 5-22
  score: number;
  wind: number;
  waveHeight: number;
  label: string; // e.g., "8 AM"
}

export interface MonthlyScore {
  month: number; // 0-11
  amScore: number;
  pmScore: number;
  bestScore: number;
  label: string; // e.g., "Sep"
}

// --- Safety ---

export interface VerifyLink {
  label: string; // e.g., "NOAA SF Bay Forecast"
  url: string;
  type: 'forecast' | 'buoy' | 'tide' | 'current' | 'wind';
}

export interface BeforeYouGoItem {
  text: string;
  url: string | null;
  activityTypes: ActivityType[] | 'all';
}

// --- City (top-level data container) ---

export interface City {
  id: string;
  name: string;
  region: string;
  bounds: {
    sw: [number, number]; // [lat, lng]
    ne: [number, number];
  };
  center: [number, number]; // [lat, lng]
  defaultZoom: number;
  destinations: Destination[];
  zones: Zone[];
  distances: DistanceMatrix;
  routingRules: CrossZoneRule[];
  verifyLinks: VerifyLink[]; // city-wide verify links
  sunsetData: MonthlySunset[];
  dataSources: DataSource[];
}

export type DistanceMatrix = Record<string, number>; // "originId-destId" → miles

export interface CrossZoneRule {
  fromAreas: string[];
  toAreas: string[];
  transitZones: string[]; // zone IDs that must be traversed
}

export interface MonthlySunset {
  month: number; // 0-11
  sunsetTime: string; // e.g., "7:42 PM"
  goldenHourStart: string;
  glassOffWindow: string; // e.g., "6:30–8:00 PM"
}

export interface DataSource {
  name: string;
  url: string;
  authority: string;
  updateFrequency: string;
  description: string;
}

// --- Filter State ---

export interface FilterState {
  activity: ActivityType;
  month: number; // 0-11
  hour: number; // 5-22
  maxWind: number;
  minWind: number;
  maxWave: number;
  maxTransitMinutes: number;
  minScore: number;
}
