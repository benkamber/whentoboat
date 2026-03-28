// ============================================
// NOAA CO-OPS Current Prediction Stations for SF Bay
//
// SAFETY-CRITICAL: These mappings connect each navigational zone to its
// nearest NOAA tidal current prediction station. Tidal currents in SF Bay
// routinely exceed 4 knots at the Golden Gate and 3 knots at Raccoon Strait.
// A kayaker paddling at 3-4 knots CANNOT make headway against max ebb at the
// Gate. Accurate current data is the difference between a safe paddle and
// being swept to sea.
//
// Station IDs are from NOAA CO-OPS current predictions database:
// https://tidesandcurrents.noaa.gov/noaacurrents/Regions
//
// Expert validation finding: The previous approach of estimating currents
// from tide height deltas (estimateCurrentFromTide) was scientifically
// invalid. Tidal current velocity depends on basin geometry, channel
// constrictions, and harmonic constituents — NOT on the rate of water
// level change at a single station. NOAA publishes harmonic current
// predictions specifically for this purpose.
// ============================================

/**
 * Key NOAA CO-OPS tidal current prediction stations for SF Bay.
 * These are the stations we query for real current predictions.
 */
export const CURRENT_STATIONS: Record<string, { id: string; name: string }> = {
  SFB1201: { id: 'SFB1201', name: 'Golden Gate (main channel)' },
  SFB1203: { id: 'SFB1203', name: 'Alcatraz (south side)' },
  SFB1205: { id: 'SFB1205', name: 'Bay Bridge' },
  PCT0261: { id: 'PCT0261', name: 'Fort Point' },
  SFB1212: { id: 'SFB1212', name: 'Raccoon Strait' },
};

/**
 * Map each zone to its nearest NOAA current prediction station.
 *
 * SAFETY NOTE: These assignments are based on which station's predictions
 * are most representative of the currents a boater will encounter in that
 * zone. Some zones (e.g., central_bay) are influenced by multiple current
 * regimes — we use the dominant/most-dangerous station.
 */
export const zoneCurrentStations: Record<string, string> = {
  // Richardson Bay: Raccoon Strait dominates currents entering/exiting the bay
  richardson: 'SFB1212',

  // The Slot (central bay): Golden Gate currents dominate — this is the main
  // flood/ebb channel and the most dangerous area for small craft
  central_bay: 'SFB1201',

  // SF Waterfront: Alcatraz south side station — currents wrap around Alcatraz
  // and affect the entire SF shoreline from Crissy Field to the Ferry Building
  sf_shore: 'SFB1203',

  // East Bay: Bay Bridge station — currents accelerate through bridge pilings
  east_bay: 'SFB1205',

  // North Bay: Raccoon Strait — Angel Island constriction creates strong currents
  // that affect all of the north bay approaches
  north_bay: 'SFB1212',

  // San Pablo Bay: Golden Gate influence — tidal prism drives currents all the way
  // to the Carquinez Strait. Golden Gate station captures the timing/magnitude
  san_pablo: 'SFB1201',

  // South Bay: Bay Bridge influence — tidal exchange through the central bay
  // drives south bay currents with a time lag
  south_bay: 'SFB1205',

  // Ocean South (Half Moon Bay): Golden Gate station — bar crossing currents
  // are driven by the same tidal prism. This is the most dangerous crossing
  // in the region and current data is critical for bar passage timing
  ocean_south: 'SFB1201',
  // North coast uses the same Golden Gate station — all traffic transits the Gate
  ocean_north: 'SFB1201',
};

/**
 * Zones where strait/gate crossings make current data especially critical.
 * When current data is unavailable for these zones, the scoring engine MUST
 * add an explicit warning — defaulting to 0kt would be dangerous.
 *
 * SAFETY: These are zones where tidal currents routinely exceed 2 knots
 * and can create life-threatening conditions for paddlecraft.
 */
export const HIGH_CURRENT_ZONES = [
  'central_bay',  // Golden Gate ebb/flood up to 5.5kt
  'ocean_south',  // Bar crossing — currents create standing waves
  'ocean_north',  // North coast — same Gate transit required
  'san_pablo',    // Carquinez currents + exposed fetch
  'richardson',   // Raccoon Strait constriction
  'north_bay',    // Angel Island current acceleration
] as const;

/**
 * Zones where currents > 2kt AND paddlecraft should receive extra warnings.
 * These are the zones where the combination of current + exposure creates
 * the highest risk for kayak/SUP.
 */
export const CURRENT_WARNING_ZONES = [
  'central_bay',
  'ocean_south',
  'ocean_north',
  'san_pablo',
] as const;
