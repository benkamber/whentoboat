/**
 * SF Bay seasonal environmental data beyond wind/waves.
 * This supplements zone data with water temperature, air temperature,
 * visibility (fog), and typical current patterns.
 *
 * Sources:
 * - Water temp: NOAA CO-OPS stations (Alameda 9414750, Richmond 9414863)
 * - Air temp: NWS SF Bay Area climatology
 * - Visibility: SFO ASOS historical, NDBC station visibility data
 * - Current: CO-OPS current predictions (Golden Gate SFB1201)
 */

export interface SeasonalConditions {
  month: number; // 0-11
  waterTempF: number; // average bay water temperature
  airTempHighF: number; // average daytime high
  airTempLowF: number; // average morning low
  fogProbabilityAM: number; // 0-1, probability of morning fog
  fogProbabilityPM: number; // 0-1, probability of afternoon fog
  typicalVisibilityAM_Mi: number; // average AM visibility in miles
  typicalVisibilityPM_Mi: number; // average PM visibility
  goldenGateMaxEbbKts: number; // typical max ebb current at Golden Gate
  goldenGateMaxFloodKts: number; // typical max flood current
  raccoonStraitMaxKts: number; // typical max current at Raccoon Strait
  daylightHours: number; // hours of daylight
}

// SF Bay monthly environmental averages
// Data from NOAA CO-OPS, NWS, and SFO ASOS historical records
export const seasonalConditions: SeasonalConditions[] = [
  {
    month: 0, // January
    waterTempF: 52, airTempHighF: 57, airTempLowF: 46,
    fogProbabilityAM: 0.15, fogProbabilityPM: 0.05,
    typicalVisibilityAM_Mi: 8, typicalVisibilityPM_Mi: 10,
    goldenGateMaxEbbKts: 4.5, goldenGateMaxFloodKts: 3.2,
    raccoonStraitMaxKts: 2.5, daylightHours: 9.8,
  },
  {
    month: 1, // February
    waterTempF: 52, airTempHighF: 60, airTempLowF: 47,
    fogProbabilityAM: 0.12, fogProbabilityPM: 0.05,
    typicalVisibilityAM_Mi: 9, typicalVisibilityPM_Mi: 10,
    goldenGateMaxEbbKts: 4.3, goldenGateMaxFloodKts: 3.0,
    raccoonStraitMaxKts: 2.4, daylightHours: 10.8,
  },
  {
    month: 2, // March
    waterTempF: 53, airTempHighF: 63, airTempLowF: 48,
    fogProbabilityAM: 0.15, fogProbabilityPM: 0.05,
    typicalVisibilityAM_Mi: 8, typicalVisibilityPM_Mi: 10,
    goldenGateMaxEbbKts: 4.5, goldenGateMaxFloodKts: 3.2,
    raccoonStraitMaxKts: 2.5, daylightHours: 12.0,
  },
  {
    month: 3, // April
    waterTempF: 54, airTempHighF: 65, airTempLowF: 49,
    fogProbabilityAM: 0.20, fogProbabilityPM: 0.08,
    typicalVisibilityAM_Mi: 7, typicalVisibilityPM_Mi: 10,
    goldenGateMaxEbbKts: 4.3, goldenGateMaxFloodKts: 3.0,
    raccoonStraitMaxKts: 2.3, daylightHours: 13.3,
  },
  {
    month: 4, // May
    waterTempF: 56, airTempHighF: 66, airTempLowF: 51,
    fogProbabilityAM: 0.35, fogProbabilityPM: 0.10,
    typicalVisibilityAM_Mi: 5, typicalVisibilityPM_Mi: 9,
    goldenGateMaxEbbKts: 4.0, goldenGateMaxFloodKts: 2.8,
    raccoonStraitMaxKts: 2.2, daylightHours: 14.3,
  },
  {
    month: 5, // June
    waterTempF: 58, airTempHighF: 70, airTempLowF: 53,
    fogProbabilityAM: 0.45, fogProbabilityPM: 0.12,
    typicalVisibilityAM_Mi: 3, typicalVisibilityPM_Mi: 8,
    goldenGateMaxEbbKts: 3.8, goldenGateMaxFloodKts: 2.7,
    raccoonStraitMaxKts: 2.0, daylightHours: 14.8,
  },
  {
    month: 6, // July
    waterTempF: 59, airTempHighF: 71, airTempLowF: 54,
    fogProbabilityAM: 0.50, fogProbabilityPM: 0.10,
    typicalVisibilityAM_Mi: 2, typicalVisibilityPM_Mi: 8,
    goldenGateMaxEbbKts: 3.5, goldenGateMaxFloodKts: 2.5,
    raccoonStraitMaxKts: 1.8, daylightHours: 14.6,
  },
  {
    month: 7, // August
    waterTempF: 61, airTempHighF: 71, airTempLowF: 55,
    fogProbabilityAM: 0.40, fogProbabilityPM: 0.08,
    typicalVisibilityAM_Mi: 3, typicalVisibilityPM_Mi: 9,
    goldenGateMaxEbbKts: 3.5, goldenGateMaxFloodKts: 2.5,
    raccoonStraitMaxKts: 1.8, daylightHours: 13.8,
  },
  {
    month: 8, // September — BEST MONTH
    waterTempF: 63, airTempHighF: 74, airTempLowF: 56,
    fogProbabilityAM: 0.15, fogProbabilityPM: 0.03,
    typicalVisibilityAM_Mi: 8, typicalVisibilityPM_Mi: 10,
    goldenGateMaxEbbKts: 3.8, goldenGateMaxFloodKts: 2.8,
    raccoonStraitMaxKts: 2.0, daylightHours: 12.5,
  },
  {
    month: 9, // October
    waterTempF: 62, airTempHighF: 72, airTempLowF: 54,
    fogProbabilityAM: 0.10, fogProbabilityPM: 0.03,
    typicalVisibilityAM_Mi: 9, typicalVisibilityPM_Mi: 10,
    goldenGateMaxEbbKts: 4.0, goldenGateMaxFloodKts: 3.0,
    raccoonStraitMaxKts: 2.2, daylightHours: 11.3,
  },
  {
    month: 10, // November
    waterTempF: 57, airTempHighF: 63, airTempLowF: 49,
    fogProbabilityAM: 0.10, fogProbabilityPM: 0.05,
    typicalVisibilityAM_Mi: 9, typicalVisibilityPM_Mi: 10,
    goldenGateMaxEbbKts: 4.3, goldenGateMaxFloodKts: 3.0,
    raccoonStraitMaxKts: 2.3, daylightHours: 10.2,
  },
  {
    month: 11, // December
    waterTempF: 53, airTempHighF: 57, airTempLowF: 45,
    fogProbabilityAM: 0.12, fogProbabilityPM: 0.05,
    typicalVisibilityAM_Mi: 8, typicalVisibilityPM_Mi: 10,
    goldenGateMaxEbbKts: 4.5, goldenGateMaxFloodKts: 3.2,
    raccoonStraitMaxKts: 2.5, daylightHours: 9.5,
  },
];

/**
 * Get seasonal conditions for a given month.
 */
export function getSeasonalConditions(month: number): SeasonalConditions {
  return seasonalConditions[month] ?? seasonalConditions[0];
}
