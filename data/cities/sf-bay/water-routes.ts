import type { VesselType } from '@/engine/types';

// ============================================
// SF Bay Water Routes
// Navigable waypoint paths between destinations
//
// IMPORTANT: Every route follows ACTUAL water paths.
// No route crosses land. Waypoints trace channels,
// go around peninsulas, and through straits.
//
// Coordinates are [lng, lat] (GeoJSON order).
// Distances are statute miles along the water route.
// ============================================

export interface WaterRoute {
  fromId: string;
  toId: string;
  vesselType: VesselType | 'default'; // 'default' works for most vessels
  waypoints: [number, number][]; // [lng, lat] arrays
  distance: number; // statute miles (water route, may differ from straight-line)
  zones: string[]; // zone IDs traversed in order
  notes: string;
}

export const waterRoutes: WaterRoute[] = [
  // ──────────────────────────────────────────
  // 1. sau → ang
  //    Sausalito to Angel Island (Ayala Cove)
  //    Exit Richardson Bay south, round the south tip of Angel Island,
  //    then north into Ayala Cove on the west side
  // ──────────────────────────────────────────
  {
    fromId: 'sau',
    toId: 'ang',
    vesselType: 'default',
    waypoints: [
      [-122.4853, 37.8594], // Sausalito waterfront
      [-122.4780, 37.8580], // East toward Richardson Bay mouth
      [-122.4680, 37.8540], // Crossing Richardson Bay
      [-122.4560, 37.8490], // South of Tiburon peninsula, approaching Raccoon Strait
      [-122.4450, 37.8530], // Rounding south tip of Angel Island (Pt Stuart)
      [-122.4380, 37.8560], // Southeast shore of Angel Island
      [-122.4330, 37.8600], // Approaching Ayala Cove from south
      [-122.4330, 37.8636], // Ayala Cove, Angel Island
    ],
    distance: 3.2,
    zones: ['richardson', 'central_bay', 'richardson'],
    notes: 'Route exits Richardson Bay, rounds the south side of Angel Island (Pt Stuart), and enters Ayala Cove from the south. Raccoon Strait has strong currents — check tide.',
  },

  // ──────────────────────────────────────────
  // 2. sau → tib
  //    Sausalito to Tiburon
  //    Short hop across Richardson Bay
  // ──────────────────────────────────────────
  {
    fromId: 'sau',
    toId: 'tib',
    vesselType: 'default',
    waypoints: [
      [-122.4853, 37.8594], // Sausalito waterfront
      [-122.4790, 37.8620], // Northeast into Richardson Bay
      [-122.4720, 37.8650], // Mid-Richardson Bay
      [-122.4650, 37.8690], // Approaching Tiburon
      [-122.4562, 37.8735], // Tiburon (Sam's Anchor Cafe)
    ],
    distance: 1.8,
    zones: ['richardson'],
    notes: 'Sheltered crossing of Richardson Bay. Usually calm in the morning. Shallow areas — watch depth near the center of Richardson Bay at low tide.',
  },

  // ──────────────────────────────────────────
  // 3. sau → aqp
  //    Sausalito to Aquatic Park
  //    Out of Richardson Bay, across the central bay to SF waterfront
  // ──────────────────────────────────────────
  {
    fromId: 'sau',
    toId: 'aqp',
    vesselType: 'default',
    waypoints: [
      [-122.4853, 37.8594], // Sausalito waterfront
      [-122.4790, 37.8560], // South out of Sausalito
      [-122.4720, 37.8500], // Exiting Richardson Bay
      [-122.4630, 37.8420], // South of Yellow Bluff, entering central bay
      [-122.4520, 37.8320], // Mid-channel, crossing the Slot
      [-122.4420, 37.8230], // Continuing south across central bay
      [-122.4330, 37.8170], // Approaching SF waterfront
      [-122.4260, 37.8120], // Near Fort Mason
      [-122.4202, 37.8065], // Aquatic Park
    ],
    distance: 4.5,
    zones: ['richardson', 'central_bay', 'sf_shore'],
    notes: 'Crosses the central bay (the Slot). Afternoon westerlies can build steep chop. Morning crossing strongly recommended.',
  },

  // ──────────────────────────────────────────
  // 4. sau → p39
  //    Sausalito to Pier 39
  //    Similar to Aquatic Park but angles slightly east
  // ──────────────────────────────────────────
  {
    fromId: 'sau',
    toId: 'p39',
    vesselType: 'default',
    waypoints: [
      [-122.4853, 37.8594], // Sausalito waterfront
      [-122.4790, 37.8560], // South out of Sausalito
      [-122.4720, 37.8500], // Exiting Richardson Bay
      [-122.4620, 37.8410], // South of Yellow Bluff
      [-122.4500, 37.8320], // Mid-channel crossing
      [-122.4380, 37.8230], // Approaching SF waterfront east of Fort Mason
      [-122.4250, 37.8150], // Near Fisherman's Wharf
      [-122.4160, 37.8110], // Along the Embarcadero
      [-122.4098, 37.8087], // Pier 39
    ],
    distance: 4.8,
    zones: ['richardson', 'central_bay', 'sf_shore'],
    notes: 'Crosses the Slot to Fisherman\'s Wharf area. Strong ebb currents can set you west toward the Gate — compensate heading east.',
  },

  // ──────────────────────────────────────────
  // 5. sau → fbg
  //    Sausalito to Ferry Building
  //    Across the central bay to the Embarcadero
  // ──────────────────────────────────────────
  {
    fromId: 'sau',
    toId: 'fbg',
    vesselType: 'default',
    waypoints: [
      [-122.4853, 37.8594], // Sausalito waterfront
      [-122.4790, 37.8560], // South out of Sausalito
      [-122.4710, 37.8490], // Exiting Richardson Bay
      [-122.4600, 37.8400], // South of Yellow Bluff, central bay
      [-122.4480, 37.8300], // Mid-Slot crossing
      [-122.4350, 37.8200], // Continuing southeast
      [-122.4200, 37.8100], // South of Alcatraz (passing east side)
      [-122.4080, 37.8020], // Approaching SF Embarcadero
      [-122.3990, 37.7980], // Along the waterfront
      [-122.3935, 37.7955], // Ferry Building
    ],
    distance: 5.8,
    zones: ['richardson', 'central_bay', 'sf_shore'],
    notes: 'Long crossing through the Slot. Passes east of Alcatraz. Strong tidal currents near Alcatraz — plan for ebb or flood.',
  },

  // ──────────────────────────────────────────
  // 6. sau → clp
  //    Sausalito to Clipper Cove (Treasure Island)
  //    Across the central bay, south of Angel Island, to TI
  // ──────────────────────────────────────────
  {
    fromId: 'sau',
    toId: 'clp',
    vesselType: 'default',
    waypoints: [
      [-122.4853, 37.8594], // Sausalito waterfront
      [-122.4790, 37.8560], // South out of Sausalito
      [-122.4700, 37.8490], // Exiting Richardson Bay
      [-122.4580, 37.8420], // South of Tiburon peninsula
      [-122.4440, 37.8380], // Passing south of Angel Island
      [-122.4280, 37.8340], // Open water east of Angel Island
      [-122.4100, 37.8290], // Central bay, heading east
      [-122.3920, 37.8250], // Approaching Yerba Buena Island from west
      [-122.3790, 37.8220], // Rounding north side of YBI
      [-122.3695, 37.8185], // Clipper Cove (between TI and YBI)
    ],
    distance: 6.5,
    zones: ['richardson', 'central_bay'],
    notes: 'Route crosses the central bay south of Angel Island. Clipper Cove is accessed from the west between Treasure Island and Yerba Buena Island.',
  },

  // ──────────────────────────────────────────
  // 7. sau → brk
  //    Sausalito to Berkeley Marina
  //    Across Richardson Bay, past Angel Island north side, to Berkeley
  // ──────────────────────────────────────────
  {
    fromId: 'sau',
    toId: 'brk',
    vesselType: 'default',
    waypoints: [
      [-122.4853, 37.8594], // Sausalito waterfront
      [-122.4780, 37.8620], // Northeast into Richardson Bay
      [-122.4680, 37.8650], // Mid-Richardson Bay
      [-122.4560, 37.8680], // East side of Richardson Bay
      [-122.4440, 37.8700], // Raccoon Strait (between Angel Island & Tiburon)
      [-122.4300, 37.8710], // Through Raccoon Strait
      [-122.4150, 37.8700], // East of Angel Island
      [-122.3950, 37.8690], // Open water heading east
      [-122.3700, 37.8680], // Approaching east bay
      [-122.3450, 37.8670], // Nearing Berkeley
      [-122.3150, 37.8650], // Berkeley Marina
    ],
    distance: 8.5,
    zones: ['richardson', 'central_bay', 'east_bay'],
    notes: 'Route goes through Raccoon Strait (between Angel Island and Tiburon) then east across the bay. Strong currents in Raccoon Strait — time with tide.',
  },

  // ──────────────────────────────────────────
  // 8. sau → jls
  //    Sausalito to Jack London Square
  //    Across the bay, south of Angel Island, past Alcatraz,
  //    then east to Oakland Estuary entrance
  // ──────────────────────────────────────────
  {
    fromId: 'sau',
    toId: 'jls',
    vesselType: 'default',
    waypoints: [
      [-122.4853, 37.8594], // Sausalito waterfront
      [-122.4790, 37.8560], // South out of Sausalito
      [-122.4700, 37.8490], // Exiting Richardson Bay
      [-122.4580, 37.8400], // South of Tiburon peninsula
      [-122.4420, 37.8320], // Central bay, south of Angel Island
      [-122.4250, 37.8240], // East of Alcatraz
      [-122.4050, 37.8150], // Continuing east across the bay
      [-122.3850, 37.8080], // Approaching Yerba Buena Island
      [-122.3700, 37.8100], // North side of YBI / Bay Bridge
      [-122.3500, 37.8050], // East of Bay Bridge
      [-122.3300, 37.7990], // Approaching Oakland inner harbor
      [-122.3100, 37.7970], // Near Oakland outer harbor
      [-122.2950, 37.7960], // Oakland Estuary entrance
      [-122.2795, 37.7955], // Jack London Square
    ],
    distance: 11.2,
    zones: ['richardson', 'central_bay', 'east_bay'],
    notes: 'Long crossing through the Slot and then east to Oakland. Route passes north of Yerba Buena Island and enters the estuary from the west.',
  },

  // ──────────────────────────────────────────
  // 9. ang → tib
  //    Angel Island to Tiburon
  //    Very short crossing within Richardson Bay / Raccoon Strait
  // ──────────────────────────────────────────
  {
    fromId: 'ang',
    toId: 'tib',
    vesselType: 'default',
    waypoints: [
      [-122.4330, 37.8636], // Ayala Cove, Angel Island
      [-122.4370, 37.8660], // Northwest out of Ayala Cove
      [-122.4420, 37.8690], // Into Raccoon Strait
      [-122.4490, 37.8720], // Crossing toward Tiburon
      [-122.4562, 37.8735], // Tiburon
    ],
    distance: 1.2,
    zones: ['richardson'],
    notes: 'Short crossing through Raccoon Strait. Strong currents possible — check tide tables before crossing.',
  },

  // ──────────────────────────────────────────
  // 10. ang → clp
  //     Angel Island to Clipper Cove
  //     South side of Angel Island, then east to Treasure Island
  // ──────────────────────────────────────────
  {
    fromId: 'ang',
    toId: 'clp',
    vesselType: 'default',
    waypoints: [
      [-122.4330, 37.8636], // Ayala Cove, Angel Island
      [-122.4310, 37.8590], // South out of Ayala Cove
      [-122.4280, 37.8540], // Southeast shore of Angel Island
      [-122.4220, 37.8470], // Pt Blunt (south tip of Angel Island)
      [-122.4150, 37.8420], // South of Angel Island, open water
      [-122.4050, 37.8370], // Central bay heading east
      [-122.3920, 37.8310], // Continuing east
      [-122.3800, 37.8250], // Approaching Yerba Buena Island from north
      [-122.3740, 37.8210], // North side of YBI
      [-122.3695, 37.8185], // Clipper Cove
    ],
    distance: 4.0,
    zones: ['richardson', 'central_bay'],
    notes: 'Route rounds south tip of Angel Island (Pt Blunt) then crosses east to Clipper Cove. Exposed to wind and chop in central bay.',
  },

  // ──────────────────────────────────────────
  // 11. aqp → p39
  //     Aquatic Park to Pier 39
  //     Short hop along SF waterfront
  // ──────────────────────────────────────────
  {
    fromId: 'aqp',
    toId: 'p39',
    vesselType: 'default',
    waypoints: [
      [-122.4202, 37.8065], // Aquatic Park
      [-122.4175, 37.8070], // East along waterfront past Hyde St Pier
      [-122.4140, 37.8080], // Fisherman's Wharf area
      [-122.4098, 37.8087], // Pier 39
    ],
    distance: 0.6,
    zones: ['sf_shore'],
    notes: 'Short waterfront hop. Stay clear of ferry lanes near Pier 41.',
  },

  // ──────────────────────────────────────────
  // 12. p39 → fbg
  //     Pier 39 to Ferry Building
  //     Along the Embarcadero waterfront
  // ──────────────────────────────────────────
  {
    fromId: 'p39',
    toId: 'fbg',
    vesselType: 'default',
    waypoints: [
      [-122.4098, 37.8087], // Pier 39
      [-122.4060, 37.8070], // Along the piers heading south
      [-122.4020, 37.8040], // Past Pier 27 / cruise terminal
      [-122.3990, 37.8010], // Pier 17-15 area
      [-122.3960, 37.7980], // Approaching Ferry Building
      [-122.3935, 37.7955], // Ferry Building
    ],
    distance: 1.2,
    zones: ['sf_shore'],
    notes: 'Along the Embarcadero. CAUTION: Heavy ferry traffic near Ferry Building — stay well clear of ferry lanes.',
  },

  // ──────────────────────────────────────────
  // 13. fbg → mcc
  //     Ferry Building to McCovey Cove
  //     South along the SF waterfront
  // ──────────────────────────────────────────
  {
    fromId: 'fbg',
    toId: 'mcc',
    vesselType: 'default',
    waypoints: [
      [-122.3935, 37.7955], // Ferry Building
      [-122.3925, 37.7930], // South along Embarcadero
      [-122.3915, 37.7900], // Rincon Park area
      [-122.3905, 37.7870], // Past Pier 30/32
      [-122.3900, 37.7840], // South Beach Harbor area
      [-122.3895, 37.7810], // Approaching AT&T / Oracle Park
      [-122.3893, 37.7786], // McCovey Cove
    ],
    distance: 1.2,
    zones: ['sf_shore'],
    notes: 'Follow the waterfront south. Kayak-friendly route. Watch for game-day boat traffic at McCovey Cove.',
  },

  // ──────────────────────────────────────────
  // 14. fbg → clp
  //     Ferry Building to Clipper Cove
  //     East across the bay to Treasure Island
  // ──────────────────────────────────────────
  {
    fromId: 'fbg',
    toId: 'clp',
    vesselType: 'default',
    waypoints: [
      [-122.3935, 37.7955], // Ferry Building
      [-122.3900, 37.7980], // Northeast off the Embarcadero
      [-122.3860, 37.8020], // Into the bay heading NE
      [-122.3820, 37.8060], // Mid-bay
      [-122.3780, 37.8100], // Approaching Bay Bridge from south
      [-122.3740, 37.8140], // Just north of Bay Bridge west span
      [-122.3710, 37.8170], // Nearing Yerba Buena Island
      [-122.3695, 37.8185], // Clipper Cove
    ],
    distance: 2.4,
    zones: ['sf_shore', 'central_bay'],
    notes: 'Crosses open water to Treasure Island. Pass NORTH of the Bay Bridge west span — do not try to transit under the bridge in small craft during strong currents.',
  },

  // ──────────────────────────────────────────
  // 15. clp → jls
  //     Clipper Cove to Jack London Square
  //     South from TI, east of Bay Bridge, into Oakland Estuary
  // ──────────────────────────────────────────
  {
    fromId: 'clp',
    toId: 'jls',
    vesselType: 'default',
    waypoints: [
      [-122.3695, 37.8185], // Clipper Cove
      [-122.3660, 37.8150], // East out of Clipper Cove
      [-122.3600, 37.8100], // South side of YBI
      [-122.3520, 37.8050], // East of Bay Bridge east span
      [-122.3400, 37.8010], // Heading south toward Oakland
      [-122.3250, 37.7990], // Approaching Oakland outer harbor
      [-122.3100, 37.7970], // Near Oakland inner harbor
      [-122.2950, 37.7960], // Oakland Estuary entrance
      [-122.2795, 37.7955], // Jack London Square
    ],
    distance: 5.0,
    zones: ['central_bay', 'east_bay'],
    notes: 'Route passes south of Yerba Buena Island and east of the Bay Bridge, then enters the Oakland Estuary from the west end.',
  },

  // ──────────────────────────────────────────
  // 16. jls → alm
  //     Jack London Square to Alameda
  //     Through the Oakland Estuary (short hop)
  // ──────────────────────────────────────────
  {
    fromId: 'jls',
    toId: 'alm',
    vesselType: 'default',
    waypoints: [
      [-122.2795, 37.7955], // Jack London Square
      [-122.2800, 37.7920], // South into the estuary
      [-122.2805, 37.7880], // Mid-estuary
      [-122.2810, 37.7840], // Approaching Alameda side
      [-122.2815, 37.7790], // Near Fortman Marina area
      [-122.2820, 37.7735], // Alameda (Encinal YC / Fortman)
    ],
    distance: 1.5,
    zones: ['east_bay'],
    notes: 'Through the Oakland Estuary. Narrow channel — observe no-wake zones. Watch for commercial vessel traffic.',
  },

  // ──────────────────────────────────────────
  // 17. brk → ptr
  //     Berkeley Marina to Point Richmond
  //     North along the east bay shoreline
  // ──────────────────────────────────────────
  {
    fromId: 'brk',
    toId: 'ptr',
    vesselType: 'default',
    waypoints: [
      [-122.3150, 37.8650], // Berkeley Marina
      [-122.3200, 37.8700], // Northwest out of Berkeley Marina
      [-122.3280, 37.8760], // Along Albany shoreline
      [-122.3400, 37.8830], // Continuing north past Albany Bulb
      [-122.3500, 37.8880], // Approaching Point Isabel
      [-122.3600, 37.8920], // Rounding Point Isabel
      [-122.3700, 37.8980], // South of Brooks Island
      [-122.3770, 37.9040], // Approaching Pt Richmond
      [-122.3815, 37.9085], // Pt Richmond (Brickyard Cove)
    ],
    distance: 4.2,
    zones: ['east_bay', 'north_bay'],
    notes: 'Follows the east bay shoreline north. Relatively sheltered. Brooks Island is a wildlife reserve — maintain distance.',
  },

  // ──────────────────────────────────────────
  // 18. sau → hmb
  //     Sausalito to Half Moon Bay
  //     Through the Golden Gate, then south along the coast
  //     OCEAN ROUTE — experienced boaters only
  // ──────────────────────────────────────────
  {
    fromId: 'sau',
    toId: 'hmb',
    vesselType: 'default',
    waypoints: [
      [-122.4853, 37.8594], // Sausalito waterfront
      [-122.4820, 37.8530], // South out of Sausalito
      [-122.4790, 37.8470], // Heading toward the Golden Gate
      [-122.4810, 37.8380], // Approaching the Gate from the north (Horseshoe Bay area)
      [-122.4850, 37.8300], // Under the Golden Gate Bridge, center span
      [-122.4900, 37.8200], // Exiting the Gate, entering the Pacific
      [-122.4950, 37.8080], // Past Mile Rock, turning south along the coast
      [-122.5020, 37.7900], // Offshore of Lands End
      [-122.5050, 37.7700], // Offshore of Ocean Beach (north end)
      [-122.5050, 37.7500], // Offshore of Ocean Beach (south end)
      [-122.5020, 37.7250], // Offshore of Fort Funston
      [-122.4980, 37.7000], // Offshore of Daly City coast
      [-122.4950, 37.6700], // Offshore of Pacifica (Pedro Point)
      [-122.4920, 37.6400], // Offshore of Devil's Slide
      [-122.4900, 37.6100], // Offshore of Montara
      [-122.4870, 37.5800], // Offshore of Moss Beach
      [-122.4850, 37.5500], // Approaching Pillar Point
      [-122.4840, 37.5250], // Rounding Pillar Point
      [-122.4830, 37.5100], // Entering Half Moon Bay
      [-122.4816, 37.5050], // Pillar Point Harbor, Half Moon Bay
    ],
    distance: 28.0,
    zones: ['richardson', 'central_bay', 'ocean_south'],
    notes: 'OCEAN ROUTE — experienced boaters only. Exits through the Golden Gate then follows the coast south. Bar conditions at the Gate can be extremely dangerous. Check NOAA bar forecast. Must have proper safety equipment for ocean passage. Best in calm conditions Sep–Oct.',
  },
];

