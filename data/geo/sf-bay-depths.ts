// ============================================
// SF Bay Zone Depth Data
// Minimum charted depths (MLLW) by navigation zone
// Source: NOAA Chart 18649 (San Francisco Bay)
// ============================================

export interface ZoneDepth {
  zoneId: string;
  minDepthFt: number; // minimum charted depth in the zone (MLLW)
  typicalDepthFt: number; // typical depth in the main channel
  shallowAreas: string[]; // named shallow spots within the zone
  notes: string;
}

export const zoneDepths: ZoneDepth[] = [
  {
    zoneId: 'richardson',
    minDepthFt: 6,
    typicalDepthFt: 12,
    shallowAreas: [
      'Richardson Bay shoals (2-4ft at MLLW)',
      'Strawberry Point shallows (2ft)',
      'Near Sausalito waterfront pilings (variable)',
      'Cone Rock',
    ],
    notes:
      'Mostly navigable for all vessels in the main channel between Sausalito and Tiburon. Extensive mud flats and shoals in the center and north end of Richardson Bay expose at low tide. Stay in marked channels south of the Tiburon Peninsula. Raccoon Strait (between Angel Island and Tiburon) is deep (30-60ft) but has very strong tidal currents up to 3-4 knots.',
  },
  {
    zoneId: 'central_bay',
    minDepthFt: 30,
    typicalDepthFt: 60,
    shallowAreas: [
      'Southampton Shoal',
      'Yerba Buena Island north shoal (15ft)',
    ],
    notes:
      'Deep water throughout. Main shipping channel 60-100ft. Alcatraz surrounds are 30-60ft. No draft concerns for any recreational vessel. The "Slot" (central channel between Golden Gate and Bay Bridge) is consistently deep. Harding Rock (charted obstruction NW of Alcatraz) is marked and at 18ft — no concern for recreational vessels.',
  },
  {
    zoneId: 'sf_shore',
    minDepthFt: 10,
    typicalDepthFt: 25,
    shallowAreas: [
      'Aquatic Park inner cove (6-10ft)',
      'Mission Creek / McCovey Cove mouth (8-12ft)',
      'Pier heads — variable depth near pilings',
    ],
    notes:
      'Along the SF Embarcadero waterfront, depths are generally 10-30ft within 100m of the piers. The shipping channel is 35-55ft. Aquatic Park is a small protected cove with depths of 6-15ft. South Beach Harbor area (near Oracle Park) has 8-15ft. Crissy Field / Fort Mason area is 10-20ft nearshore. No issues for powerboats or sailboats in normal navigation corridors.',
  },
  {
    zoneId: 'east_bay',
    minDepthFt: 6,
    typicalDepthFt: 18,
    shallowAreas: [
      'Oakland Estuary edges (4-6ft at MLLW)',
      'Alameda south shore flats (2-4ft)',
      'Emeryville flats (3-5ft near shore)',
      'Oakland outer harbor shoals near breakwater (6-8ft)',
    ],
    notes:
      'Oakland Estuary maintained channel is 35ft (dredged for commercial traffic). However, outside the channel, depths drop quickly to 6-10ft. Alameda side of the estuary can be as shallow as 4ft near the edges. Oakland outer harbor has 15-25ft in the main approach. Berkeley to Oakland nearshore waters are 8-15ft. Deeper vessels (4ft+ draft) should stay in marked channels within the estuary.',
  },
  {
    zoneId: 'north_bay',
    minDepthFt: 10,
    typicalDepthFt: 22,
    shallowAreas: [
      'Brooks Island flats (4-8ft)',
      'Point Isabel shoals (5-8ft)',
      'Richmond inner harbor shoals (6-10ft)',
    ],
    notes:
      'Point Richmond / Brickyard Cove area has 10-20ft in the approach. The main channel between the central bay and San Pablo Bay is maintained at 35ft+. Brooks Island is surrounded by shallows (4-8ft). Southampton Shoal (marked by light) has 3-6ft — avoid. Red Rock area is 15-30ft. Generally navigable for all vessels in the main channel.',
  },
  {
    zoneId: 'san_pablo',
    minDepthFt: 3,
    typicalDepthFt: 12,
    shallowAreas: [
      'San Pablo Bay western flats (2-5ft)',
      'Pinole Shoal (3-6ft)',
      'Pinole Shoal boundaries',
      'Mare Island Strait entrance (6-10ft)',
      'China Camp shallows (2-4ft)',
      'Northern mudflats (0-2ft)',
    ],
    notes:
      'San Pablo Bay is significantly shallower than the central bay. The main shipping channel (maintained by Army Corps) is 35ft but is narrow. Outside the channel, depths drop to 5-12ft and large areas are 2-5ft at MLLW. Extensive mud flats in western and northern portions. Deeper-draft sailboats should stay in the marked channel. Kayaks and SUPs have no issues.',
  },
  {
    zoneId: 'south_bay',
    minDepthFt: 2,
    typicalDepthFt: 6,
    shallowAreas: [
      'Extensive tidal flats throughout (1-3ft at MLLW)',
      'Coyote Creek mouth (2-4ft)',
      'Alviso Slough (1-3ft)',
      'Redwood Creek maintained channel (12-15ft) is the exception',
      'San Mateo Bridge area shoals (3-6ft)',
      'San Bruno Shoal (2ft)',
      'Dumbarton approach',
      'Alviso mudflats (0ft)',
    ],
    notes:
      'South Bay (south of Bay Bridge to San Jose) is extremely shallow. At MLLW, vast areas have only 2-6ft of water. The main ship channel (to Redwood City port) is maintained at 30ft but is very narrow. Outside the channel, depths of 1-4ft are common. This zone is essentially impassable for sailboats at low tide and marginal for powerboats. Kayaks and SUPs can navigate but must be aware of tidal flats — getting stranded on mud flats is a real hazard.',
  },
  {
    zoneId: 'ocean_south',
    minDepthFt: 30,
    typicalDepthFt: 120,
    shallowAreas: [
      'Potato Patch/Four Fathom Bank (24ft, breaking waves in ebb)',
      'Four Fathom Bank off Pacifica (24ft)',
      'Near-shore rocks along Devil\'s Slide (variable, stay 0.5nm offshore)',
      'Pillar Point reef (6-12ft, marked)',
      'Southeast Reef at HMB approach (4ft)',
      'Noonday Rock (19.5ft)',
    ],
    notes:
      'Open Pacific Ocean south of the Golden Gate. Generally very deep (60-300ft) once past the Gate entrance. The Golden Gate bar (Potato Patch Shoal, 24-28ft charted) is the most dangerous area — large breaking waves form when ebb tide meets ocean swell, creating standing waves that can exceed 15ft. Depths along the coast are 30-100ft at 0.25nm offshore. Pillar Point Harbor entrance has 10-15ft in the channel. No draft concerns for recreational vessels in normal conditions, but sea state is the real hazard, not depth.',
  },
];

/**
 * Look up depth data for a zone.
 */
export function getZoneDepth(zoneId: string): ZoneDepth | undefined {
  return zoneDepths.find((z) => z.zoneId === zoneId);
}
