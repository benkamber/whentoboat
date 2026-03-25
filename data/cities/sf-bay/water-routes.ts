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

  // ══════════════════════════════════════════════
  // ADDITIONAL ROUTES — all remaining destination pairs
  // Added to ensure no route falls back to a straight line
  // ══════════════════════════════════════════════

  // ──────────────────────────────────────────
  // 19. sau → mcc
  //     Sausalito to McCovey Cove
  //     Across the central bay to SF waterfront, then south along Embarcadero
  // ──────────────────────────────────────────
  {
    fromId: 'sau',
    toId: 'mcc',
    vesselType: 'default',
    waypoints: [
      [-122.4853, 37.8594], // Sausalito waterfront
      [-122.4790, 37.8560], // South out of Sausalito
      [-122.4710, 37.8490], // Exiting Richardson Bay
      [-122.4600, 37.8400], // South of Yellow Bluff
      [-122.4480, 37.8300], // Mid-Slot crossing
      [-122.4350, 37.8200], // Continuing southeast
      [-122.4200, 37.8100], // South of Alcatraz
      [-122.4080, 37.8020], // Approaching Embarcadero
      [-122.3990, 37.7970], // Along waterfront
      [-122.3940, 37.7920], // South of Ferry Building
      [-122.3920, 37.7870], // Past Pier 30/32
      [-122.3905, 37.7830], // South Beach Harbor
      [-122.3893, 37.7786], // McCovey Cove
    ],
    distance: 6.8,
    zones: ['richardson', 'central_bay', 'sf_shore'],
    notes: 'Crosses the Slot then follows the SF waterfront south to McCovey Cove. Passes east of Alcatraz.',
  },

  // ──────────────────────────────────────────
  // 20. sau → alm
  //     Sausalito to Alameda
  //     Across the bay, past Alcatraz, north of YBI, through Oakland Estuary
  // ──────────────────────────────────────────
  {
    fromId: 'sau',
    toId: 'alm',
    vesselType: 'default',
    waypoints: [
      [-122.4853, 37.8594], // Sausalito waterfront
      [-122.4790, 37.8560], // South out of Sausalito
      [-122.4700, 37.8490], // Exiting Richardson Bay
      [-122.4580, 37.8400], // Central bay
      [-122.4420, 37.8320], // South of Angel Island
      [-122.4250, 37.8240], // East of Alcatraz
      [-122.4050, 37.8150], // Continuing east
      [-122.3850, 37.8080], // Approaching YBI
      [-122.3700, 37.8100], // North side of YBI
      [-122.3500, 37.8050], // East of Bay Bridge
      [-122.3300, 37.7990], // Approaching Oakland
      [-122.3100, 37.7970], // Oakland outer harbor
      [-122.2950, 37.7960], // Estuary entrance
      [-122.2850, 37.7900], // Mid-estuary
      [-122.2820, 37.7735], // Alameda
    ],
    distance: 12.5,
    zones: ['richardson', 'central_bay', 'east_bay'],
    notes: 'Long crossing through the Slot, past Alcatraz and north of YBI, into the Oakland Estuary to Alameda.',
  },

  // ──────────────────────────────────────────
  // 21. sau → ptr
  //     Sausalito to Point Richmond
  //     North through Richardson Bay, through Raccoon Strait, across north bay
  // ──────────────────────────────────────────
  {
    fromId: 'sau',
    toId: 'ptr',
    vesselType: 'default',
    waypoints: [
      [-122.4853, 37.8594], // Sausalito waterfront
      [-122.4780, 37.8620], // Northeast into Richardson Bay
      [-122.4680, 37.8650], // Mid-Richardson Bay
      [-122.4560, 37.8680], // East side of Richardson Bay
      [-122.4440, 37.8700], // Raccoon Strait entrance
      [-122.4300, 37.8710], // Through Raccoon Strait
      [-122.4150, 37.8700], // East of Angel Island
      [-122.3950, 37.8750], // Open water heading NE
      [-122.3815, 37.9085], // Pt Richmond
    ],
    distance: 9.0,
    zones: ['richardson', 'central_bay', 'north_bay'],
    notes: 'Route goes through Raccoon Strait then northeast across to Pt Richmond. Strong currents in Raccoon Strait.',
  },

  // ──────────────────────────────────────────
  // 22. ang → aqp
  //     Angel Island to Aquatic Park
  //     South from Angel Island across the central bay to SF waterfront
  // ──────────────────────────────────────────
  {
    fromId: 'ang',
    toId: 'aqp',
    vesselType: 'default',
    waypoints: [
      [-122.4330, 37.8636], // Ayala Cove, Angel Island
      [-122.4310, 37.8590], // South out of Ayala Cove
      [-122.4280, 37.8540], // Southeast shore of Angel Island
      [-122.4240, 37.8470], // Pt Blunt area
      [-122.4260, 37.8380], // South of Angel Island, open water
      [-122.4280, 37.8280], // Central bay heading south
      [-122.4270, 37.8200], // Continuing south
      [-122.4250, 37.8130], // Approaching SF waterfront
      [-122.4202, 37.8065], // Aquatic Park
    ],
    distance: 4.5,
    zones: ['richardson', 'central_bay', 'sf_shore'],
    notes: 'Crosses the central bay south from Angel Island to SF waterfront. Can be windy in the afternoon.',
  },

  // ──────────────────────────────────────────
  // 23. ang → p39
  //     Angel Island to Pier 39
  //     South from Angel Island, slightly east, to Fisherman\'s Wharf area
  // ──────────────────────────────────────────
  {
    fromId: 'ang',
    toId: 'p39',
    vesselType: 'default',
    waypoints: [
      [-122.4330, 37.8636], // Ayala Cove, Angel Island
      [-122.4310, 37.8590], // South out of Ayala Cove
      [-122.4280, 37.8530], // Southeast shore
      [-122.4240, 37.8460], // South of Angel Island
      [-122.4230, 37.8370], // Central bay heading south
      [-122.4210, 37.8280], // Continuing south
      [-122.4180, 37.8200], // Approaching Fisherman's Wharf
      [-122.4140, 37.8130], // Near Hyde St Pier
      [-122.4098, 37.8087], // Pier 39
    ],
    distance: 4.7,
    zones: ['richardson', 'central_bay', 'sf_shore'],
    notes: 'South from Angel Island to Pier 39. Passes near Alcatraz — watch for tour boat traffic.',
  },

  // ──────────────────────────────────────────
  // 24. ang → fbg
  //     Angel Island to Ferry Building
  //     South from Angel Island, past Alcatraz, to Embarcadero
  // ──────────────────────────────────────────
  {
    fromId: 'ang',
    toId: 'fbg',
    vesselType: 'default',
    waypoints: [
      [-122.4330, 37.8636], // Ayala Cove, Angel Island
      [-122.4310, 37.8590], // South out of Ayala Cove
      [-122.4270, 37.8530], // Southeast shore
      [-122.4220, 37.8460], // Pt Blunt
      [-122.4180, 37.8380], // South of Angel Island
      [-122.4120, 37.8280], // Central bay, passing east of Alcatraz
      [-122.4060, 37.8180], // Continuing southeast
      [-122.4000, 37.8060], // Approaching Embarcadero
      [-122.3970, 37.8000], // Near pier area
      [-122.3935, 37.7955], // Ferry Building
    ],
    distance: 5.8,
    zones: ['richardson', 'central_bay', 'sf_shore'],
    notes: 'Crosses the central bay from Angel Island to the Ferry Building. Passes east of Alcatraz.',
  },

  // ──────────────────────────────────────────
  // 25. ang → mcc
  //     Angel Island to McCovey Cove
  //     South across the central bay, then along the SF waterfront
  // ──────────────────────────────────────────
  {
    fromId: 'ang',
    toId: 'mcc',
    vesselType: 'default',
    waypoints: [
      [-122.4330, 37.8636], // Ayala Cove
      [-122.4310, 37.8590], // South out of Ayala Cove
      [-122.4270, 37.8530], // Southeast shore
      [-122.4220, 37.8460], // Pt Blunt
      [-122.4170, 37.8370], // South of Angel Island
      [-122.4100, 37.8260], // Central bay
      [-122.4040, 37.8150], // Continuing south
      [-122.3990, 37.8050], // Approaching SF waterfront
      [-122.3950, 37.7960], // Near Ferry Building
      [-122.3930, 37.7890], // South along Embarcadero
      [-122.3910, 37.7830], // South Beach Harbor
      [-122.3893, 37.7786], // McCovey Cove
    ],
    distance: 7.0,
    zones: ['richardson', 'central_bay', 'sf_shore'],
    notes: 'South from Angel Island across the central bay, then south along the SF waterfront to McCovey Cove.',
  },

  // ──────────────────────────────────────────
  // 26. ang → jls
  //     Angel Island to Jack London Square
  //     South of Angel Island, east across the bay, into Oakland Estuary
  // ──────────────────────────────────────────
  {
    fromId: 'ang',
    toId: 'jls',
    vesselType: 'default',
    waypoints: [
      [-122.4330, 37.8636], // Ayala Cove
      [-122.4310, 37.8590], // South out of Ayala Cove
      [-122.4270, 37.8530], // SE shore of Angel Island
      [-122.4220, 37.8460], // Pt Blunt
      [-122.4120, 37.8380], // South of Angel Island
      [-122.3980, 37.8300], // Central bay heading east
      [-122.3820, 37.8230], // Approaching YBI
      [-122.3700, 37.8130], // North of YBI, under Bay Bridge area
      [-122.3500, 37.8050], // East of Bay Bridge
      [-122.3300, 37.7990], // Approaching Oakland
      [-122.3100, 37.7970], // Oakland outer harbor
      [-122.2950, 37.7960], // Estuary entrance
      [-122.2795, 37.7955], // Jack London Square
    ],
    distance: 9.5,
    zones: ['richardson', 'central_bay', 'east_bay'],
    notes: 'South of Angel Island, east across central bay past YBI, into Oakland Estuary.',
  },

  // ──────────────────────────────────────────
  // 27. ang → alm
  //     Angel Island to Alameda
  //     South of Angel Island, east across bay, into estuary to Alameda
  // ──────────────────────────────────────────
  {
    fromId: 'ang',
    toId: 'alm',
    vesselType: 'default',
    waypoints: [
      [-122.4330, 37.8636], // Ayala Cove
      [-122.4310, 37.8590], // South out of Ayala Cove
      [-122.4270, 37.8530], // SE shore
      [-122.4220, 37.8460], // Pt Blunt
      [-122.4120, 37.8380], // South of Angel Island
      [-122.3980, 37.8300], // Central bay
      [-122.3820, 37.8230], // Near YBI
      [-122.3700, 37.8130], // North of YBI
      [-122.3500, 37.8050], // East of Bay Bridge
      [-122.3300, 37.7990], // Approaching Oakland
      [-122.3100, 37.7970], // Oakland outer harbor
      [-122.2950, 37.7960], // Estuary entrance
      [-122.2850, 37.7900], // Mid-estuary
      [-122.2820, 37.7735], // Alameda
    ],
    distance: 11.0,
    zones: ['richardson', 'central_bay', 'east_bay'],
    notes: 'South of Angel Island, across the central bay, through Oakland Estuary to Alameda.',
  },

  // ──────────────────────────────────────────
  // 28. ang → brk
  //     Angel Island to Berkeley Marina
  //     East through Raccoon Strait, then east across north bay
  // ──────────────────────────────────────────
  {
    fromId: 'ang',
    toId: 'brk',
    vesselType: 'default',
    waypoints: [
      [-122.4330, 37.8636], // Ayala Cove
      [-122.4280, 37.8660], // North out of Ayala Cove
      [-122.4200, 37.8680], // East side of Angel Island
      [-122.4100, 37.8690], // Exiting past Angel Island east
      [-122.3900, 37.8680], // Open water heading east
      [-122.3700, 37.8670], // Mid-bay
      [-122.3450, 37.8660], // Approaching east bay
      [-122.3150, 37.8650], // Berkeley Marina
    ],
    distance: 6.0,
    zones: ['richardson', 'central_bay', 'east_bay'],
    notes: 'East from Angel Island past the north shore, then across to Berkeley Marina.',
  },

  // ──────────────────────────────────────────
  // 29. ang → ptr
  //     Angel Island to Pt Richmond
  //     Northeast past Angel Island, across to Pt Richmond
  // ──────────────────────────────────────────
  {
    fromId: 'ang',
    toId: 'ptr',
    vesselType: 'default',
    waypoints: [
      [-122.4330, 37.8636], // Ayala Cove
      [-122.4280, 37.8660], // North out of Ayala Cove
      [-122.4200, 37.8690], // East side of Angel Island
      [-122.4100, 37.8720], // NE of Angel Island
      [-122.4000, 37.8780], // Open water heading NE
      [-122.3900, 37.8850], // Continuing NE
      [-122.3850, 37.8950], // Approaching Pt Richmond
      [-122.3815, 37.9085], // Pt Richmond
    ],
    distance: 5.5,
    zones: ['richardson', 'central_bay', 'north_bay'],
    notes: 'Northeast from Angel Island across to Pt Richmond. Open water crossing.',
  },

  // ──────────────────────────────────────────
  // 30. tib → aqp
  //     Tiburon to Aquatic Park
  //     South through Richardson Bay, across the central bay to SF
  // ──────────────────────────────────────────
  {
    fromId: 'tib',
    toId: 'aqp',
    vesselType: 'default',
    waypoints: [
      [-122.4562, 37.8735], // Tiburon
      [-122.4620, 37.8700], // Southwest out of Tiburon
      [-122.4680, 37.8640], // Mid-Richardson Bay
      [-122.4720, 37.8560], // South Richardson Bay
      [-122.4680, 37.8470], // Exiting Richardson Bay
      [-122.4600, 37.8380], // Central bay
      [-122.4500, 37.8290], // Mid-Slot
      [-122.4400, 37.8210], // Continuing south
      [-122.4300, 37.8140], // Approaching SF waterfront
      [-122.4202, 37.8065], // Aquatic Park
    ],
    distance: 5.5,
    zones: ['richardson', 'central_bay', 'sf_shore'],
    notes: 'South from Tiburon through Richardson Bay, across the Slot to Aquatic Park.',
  },

  // ──────────────────────────────────────────
  // 31. tib → p39
  //     Tiburon to Pier 39
  //     South through Richardson Bay, across central bay
  // ──────────────────────────────────────────
  {
    fromId: 'tib',
    toId: 'p39',
    vesselType: 'default',
    waypoints: [
      [-122.4562, 37.8735], // Tiburon
      [-122.4620, 37.8700], // Southwest out of Tiburon
      [-122.4680, 37.8640], // Mid-Richardson Bay
      [-122.4710, 37.8560], // South Richardson Bay
      [-122.4670, 37.8470], // Exiting Richardson Bay
      [-122.4580, 37.8380], // Central bay
      [-122.4470, 37.8290], // Mid-Slot
      [-122.4350, 37.8200], // Continuing south
      [-122.4230, 37.8140], // Near Fisherman's Wharf
      [-122.4160, 37.8110], // Along the waterfront
      [-122.4098, 37.8087], // Pier 39
    ],
    distance: 5.8,
    zones: ['richardson', 'central_bay', 'sf_shore'],
    notes: 'South from Tiburon through Richardson Bay, across the Slot to Pier 39.',
  },

  // ──────────────────────────────────────────
  // 32. tib → fbg
  //     Tiburon to Ferry Building
  //     South through Richardson Bay, across central bay to Embarcadero
  // ──────────────────────────────────────────
  {
    fromId: 'tib',
    toId: 'fbg',
    vesselType: 'default',
    waypoints: [
      [-122.4562, 37.8735], // Tiburon
      [-122.4620, 37.8700], // Southwest out of Tiburon
      [-122.4670, 37.8640], // Mid-Richardson Bay
      [-122.4700, 37.8560], // South Richardson Bay
      [-122.4650, 37.8470], // Exiting Richardson Bay
      [-122.4550, 37.8380], // Central bay
      [-122.4420, 37.8290], // Mid-Slot
      [-122.4280, 37.8200], // Continuing SE
      [-122.4120, 37.8100], // Passing east of Alcatraz
      [-122.4020, 37.8020], // Approaching SF Embarcadero
      [-122.3970, 37.7980], // Near waterfront
      [-122.3935, 37.7955], // Ferry Building
    ],
    distance: 6.8,
    zones: ['richardson', 'central_bay', 'sf_shore'],
    notes: 'South from Tiburon through Richardson Bay, across the Slot past Alcatraz to Ferry Building.',
  },

  // ──────────────────────────────────────────
  // 33. tib → mcc
  //     Tiburon to McCovey Cove
  //     South through Richardson Bay, across central bay, along SF waterfront
  // ──────────────────────────────────────────
  {
    fromId: 'tib',
    toId: 'mcc',
    vesselType: 'default',
    waypoints: [
      [-122.4562, 37.8735], // Tiburon
      [-122.4620, 37.8700], // Southwest
      [-122.4670, 37.8640], // Mid-Richardson Bay
      [-122.4700, 37.8560], // South Richardson Bay
      [-122.4650, 37.8470], // Exiting Richardson Bay
      [-122.4550, 37.8380], // Central bay
      [-122.4420, 37.8280], // Mid-Slot
      [-122.4280, 37.8180], // SE across bay
      [-122.4100, 37.8080], // Approaching SF waterfront
      [-122.4000, 37.8010], // Near Embarcadero
      [-122.3950, 37.7950], // Ferry Building area
      [-122.3920, 37.7880], // South along waterfront
      [-122.3905, 37.7830], // South Beach
      [-122.3893, 37.7786], // McCovey Cove
    ],
    distance: 7.8,
    zones: ['richardson', 'central_bay', 'sf_shore'],
    notes: 'Tiburon to McCovey Cove via Richardson Bay and central bay crossing. Long exposed crossing.',
  },

  // ──────────────────────────────────────────
  // 34. tib → clp
  //     Tiburon to Clipper Cove
  //     East through Raccoon Strait, south of Angel Island, east to YBI
  // ──────────────────────────────────────────
  {
    fromId: 'tib',
    toId: 'clp',
    vesselType: 'default',
    waypoints: [
      [-122.4562, 37.8735], // Tiburon
      [-122.4490, 37.8720], // East along Tiburon waterfront
      [-122.4400, 37.8700], // Raccoon Strait
      [-122.4300, 37.8690], // Through Raccoon Strait
      [-122.4200, 37.8650], // East of Angel Island, north side
      [-122.4100, 37.8560], // SE of Angel Island
      [-122.4000, 37.8440], // Central bay heading SE
      [-122.3900, 37.8340], // Continuing SE
      [-122.3800, 37.8260], // Approaching YBI from north
      [-122.3740, 37.8220], // North side of YBI
      [-122.3695, 37.8185], // Clipper Cove
    ],
    distance: 6.2,
    zones: ['richardson', 'central_bay'],
    notes: 'East through Raccoon Strait, past Angel Island, across central bay to Clipper Cove.',
  },

  // ──────────────────────────────────────────
  // 35. tib → jls
  //     Tiburon to Jack London Square
  //     Through Raccoon Strait, south of Angel Island, east across bay
  // ──────────────────────────────────────────
  {
    fromId: 'tib',
    toId: 'jls',
    vesselType: 'default',
    waypoints: [
      [-122.4562, 37.8735], // Tiburon
      [-122.4490, 37.8720], // East along Tiburon
      [-122.4400, 37.8700], // Raccoon Strait
      [-122.4300, 37.8690], // Through Raccoon Strait
      [-122.4150, 37.8620], // East of Angel Island
      [-122.4050, 37.8500], // South of Angel Island
      [-122.3900, 37.8380], // Central bay
      [-122.3750, 37.8250], // Approaching YBI
      [-122.3600, 37.8120], // South of YBI
      [-122.3450, 37.8050], // East of Bay Bridge
      [-122.3250, 37.7990], // Approaching Oakland
      [-122.3050, 37.7970], // Oakland harbor area
      [-122.2900, 37.7960], // Estuary entrance
      [-122.2795, 37.7955], // Jack London Square
    ],
    distance: 11.5,
    zones: ['richardson', 'central_bay', 'east_bay'],
    notes: 'Through Raccoon Strait, south of Angel Island, across the bay to Oakland Estuary.',
  },

  // ──────────────────────────────────────────
  // 36. tib → alm
  //     Tiburon to Alameda
  //     Through Raccoon Strait, south of Angel Island, east to estuary
  // ──────────────────────────────────────────
  {
    fromId: 'tib',
    toId: 'alm',
    vesselType: 'default',
    waypoints: [
      [-122.4562, 37.8735], // Tiburon
      [-122.4490, 37.8720], // East along Tiburon
      [-122.4400, 37.8700], // Raccoon Strait
      [-122.4300, 37.8690], // Through Raccoon Strait
      [-122.4150, 37.8620], // East of Angel Island
      [-122.4050, 37.8500], // South of Angel Island
      [-122.3900, 37.8380], // Central bay
      [-122.3750, 37.8250], // Approaching YBI
      [-122.3600, 37.8120], // South of YBI
      [-122.3450, 37.8050], // East of Bay Bridge
      [-122.3250, 37.7990], // Approaching Oakland
      [-122.3050, 37.7970], // Oakland harbor
      [-122.2900, 37.7960], // Estuary entrance
      [-122.2850, 37.7880], // Mid-estuary
      [-122.2820, 37.7735], // Alameda
    ],
    distance: 13.0,
    zones: ['richardson', 'central_bay', 'east_bay'],
    notes: 'Through Raccoon Strait, south of Angel Island, across the bay to Alameda via Oakland Estuary.',
  },

  // ──────────────────────────────────────────
  // 37. tib → brk
  //     Tiburon to Berkeley Marina
  //     East through Raccoon Strait, then east across north bay
  // ──────────────────────────────────────────
  {
    fromId: 'tib',
    toId: 'brk',
    vesselType: 'default',
    waypoints: [
      [-122.4562, 37.8735], // Tiburon
      [-122.4490, 37.8720], // East along Tiburon
      [-122.4400, 37.8700], // Raccoon Strait entrance
      [-122.4300, 37.8710], // Through Raccoon Strait
      [-122.4150, 37.8700], // East of Angel Island
      [-122.3950, 37.8690], // Open water heading east
      [-122.3700, 37.8680], // Mid-bay
      [-122.3450, 37.8670], // Approaching east bay
      [-122.3150, 37.8650], // Berkeley Marina
    ],
    distance: 7.5,
    zones: ['richardson', 'central_bay', 'east_bay'],
    notes: 'Through Raccoon Strait then east across the bay to Berkeley Marina.',
  },

  // ──────────────────────────────────────────
  // 38. tib → ptr
  //     Tiburon to Pt Richmond
  //     East through Raccoon Strait, NE across north bay
  // ──────────────────────────────────────────
  {
    fromId: 'tib',
    toId: 'ptr',
    vesselType: 'default',
    waypoints: [
      [-122.4562, 37.8735], // Tiburon
      [-122.4490, 37.8720], // East along Tiburon
      [-122.4400, 37.8700], // Raccoon Strait
      [-122.4300, 37.8710], // Through Raccoon Strait
      [-122.4150, 37.8720], // East of Angel Island
      [-122.4000, 37.8780], // Open water heading NE
      [-122.3900, 37.8860], // Continuing NE
      [-122.3850, 37.8960], // Approaching Pt Richmond
      [-122.3815, 37.9085], // Pt Richmond
    ],
    distance: 7.8,
    zones: ['richardson', 'central_bay', 'north_bay'],
    notes: 'Through Raccoon Strait, then northeast across the bay to Pt Richmond.',
  },

  // ──────────────────────────────────────────
  // 39. aqp → fbg
  //     Aquatic Park to Ferry Building
  //     Along the SF waterfront (follows the piers)
  // ──────────────────────────────────────────
  {
    fromId: 'aqp',
    toId: 'fbg',
    vesselType: 'default',
    waypoints: [
      [-122.4202, 37.8065], // Aquatic Park
      [-122.4175, 37.8070], // East past Hyde St Pier
      [-122.4140, 37.8080], // Fisherman's Wharf
      [-122.4098, 37.8087], // Pier 39
      [-122.4060, 37.8070], // Along piers south
      [-122.4020, 37.8040], // Pier 27 area
      [-122.3990, 37.8010], // Pier 17
      [-122.3960, 37.7980], // Near Ferry Building
      [-122.3935, 37.7955], // Ferry Building
    ],
    distance: 1.8,
    zones: ['sf_shore'],
    notes: 'Along the SF waterfront past the piers. Stay clear of ferry lanes near Pier 41 and Ferry Building.',
  },

  // ──────────────────────────────────────────
  // 40. aqp → mcc
  //     Aquatic Park to McCovey Cove
  //     Along the entire SF waterfront south
  // ──────────────────────────────────────────
  {
    fromId: 'aqp',
    toId: 'mcc',
    vesselType: 'default',
    waypoints: [
      [-122.4202, 37.8065], // Aquatic Park
      [-122.4175, 37.8070], // East past Hyde St Pier
      [-122.4140, 37.8080], // Fisherman's Wharf
      [-122.4098, 37.8087], // Pier 39
      [-122.4060, 37.8070], // South along piers
      [-122.4020, 37.8040], // Pier 27
      [-122.3990, 37.8010], // Pier 17
      [-122.3960, 37.7980], // Near Ferry Building
      [-122.3935, 37.7955], // Ferry Building
      [-122.3925, 37.7920], // South along Embarcadero
      [-122.3910, 37.7880], // Rincon Park
      [-122.3900, 37.7840], // South Beach Harbor
      [-122.3893, 37.7786], // McCovey Cove
    ],
    distance: 3.0,
    zones: ['sf_shore'],
    notes: 'Follows the entire SF waterfront from Aquatic Park south to McCovey Cove.',
  },

  // ──────────────────────────────────────────
  // 41. aqp → clp
  //     Aquatic Park to Clipper Cove
  //     East from SF waterfront across to Treasure Island
  // ──────────────────────────────────────────
  {
    fromId: 'aqp',
    toId: 'clp',
    vesselType: 'default',
    waypoints: [
      [-122.4202, 37.8065], // Aquatic Park
      [-122.4140, 37.8080], // East along waterfront
      [-122.4060, 37.8090], // Pier 39 area
      [-122.3980, 37.8100], // Continuing east
      [-122.3900, 37.8120], // Open water NE
      [-122.3830, 37.8150], // Mid-bay heading east
      [-122.3770, 37.8180], // Approaching YBI from west
      [-122.3730, 37.8195], // North of YBI
      [-122.3695, 37.8185], // Clipper Cove
    ],
    distance: 3.5,
    zones: ['sf_shore', 'central_bay'],
    notes: 'East from Aquatic Park across to Clipper Cove. Passes north of Bay Bridge west span.',
  },

  // ──────────────────────────────────────────
  // 42. aqp → jls
  //     Aquatic Park to Jack London Square
  //     East across the bay, north of YBI, to Oakland Estuary
  // ──────────────────────────────────────────
  {
    fromId: 'aqp',
    toId: 'jls',
    vesselType: 'default',
    waypoints: [
      [-122.4202, 37.8065], // Aquatic Park
      [-122.4140, 37.8080], // East along waterfront
      [-122.4050, 37.8090], // Past Pier 39
      [-122.3950, 37.8100], // Open water heading east
      [-122.3850, 37.8110], // Mid-bay
      [-122.3750, 37.8130], // Approaching YBI
      [-122.3650, 37.8110], // North of YBI
      [-122.3500, 37.8060], // East of Bay Bridge
      [-122.3300, 37.8000], // Approaching Oakland
      [-122.3100, 37.7970], // Oakland outer harbor
      [-122.2950, 37.7960], // Estuary entrance
      [-122.2795, 37.7955], // Jack London Square
    ],
    distance: 8.5,
    zones: ['sf_shore', 'central_bay', 'east_bay'],
    notes: 'East from Aquatic Park, passing north of YBI, into Oakland Estuary.',
  },

  // ──────────────────────────────────────────
  // 43. aqp → alm
  //     Aquatic Park to Alameda
  //     East across the bay, past YBI, into Oakland Estuary to Alameda
  // ──────────────────────────────────────────
  {
    fromId: 'aqp',
    toId: 'alm',
    vesselType: 'default',
    waypoints: [
      [-122.4202, 37.8065], // Aquatic Park
      [-122.4140, 37.8080], // East along waterfront
      [-122.4050, 37.8090], // Past Pier 39
      [-122.3950, 37.8100], // Open water heading east
      [-122.3850, 37.8110], // Mid-bay
      [-122.3750, 37.8130], // Approaching YBI
      [-122.3650, 37.8110], // North of YBI
      [-122.3500, 37.8060], // East of Bay Bridge
      [-122.3300, 37.8000], // Approaching Oakland
      [-122.3100, 37.7970], // Oakland harbor
      [-122.2950, 37.7960], // Estuary entrance
      [-122.2850, 37.7880], // Mid-estuary
      [-122.2820, 37.7735], // Alameda
    ],
    distance: 10.0,
    zones: ['sf_shore', 'central_bay', 'east_bay'],
    notes: 'East from Aquatic Park across the bay, through Oakland Estuary to Alameda.',
  },

  // ──────────────────────────────────────────
  // 44. aqp → brk
  //     Aquatic Park to Berkeley Marina
  //     Northeast across the central bay
  // ──────────────────────────────────────────
  {
    fromId: 'aqp',
    toId: 'brk',
    vesselType: 'default',
    waypoints: [
      [-122.4202, 37.8065], // Aquatic Park
      [-122.4150, 37.8100], // NE from waterfront
      [-122.4050, 37.8150], // Open water heading NE
      [-122.3920, 37.8230], // Central bay
      [-122.3780, 37.8330], // Continuing NE
      [-122.3620, 37.8430], // Mid-bay
      [-122.3450, 37.8530], // Approaching east bay
      [-122.3300, 37.8600], // Near Berkeley
      [-122.3150, 37.8650], // Berkeley Marina
    ],
    distance: 7.5,
    zones: ['sf_shore', 'central_bay', 'east_bay'],
    notes: 'Northeast crossing from SF waterfront to Berkeley Marina. Exposed to westerly winds.',
  },

  // ──────────────────────────────────────────
  // 45. aqp → ptr
  //     Aquatic Park to Pt Richmond
  //     Northeast across the central bay, past Angel Island east side
  // ──────────────────────────────────────────
  {
    fromId: 'aqp',
    toId: 'ptr',
    vesselType: 'default',
    waypoints: [
      [-122.4202, 37.8065], // Aquatic Park
      [-122.4170, 37.8110], // NE from waterfront
      [-122.4100, 37.8180], // Open water heading NE
      [-122.4020, 37.8270], // Central bay
      [-122.3950, 37.8370], // Continuing north
      [-122.3900, 37.8480], // East of Angel Island area
      [-122.3870, 37.8600], // North of Angel Island
      [-122.3850, 37.8750], // Heading NE
      [-122.3830, 37.8900], // Approaching Pt Richmond
      [-122.3815, 37.9085], // Pt Richmond
    ],
    distance: 9.8,
    zones: ['sf_shore', 'central_bay', 'north_bay'],
    notes: 'Long NE crossing from Aquatic Park across the central bay to Pt Richmond.',
  },

  // ──────────────────────────────────────────
  // 46. p39 → mcc
  //     Pier 39 to McCovey Cove
  //     Along the SF waterfront south
  // ──────────────────────────────────────────
  {
    fromId: 'p39',
    toId: 'mcc',
    vesselType: 'default',
    waypoints: [
      [-122.4098, 37.8087], // Pier 39
      [-122.4060, 37.8070], // South along piers
      [-122.4020, 37.8040], // Pier 27
      [-122.3990, 37.8010], // Pier 17
      [-122.3960, 37.7980], // Near Ferry Building
      [-122.3935, 37.7955], // Ferry Building
      [-122.3925, 37.7920], // South along Embarcadero
      [-122.3910, 37.7880], // Rincon Park
      [-122.3900, 37.7840], // South Beach Harbor
      [-122.3893, 37.7786], // McCovey Cove
    ],
    distance: 2.4,
    zones: ['sf_shore'],
    notes: 'Along the SF waterfront from Pier 39 south to McCovey Cove.',
  },

  // ──────────────────────────────────────────
  // 47. p39 → clp
  //     Pier 39 to Clipper Cove
  //     East across to Treasure Island
  // ──────────────────────────────────────────
  {
    fromId: 'p39',
    toId: 'clp',
    vesselType: 'default',
    waypoints: [
      [-122.4098, 37.8087], // Pier 39
      [-122.4020, 37.8100], // East from Pier 39
      [-122.3940, 37.8120], // Open water heading east
      [-122.3860, 37.8140], // Mid-bay
      [-122.3790, 37.8170], // Approaching YBI
      [-122.3740, 37.8190], // North side of YBI
      [-122.3695, 37.8185], // Clipper Cove
    ],
    distance: 2.8,
    zones: ['sf_shore', 'central_bay'],
    notes: 'East from Pier 39 to Clipper Cove. Passes north of YBI.',
  },

  // ──────────────────────────────────────────
  // 48. p39 → jls
  //     Pier 39 to Jack London Square
  //     East across the bay, past YBI, to Oakland Estuary
  // ──────────────────────────────────────────
  {
    fromId: 'p39',
    toId: 'jls',
    vesselType: 'default',
    waypoints: [
      [-122.4098, 37.8087], // Pier 39
      [-122.4020, 37.8100], // East from Pier 39
      [-122.3920, 37.8120], // Open water
      [-122.3830, 37.8140], // Mid-bay
      [-122.3740, 37.8160], // Near YBI
      [-122.3640, 37.8120], // North of YBI
      [-122.3500, 37.8060], // East of Bay Bridge
      [-122.3300, 37.7990], // Approaching Oakland
      [-122.3100, 37.7970], // Oakland outer harbor
      [-122.2950, 37.7960], // Estuary entrance
      [-122.2795, 37.7955], // Jack London Square
    ],
    distance: 8.0,
    zones: ['sf_shore', 'central_bay', 'east_bay'],
    notes: 'East from Pier 39, north of YBI, to Oakland Estuary.',
  },

  // ──────────────────────────────────────────
  // 49. p39 → alm
  //     Pier 39 to Alameda
  //     East across the bay, past YBI, into estuary to Alameda
  // ──────────────────────────────────────────
  {
    fromId: 'p39',
    toId: 'alm',
    vesselType: 'default',
    waypoints: [
      [-122.4098, 37.8087], // Pier 39
      [-122.4020, 37.8100], // East from Pier 39
      [-122.3920, 37.8120], // Open water
      [-122.3830, 37.8140], // Mid-bay
      [-122.3740, 37.8160], // Near YBI
      [-122.3640, 37.8120], // North of YBI
      [-122.3500, 37.8060], // East of Bay Bridge
      [-122.3300, 37.7990], // Approaching Oakland
      [-122.3100, 37.7970], // Oakland harbor
      [-122.2950, 37.7960], // Estuary entrance
      [-122.2850, 37.7880], // Mid-estuary
      [-122.2820, 37.7735], // Alameda
    ],
    distance: 9.5,
    zones: ['sf_shore', 'central_bay', 'east_bay'],
    notes: 'East from Pier 39, north of YBI, through estuary to Alameda.',
  },

  // ──────────────────────────────────────────
  // 50. p39 → brk
  //     Pier 39 to Berkeley Marina
  //     Northeast across the central bay
  // ──────────────────────────────────────────
  {
    fromId: 'p39',
    toId: 'brk',
    vesselType: 'default',
    waypoints: [
      [-122.4098, 37.8087], // Pier 39
      [-122.4030, 37.8120], // NE from Pier 39
      [-122.3940, 37.8170], // Open water heading NE
      [-122.3830, 37.8240], // Central bay
      [-122.3700, 37.8330], // Continuing NE
      [-122.3550, 37.8440], // Mid-bay
      [-122.3400, 37.8540], // Approaching Berkeley
      [-122.3250, 37.8610], // Near Berkeley
      [-122.3150, 37.8650], // Berkeley Marina
    ],
    distance: 7.2,
    zones: ['sf_shore', 'central_bay', 'east_bay'],
    notes: 'NE crossing from Pier 39 to Berkeley Marina. Open water — can be rough in afternoon.',
  },

  // ──────────────────────────────────────────
  // 51. p39 → ptr
  //     Pier 39 to Pt Richmond
  //     Northeast across the central bay
  // ──────────────────────────────────────────
  {
    fromId: 'p39',
    toId: 'ptr',
    vesselType: 'default',
    waypoints: [
      [-122.4098, 37.8087], // Pier 39
      [-122.4030, 37.8130], // NE from Pier 39
      [-122.3950, 37.8200], // Open water heading NE
      [-122.3880, 37.8300], // Central bay
      [-122.3850, 37.8420], // Continuing north
      [-122.3840, 37.8560], // North central bay
      [-122.3830, 37.8700], // Heading NE
      [-122.3825, 37.8850], // Approaching Pt Richmond
      [-122.3815, 37.9085], // Pt Richmond
    ],
    distance: 9.5,
    zones: ['sf_shore', 'central_bay', 'north_bay'],
    notes: 'NE crossing from Pier 39 to Pt Richmond. Long open-water route.',
  },

  // ──────────────────────────────────────────
  // 52. fbg → jls
  //     Ferry Building to Jack London Square
  //     East across the bay, south of Bay Bridge, to Oakland Estuary
  // ──────────────────────────────────────────
  {
    fromId: 'fbg',
    toId: 'jls',
    vesselType: 'default',
    waypoints: [
      [-122.3935, 37.7955], // Ferry Building
      [-122.3880, 37.7970], // East off Embarcadero
      [-122.3800, 37.7990], // Open water heading east
      [-122.3700, 37.8010], // Mid-bay, south of Bay Bridge
      [-122.3580, 37.8020], // Continuing east under Bay Bridge
      [-122.3420, 37.8010], // East of Bay Bridge
      [-122.3250, 37.7990], // Approaching Oakland
      [-122.3100, 37.7970], // Oakland outer harbor
      [-122.2950, 37.7960], // Estuary entrance
      [-122.2795, 37.7955], // Jack London Square
    ],
    distance: 6.5,
    zones: ['sf_shore', 'central_bay', 'east_bay'],
    notes: 'Straight east crossing from Ferry Building to Oakland. Passes under the Bay Bridge.',
  },

  // ──────────────────────────────────────────
  // 53. fbg → alm
  //     Ferry Building to Alameda
  //     East across the bay, into Oakland Estuary, south to Alameda
  // ──────────────────────────────────────────
  {
    fromId: 'fbg',
    toId: 'alm',
    vesselType: 'default',
    waypoints: [
      [-122.3935, 37.7955], // Ferry Building
      [-122.3880, 37.7970], // East off Embarcadero
      [-122.3800, 37.7990], // Open water
      [-122.3700, 37.8010], // Mid-bay
      [-122.3580, 37.8020], // Under Bay Bridge
      [-122.3420, 37.8010], // East of Bay Bridge
      [-122.3250, 37.7990], // Approaching Oakland
      [-122.3100, 37.7970], // Oakland harbor
      [-122.2950, 37.7960], // Estuary entrance
      [-122.2850, 37.7880], // Mid-estuary
      [-122.2820, 37.7735], // Alameda
    ],
    distance: 8.0,
    zones: ['sf_shore', 'central_bay', 'east_bay'],
    notes: 'East crossing from Ferry Building, under Bay Bridge, through estuary to Alameda.',
  },

  // ──────────────────────────────────────────
  // 54. fbg → brk
  //     Ferry Building to Berkeley Marina
  //     NE across the bay, north of YBI
  // ──────────────────────────────────────────
  {
    fromId: 'fbg',
    toId: 'brk',
    vesselType: 'default',
    waypoints: [
      [-122.3935, 37.7955], // Ferry Building
      [-122.3890, 37.7990], // NE off Embarcadero
      [-122.3830, 37.8040], // Open water heading NE
      [-122.3770, 37.8100], // Mid-bay
      [-122.3710, 37.8170], // Near YBI west side
      [-122.3680, 37.8230], // North of YBI
      [-122.3600, 37.8340], // Open water heading NE
      [-122.3450, 37.8470], // Continuing NE
      [-122.3300, 37.8570], // Approaching Berkeley
      [-122.3150, 37.8650], // Berkeley Marina
    ],
    distance: 7.0,
    zones: ['sf_shore', 'central_bay', 'east_bay'],
    notes: 'NE crossing from Ferry Building, passing north of YBI, to Berkeley Marina.',
  },

  // ──────────────────────────────────────────
  // 55. fbg → ptr
  //     Ferry Building to Pt Richmond
  //     NE across the bay
  // ──────────────────────────────────────────
  {
    fromId: 'fbg',
    toId: 'ptr',
    vesselType: 'default',
    waypoints: [
      [-122.3935, 37.7955], // Ferry Building
      [-122.3890, 37.7990], // NE off Embarcadero
      [-122.3830, 37.8060], // Open water heading NE
      [-122.3780, 37.8140], // Mid-bay
      [-122.3730, 37.8230], // North of YBI
      [-122.3700, 37.8340], // Continuing north
      [-122.3720, 37.8470], // North central bay
      [-122.3750, 37.8600], // Heading NE
      [-122.3780, 37.8750], // Approaching Richmond
      [-122.3800, 37.8900], // Near Pt Richmond
      [-122.3815, 37.9085], // Pt Richmond
    ],
    distance: 10.5,
    zones: ['sf_shore', 'central_bay', 'north_bay'],
    notes: 'Long NE crossing from Ferry Building to Pt Richmond. Passes north of YBI.',
  },

  // ──────────────────────────────────────────
  // 56. mcc → clp
  //     McCovey Cove to Clipper Cove
  //     North along SF waterfront then east to YBI
  // ──────────────────────────────────────────
  {
    fromId: 'mcc',
    toId: 'clp',
    vesselType: 'default',
    waypoints: [
      [-122.3893, 37.7786], // McCovey Cove
      [-122.3890, 37.7830], // North along waterfront
      [-122.3880, 37.7880], // South Beach Harbor area
      [-122.3860, 37.7940], // Continuing north
      [-122.3830, 37.8000], // Near Bay Bridge south anchorage
      [-122.3790, 37.8060], // Open water heading NE
      [-122.3750, 37.8120], // Under Bay Bridge area
      [-122.3720, 37.8160], // Approaching YBI
      [-122.3695, 37.8185], // Clipper Cove
    ],
    distance: 3.5,
    zones: ['sf_shore', 'central_bay'],
    notes: 'North along SF waterfront then east to Clipper Cove. Crosses near Bay Bridge.',
  },

  // ──────────────────────────────────────────
  // 57. mcc → jls
  //     McCovey Cove to Jack London Square
  //     East across the south bay to Oakland Estuary
  // ──────────────────────────────────────────
  {
    fromId: 'mcc',
    toId: 'jls',
    vesselType: 'default',
    waypoints: [
      [-122.3893, 37.7786], // McCovey Cove
      [-122.3850, 37.7800], // East into the bay
      [-122.3750, 37.7830], // Open water heading east
      [-122.3620, 37.7860], // South of Bay Bridge
      [-122.3480, 37.7890], // Continuing east
      [-122.3320, 37.7910], // Approaching Oakland waterfront
      [-122.3150, 37.7930], // Near Oakland harbor
      [-122.2980, 37.7950], // Estuary entrance
      [-122.2795, 37.7955], // Jack London Square
    ],
    distance: 6.5,
    zones: ['sf_shore', 'central_bay', 'east_bay'],
    notes: 'East from McCovey Cove across the south bay to Oakland Estuary.',
  },

  // ──────────────────────────────────────────
  // 58. mcc → alm
  //     McCovey Cove to Alameda
  //     East across the south bay directly to Alameda
  // ──────────────────────────────────────────
  {
    fromId: 'mcc',
    toId: 'alm',
    vesselType: 'default',
    waypoints: [
      [-122.3893, 37.7786], // McCovey Cove
      [-122.3840, 37.7790], // East into the bay
      [-122.3730, 37.7790], // Open water heading east
      [-122.3600, 37.7790], // South bay, below Bay Bridge
      [-122.3450, 37.7780], // Continuing east
      [-122.3300, 37.7770], // Mid south bay
      [-122.3150, 37.7760], // Approaching Alameda NW shore
      [-122.3000, 37.7750], // Near Alameda
      [-122.2820, 37.7735], // Alameda
    ],
    distance: 6.0,
    zones: ['sf_shore', 'central_bay', 'east_bay'],
    notes: 'East across the south bay from McCovey Cove directly to Alameda. Passes south of Bay Bridge.',
  },

  // ──────────────────────────────────────────
  // 59. mcc → brk
  //     McCovey Cove to Berkeley Marina
  //     NE across the bay, north of YBI
  // ──────────────────────────────────────────
  {
    fromId: 'mcc',
    toId: 'brk',
    vesselType: 'default',
    waypoints: [
      [-122.3893, 37.7786], // McCovey Cove
      [-122.3880, 37.7850], // North along waterfront
      [-122.3860, 37.7920], // Continuing north
      [-122.3830, 37.7990], // Near Bay Bridge
      [-122.3780, 37.8070], // Under Bay Bridge area
      [-122.3720, 37.8160], // North of Bay Bridge
      [-122.3650, 37.8260], // North of YBI
      [-122.3550, 37.8380], // Open water heading NE
      [-122.3400, 37.8500], // Continuing NE
      [-122.3280, 37.8580], // Approaching Berkeley
      [-122.3150, 37.8650], // Berkeley Marina
    ],
    distance: 8.5,
    zones: ['sf_shore', 'central_bay', 'east_bay'],
    notes: 'NE from McCovey Cove, north of YBI, across to Berkeley Marina. Long exposed crossing.',
  },

  // ──────────────────────────────────────────
  // 60. mcc → ptr
  //     McCovey Cove to Pt Richmond
  //     North along SF waterfront, then NE across the bay
  // ──────────────────────────────────────────
  {
    fromId: 'mcc',
    toId: 'ptr',
    vesselType: 'default',
    waypoints: [
      [-122.3893, 37.7786], // McCovey Cove
      [-122.3880, 37.7850], // North along waterfront
      [-122.3860, 37.7930], // Continuing north
      [-122.3830, 37.8010], // Near Bay Bridge
      [-122.3790, 37.8100], // Under Bay Bridge area
      [-122.3740, 37.8200], // North of Bay Bridge
      [-122.3700, 37.8320], // North of YBI
      [-122.3720, 37.8470], // Open water heading NE
      [-122.3750, 37.8620], // Continuing north
      [-122.3780, 37.8780], // Approaching Richmond
      [-122.3800, 37.8920], // Near Pt Richmond
      [-122.3815, 37.9085], // Pt Richmond
    ],
    distance: 11.5,
    zones: ['sf_shore', 'central_bay', 'north_bay'],
    notes: 'North from McCovey Cove past YBI, then NE across to Pt Richmond. Very long route.',
  },

  // ──────────────────────────────────────────
  // 61. clp → alm
  //     Clipper Cove to Alameda
  //     South from YBI, east past Bay Bridge, into estuary
  // ──────────────────────────────────────────
  {
    fromId: 'clp',
    toId: 'alm',
    vesselType: 'default',
    waypoints: [
      [-122.3695, 37.8185], // Clipper Cove
      [-122.3660, 37.8150], // East out of Clipper Cove
      [-122.3600, 37.8100], // South of YBI
      [-122.3520, 37.8050], // East of Bay Bridge
      [-122.3400, 37.8010], // Heading south
      [-122.3250, 37.7990], // Oakland outer harbor
      [-122.3100, 37.7970], // Near estuary entrance
      [-122.2950, 37.7960], // Estuary entrance
      [-122.2850, 37.7880], // Mid-estuary
      [-122.2820, 37.7735], // Alameda
    ],
    distance: 6.5,
    zones: ['central_bay', 'east_bay'],
    notes: 'South from Clipper Cove, past east span of Bay Bridge, into Oakland Estuary to Alameda.',
  },

  // ──────────────────────────────────────────
  // 62. clp → brk
  //     Clipper Cove to Berkeley Marina
  //     North from YBI, then NE to Berkeley
  // ──────────────────────────────────────────
  {
    fromId: 'clp',
    toId: 'brk',
    vesselType: 'default',
    waypoints: [
      [-122.3695, 37.8185], // Clipper Cove
      [-122.3680, 37.8230], // North out of Clipper Cove
      [-122.3650, 37.8300], // North of YBI
      [-122.3580, 37.8380], // Open water heading NE
      [-122.3470, 37.8460], // Continuing NE
      [-122.3350, 37.8540], // Approaching Berkeley
      [-122.3250, 37.8600], // Near Berkeley
      [-122.3150, 37.8650], // Berkeley Marina
    ],
    distance: 4.5,
    zones: ['central_bay', 'east_bay'],
    notes: 'North from Clipper Cove, then NE to Berkeley Marina.',
  },

  // ──────────────────────────────────────────
  // 63. clp → ptr
  //     Clipper Cove to Pt Richmond
  //     North from YBI, across to Pt Richmond
  // ──────────────────────────────────────────
  {
    fromId: 'clp',
    toId: 'ptr',
    vesselType: 'default',
    waypoints: [
      [-122.3695, 37.8185], // Clipper Cove
      [-122.3680, 37.8240], // North out of Clipper Cove
      [-122.3660, 37.8320], // North of YBI
      [-122.3680, 37.8430], // Open water heading north
      [-122.3720, 37.8560], // Continuing north
      [-122.3760, 37.8700], // North central bay
      [-122.3790, 37.8850], // Approaching Pt Richmond
      [-122.3815, 37.9085], // Pt Richmond
    ],
    distance: 7.0,
    zones: ['central_bay', 'north_bay'],
    notes: 'North from Clipper Cove across to Pt Richmond.',
  },

  // ──────────────────────────────────────────
  // 64. jls → brk
  //     Jack London Square to Berkeley Marina
  //     North along east bay shoreline
  // ──────────────────────────────────────────
  {
    fromId: 'jls',
    toId: 'brk',
    vesselType: 'default',
    waypoints: [
      [-122.2795, 37.7955], // Jack London Square
      [-122.2850, 37.7980], // West out of estuary
      [-122.2950, 37.8010], // Oakland outer harbor
      [-122.3000, 37.8080], // North along east bay shore
      [-122.3050, 37.8180], // Continuing north
      [-122.3080, 37.8300], // Emeryville area
      [-122.3100, 37.8420], // North of Emeryville
      [-122.3120, 37.8540], // Approaching Berkeley
      [-122.3150, 37.8650], // Berkeley Marina
    ],
    distance: 6.0,
    zones: ['east_bay'],
    notes: 'North along the east bay shoreline from Oakland to Berkeley Marina.',
  },

  // ──────────────────────────────────────────
  // 65. jls → ptr
  //     Jack London Square to Pt Richmond
  //     North along east bay shoreline to Pt Richmond
  // ──────────────────────────────────────────
  {
    fromId: 'jls',
    toId: 'ptr',
    vesselType: 'default',
    waypoints: [
      [-122.2795, 37.7955], // Jack London Square
      [-122.2850, 37.7980], // West out of estuary
      [-122.2950, 37.8010], // Oakland outer harbor
      [-122.3000, 37.8080], // North along east bay
      [-122.3050, 37.8180], // Continuing north
      [-122.3080, 37.8300], // Emeryville area
      [-122.3100, 37.8420], // North of Emeryville
      [-122.3130, 37.8540], // Approaching Berkeley
      [-122.3150, 37.8650], // Berkeley Marina area
      [-122.3200, 37.8700], // North of Berkeley
      [-122.3300, 37.8780], // Albany shoreline
      [-122.3450, 37.8850], // Point Isabel area
      [-122.3600, 37.8920], // Rounding Point Isabel
      [-122.3720, 37.8990], // South of Brooks Island
      [-122.3815, 37.9085], // Pt Richmond
    ],
    distance: 10.0,
    zones: ['east_bay', 'north_bay'],
    notes: 'North along east bay shoreline from JLS through Berkeley to Pt Richmond.',
  },

  // ──────────────────────────────────────────
  // 66. alm → brk
  //     Alameda to Berkeley Marina
  //     North through Oakland Estuary, then north along east bay shore
  // ──────────────────────────────────────────
  {
    fromId: 'alm',
    toId: 'brk',
    vesselType: 'default',
    waypoints: [
      [-122.2820, 37.7735], // Alameda
      [-122.2830, 37.7830], // North through estuary
      [-122.2850, 37.7920], // Mid-estuary
      [-122.2880, 37.7960], // Near JLS / estuary exit
      [-122.2950, 37.8010], // Oakland outer harbor
      [-122.3000, 37.8100], // North along east bay
      [-122.3050, 37.8220], // Emeryville area
      [-122.3080, 37.8350], // North of Emeryville
      [-122.3110, 37.8480], // South of Berkeley
      [-122.3130, 37.8570], // Approaching Berkeley
      [-122.3150, 37.8650], // Berkeley Marina
    ],
    distance: 7.5,
    zones: ['east_bay'],
    notes: 'North through Oakland Estuary, then along east bay shoreline to Berkeley Marina.',
  },

  // ──────────────────────────────────────────
  // 67. alm → ptr
  //     Alameda to Pt Richmond
  //     North through estuary, north along east bay shore
  // ──────────────────────────────────────────
  {
    fromId: 'alm',
    toId: 'ptr',
    vesselType: 'default',
    waypoints: [
      [-122.2820, 37.7735], // Alameda
      [-122.2830, 37.7830], // North through estuary
      [-122.2850, 37.7920], // Mid-estuary
      [-122.2880, 37.7960], // Estuary exit
      [-122.2950, 37.8010], // Oakland outer harbor
      [-122.3000, 37.8100], // North along east bay
      [-122.3050, 37.8220], // Emeryville
      [-122.3080, 37.8350], // North of Emeryville
      [-122.3110, 37.8480], // South of Berkeley
      [-122.3150, 37.8650], // Berkeley Marina area
      [-122.3250, 37.8730], // Albany
      [-122.3400, 37.8830], // Point Isabel area
      [-122.3550, 37.8900], // Rounding Point Isabel
      [-122.3700, 37.8980], // South of Brooks Island
      [-122.3815, 37.9085], // Pt Richmond
    ],
    distance: 11.5,
    zones: ['east_bay', 'north_bay'],
    notes: 'North through Oakland Estuary, along east bay shoreline, past Berkeley to Pt Richmond.',
  },

  // ──────────────────────────────────────────
  // 68. aqp → hmb
  //     Aquatic Park to Half Moon Bay
  //     West to Golden Gate, through the Gate, south along coast
  //     OCEAN ROUTE — experienced boaters only
  // ──────────────────────────────────────────
  {
    fromId: 'aqp',
    toId: 'hmb',
    vesselType: 'default',
    waypoints: [
      [-122.4202, 37.8065], // Aquatic Park
      [-122.4280, 37.8090], // West along SF waterfront
      [-122.4380, 37.8110], // Past Fort Mason
      [-122.4500, 37.8150], // Crissy Field area
      [-122.4650, 37.8200], // Approaching Golden Gate from east
      [-122.4800, 37.8260], // Near Fort Point
      [-122.4850, 37.8300], // Under the Golden Gate Bridge
      [-122.4900, 37.8200], // Exiting the Gate, entering Pacific
      [-122.4950, 37.8080], // Past Mile Rock
      [-122.5020, 37.7900], // Offshore of Lands End
      [-122.5050, 37.7700], // Offshore of Ocean Beach (north)
      [-122.5050, 37.7500], // Offshore of Ocean Beach (south)
      [-122.5020, 37.7250], // Offshore of Fort Funston
      [-122.4980, 37.7000], // Offshore of Daly City coast
      [-122.4950, 37.6700], // Offshore of Pacifica
      [-122.4920, 37.6400], // Offshore of Devil's Slide
      [-122.4900, 37.6100], // Offshore of Montara
      [-122.4870, 37.5800], // Offshore of Moss Beach
      [-122.4850, 37.5500], // Approaching Pillar Point
      [-122.4840, 37.5250], // Rounding Pillar Point
      [-122.4830, 37.5100], // Entering Half Moon Bay
      [-122.4816, 37.5050], // Half Moon Bay
    ],
    distance: 30.0,
    zones: ['sf_shore', 'central_bay', 'ocean_south'],
    notes: 'OCEAN ROUTE — experienced boaters only. West from Aquatic Park through the Golden Gate then south along the coast. Bar conditions at the Gate can be extremely dangerous. Check NOAA bar forecast.',
  },

  // ──────────────────────────────────────────
  // 69. fbg → hmb
  //     Ferry Building to Half Moon Bay
  //     West along SF waterfront, through Golden Gate, south along coast
  //     OCEAN ROUTE — experienced boaters only
  // ──────────────────────────────────────────
  {
    fromId: 'fbg',
    toId: 'hmb',
    vesselType: 'default',
    waypoints: [
      [-122.3935, 37.7955], // Ferry Building
      [-122.3970, 37.7980], // North along Embarcadero
      [-122.4020, 37.8020], // Pier 15 area
      [-122.4060, 37.8050], // Pier 27
      [-122.4100, 37.8080], // Pier 39 area
      [-122.4160, 37.8080], // Fisherman's Wharf
      [-122.4250, 37.8090], // Near Aquatic Park
      [-122.4400, 37.8120], // Crissy Field
      [-122.4600, 37.8190], // Approaching Golden Gate
      [-122.4780, 37.8260], // Near Fort Point
      [-122.4850, 37.8300], // Under Golden Gate Bridge
      [-122.4900, 37.8200], // Exiting the Gate
      [-122.4950, 37.8080], // Past Mile Rock
      [-122.5020, 37.7900], // Offshore of Lands End
      [-122.5050, 37.7700], // Offshore of Ocean Beach (north)
      [-122.5050, 37.7500], // Offshore of Ocean Beach (south)
      [-122.5020, 37.7250], // Offshore of Fort Funston
      [-122.4980, 37.7000], // Offshore of Daly City
      [-122.4950, 37.6700], // Offshore of Pacifica
      [-122.4920, 37.6400], // Offshore of Devil's Slide
      [-122.4900, 37.6100], // Offshore of Montara
      [-122.4870, 37.5800], // Offshore of Moss Beach
      [-122.4850, 37.5500], // Approaching Pillar Point
      [-122.4840, 37.5250], // Rounding Pillar Point
      [-122.4830, 37.5100], // Entering Half Moon Bay
      [-122.4816, 37.5050], // Half Moon Bay
    ],
    distance: 32.0,
    zones: ['sf_shore', 'central_bay', 'ocean_south'],
    notes: 'OCEAN ROUTE — experienced boaters only. North along the Embarcadero, west through Golden Gate, then south along the coast. Very long route. Check NOAA bar forecast and ocean conditions.',
  },

  // ──────────────────────────────────────────
  // 70. fbg → mcc (already exists as #13, skip)
  //     (listed here as a reminder — route 13 covers this pair)
  // ──────────────────────────────────────────

  // ──────────────────────────────────────────
  // Additional cross-bay and intra-zone routes
  // ──────────────────────────────────────────

  // ──────────────────────────────────────────
  // 71. aqp → ang (reverse of #22, handled by lookup)
  //     — covered by ang → aqp reverse lookup
  // ──────────────────────────────────────────

  // ──────────────────────────────────────────
  // Remaining pairs involving Clipper Cove, East Bay, etc.
  // ──────────────────────────────────────────

  // ──────────────────────────────────────────
  // 72. p39 → ang (reverse of #23, handled by lookup)
  //     — covered by ang → p39 reverse lookup
  // ──────────────────────────────────────────

  // ──────────────────────────────────────────
  // 73. sau → ptr already covered as #21
  // 74. sau → mcc already covered as #19
  // 75. sau → alm already covered as #20
  // ──────────────────────────────────────────

  // ──────────────────────────────────────────
  // 76. alm → clp (reverse of #61)
  // 77. alm → jls (reverse of #16)
  // These are all handled by the reverse lookup in getWaterRoute()
  // ──────────────────────────────────────────
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