/**
 * Look up a water route between two destinations.
 *
 * Tries vessel-specific routes first, then falls back to 'default'.
 * Also checks the reverse direction (routes are symmetric — waypoints
 * are simply reversed).
 *
 * @param fromId - Origin destination ID
 * @param toId - Destination ID
 * @param vesselType - Optional vessel type for vessel-specific routing
 * @returns The matching WaterRoute, or null if no route is defined
 */
export function getWaterRoute(
  fromId: string,
  toId: string,
  vesselType?: VesselType,
): WaterRoute | null {
  // Try vessel-specific route first (forward direction)
  if (vesselType) {
    const specific = waterRoutes.find(
      (r) =>
        r.fromId === fromId &&
        r.toId === toId &&
        r.vesselType === vesselType,
    );
    if (specific) return specific;
  }

  // Try default route (forward direction)
  const forward = waterRoutes.find(
    (r) =>
      r.fromId === fromId &&
      r.toId === toId &&
      r.vesselType === 'default',
  );
  if (forward) return forward;

  // Try reverse direction — vessel-specific first
  if (vesselType) {
    const reverseSpecific = waterRoutes.find(
      (r) =>
        r.fromId === toId &&
        r.toId === fromId &&
        r.vesselType === vesselType,
    );
    if (reverseSpecific) {
      return {
        ...reverseSpecific,
        fromId,
        toId,
        waypoints: [...reverseSpecific.waypoints].reverse() as [number, number][],
        zones: [...reverseSpecific.zones].reverse(),
      };
    }
  }

  // Try reverse direction — default
  const reverse = waterRoutes.find(
    (r) =>
      r.fromId === toId &&
      r.toId === fromId &&
      r.vesselType === 'default',
  );
  if (reverse) {
    return {
      ...reverse,
      fromId,
      toId,
      waypoints: [...reverse.waypoints].reverse() as [number, number][],
      zones: [...reverse.zones].reverse(),
    };
  }

  return null;
}
