// ============================================
// SF Bay Verified Nautical Routes
//
// Research-verified routes derived from:
// - NOAA Chart 18649 (San Francisco Bay)
// - US Coast Pilot Vol 7 (Pacific Coast)
// - Cruising Guide to San Francisco Bay
//
// These routes take priority over generated routes
// in the route lookup system.
//
// Coordinates are [lng, lat] (GeoJSON order).
// Distances are nautical miles.
// ============================================

export interface VerifiedRoute {
  id: string;
  name: string;
  from: string; // destination ID
  to: string; // destination ID
  waypoints: [number, number][]; // [lng, lat] pairs
  distanceNm: number;
  minDepthFt: number;
  hazards: string;
  crossesTss: boolean;
  bridges: string;
  notes: string;
}

export const verifiedRoutes: VerifiedRoute[] = [
  // ──────────────────────────────────────────
  // 1. Sausalito → Angel Island (Ayala Cove)
  // ──────────────────────────────────────────
  {
    id: 'sau_ang',
    name: 'Sausalito to Angel Island',
    from: 'sau',
    to: 'ang',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.4583, 37.8633],
      [-122.4417, 37.865],
      [-122.4333, 37.8617],
    ],
    distanceNm: 2.0,
    minDepthFt: 4,
    hazards:
      'Raccoon Strait currents (2.5-4 kts); tidal rips at Point Stuart; Ayala Cove shoaling (4-6 ft MLLW at dock)',
    crossesTss: false,
    bridges: 'None',
    notes:
      'Cross on flood, return on ebb. 5 mph no-wake near dock. Only 16 slips open (storm repairs).',
  },

  // ──────────────────────────────────────────
  // 2. Sausalito → Tiburon (Corinthian YC)
  // ──────────────────────────────────────────
  {
    id: 'sau_tib',
    name: 'Sausalito to Tiburon',
    from: 'sau',
    to: 'tib',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.4667, 37.86],
      [-122.4583, 37.8667],
      [-122.4517, 37.8703],
    ],
    distanceNm: 2.0,
    minDepthFt: 5,
    hazards:
      'Richardson Bay shoals (~5 ft avg); dense moored vessels; Hurricane Gulch afternoon westerlies',
    crossesTss: false,
    bridges: 'None',
    notes:
      '5 mph speed limit in Richardson Bay. Stay in marked channel (8-12 ft).',
  },

  // ──────────────────────────────────────────
  // 3. Sausalito → SF Marina / Gas House Cove
  // ──────────────────────────────────────────
  {
    id: 'sau_sfm',
    name: 'Sausalito to SF Marina',
    from: 'sau',
    to: 'aqp',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.475, 37.85],
      [-122.4583, 37.8333],
      [-122.4417, 37.8083],
      [-122.43, 37.805],
    ],
    distanceNm: 3.0,
    minDepthFt: 6,
    hazards:
      'High-speed ferry traffic; kite surfers near Crissy Field; SF Marina dredging (2026)',
    crossesTss: false,
    bridges: 'None',
    notes:
      'Stays west of main shipping lanes. Aquatic Park nearby: no power vessels, 3-knot limit.',
  },

  // ──────────────────────────────────────────
  // 4. Sausalito → Pier 39 / Fisherman's Wharf
  // ──────────────────────────────────────────
  {
    id: 'sau_p39',
    name: 'Sausalito to Pier 39',
    from: 'sau',
    to: 'p39',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.475, 37.85],
      [-122.425, 37.815],
      [-122.42, 37.8083],
      [-122.4083, 37.81],
    ],
    distanceNm: 3.0,
    minDepthFt: 10,
    hazards:
      'Central Bay shipping lanes; Alcatraz tour boats; Harding Rock (36 ft, lighted buoy); currents 3-4 kts near Alcatraz',
    crossesTss: true,
    bridges: 'None',
    notes: 'Monitor VHF 14; cross shipping lanes at right angles.',
  },

  // ──────────────────────────────────────────
  // 5. Sausalito → South Beach Harbor
  // ──────────────────────────────────────────
  {
    id: 'sau_sbh',
    name: 'Sausalito to South Beach Harbor',
    from: 'sau',
    to: 'fbg',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.475, 37.85],
      [-122.425, 37.815],
      [-122.3917, 37.7967],
      [-122.3833, 37.7883],
      [-122.3833, 37.7817],
    ],
    distanceNm: 5.0,
    minDepthFt: 8,
    hazards:
      'Central Bay shipping lanes; Bay Bridge pier eddies; ferry convergence at Ferry Building; 15 ft shoal off YBI',
    crossesTss: true,
    bridges: 'Bay Bridge West Span: 220 ft MHHW',
    notes:
      'Pass under center of Bay Bridge West Span. Current 2-3 kts through YBI-SF constriction.',
  },

  // ──────────────────────────────────────────
  // 6. Sausalito → Clipper Cove / Treasure Island
  // ──────────────────────────────────────────
  {
    id: 'sau_clp',
    name: 'Sausalito to Clipper Cove',
    from: 'sau',
    to: 'clp',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.425, 37.815],
      [-122.375, 37.815],
      [-122.37, 37.82],
      [-122.3667, 37.8217],
    ],
    distanceNm: 6.0,
    minDepthFt: 4,
    hazards:
      'CRITICAL: Large shoal at Clipper Cove entrance (4-5 ft MLLW); USCG restricted area east of YBI',
    crossesTss: true,
    bridges: 'Bay Bridge West Span: 220 ft MHHW (if passing under)',
    notes:
      'Enter only on rising tide, within 2 hrs of high water. Hug Pier 1 on starboard. Boats with 5+ ft draft have grounded.',
  },

  // ──────────────────────────────────────────
  // 7. Sausalito → Berkeley Marina
  // ──────────────────────────────────────────
  {
    id: 'sau_brk',
    name: 'Sausalito to Berkeley Marina',
    from: 'sau',
    to: 'brk',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.425, 37.8417],
      [-122.4167, 37.83],
      [-122.3667, 37.85],
      [-122.325, 37.8667],
    ],
    distanceNm: 6.0,
    minDepthFt: 4,
    hazards:
      'Central Bay shipping; Blossom Rock; Southampton Shoal; Berkeley Marina extremely shallow—ONLY use south entrance',
    crossesTss: true,
    bridges: 'None',
    notes:
      'Never use north entrance. V-buoys mark 4-5 ft spots. Strong wind shifts at south breakwater.',
  },

  // ──────────────────────────────────────────
  // 8. Sausalito → Emeryville Marina
  // ──────────────────────────────────────────
  {
    id: 'sau_emv',
    name: 'Sausalito to Emeryville Marina',
    from: 'sau',
    to: 'alm',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.425, 37.8417],
      [-122.4, 37.825],
      [-122.3333, 37.8417],
      [-122.3133, 37.8367],
    ],
    distanceNm: 5.0,
    minDepthFt: 8,
    hazards:
      'Central Bay shipping; Blossom Rock; Emeryville Crescent mudflats south of marina',
    crossesTss: true,
    bridges: 'None',
    notes:
      'Approach shallower than Berkeley; careful attention to channel markers.',
  },

  // ──────────────────────────────────────────
  // 9. Sausalito → Oakland / Jack London Square
  // ──────────────────────────────────────────
  {
    id: 'sau_jls',
    name: 'Sausalito to Jack London Square',
    from: 'sau',
    to: 'jls',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.475, 37.85],
      [-122.425, 37.825],
      [-122.4167, 37.815],
      [-122.375, 37.8],
      [-122.3583, 37.8],
      [-122.3333, 37.7967],
      [-122.2771, 37.7939],
    ],
    distanceNm: 10.0,
    minDepthFt: 15,
    hazards:
      'Container ships and tugboats in Oakland Harbor; Bay Bridge pier eddies; ferry traffic at JLS',
    crossesTss: true,
    bridges: 'Bay Bridge West Span: 220 ft MHHW',
    notes:
      'Oakland Estuary is narrow channel (Inland Rule 9). Estuary has 50 ft project depth.',
  },

  // ──────────────────────────────────────────
  // 10. Sausalito → Richmond Marina Bay
  // ──────────────────────────────────────────
  {
    id: 'sau_ric',
    name: 'Sausalito to Richmond Marina Bay',
    from: 'sau',
    to: 'ptr',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.4333, 37.865],
      [-122.4083, 37.875],
      [-122.3917, 37.8917],
      [-122.375, 37.9083],
      [-122.3583, 37.9083],
    ],
    distanceNm: 8.0,
    minDepthFt: 8,
    hazards:
      'Southampton Shoal; Chevron Long Wharf 100-yd security zone; Red Rock island',
    crossesTss: true,
    bridges: 'None',
    notes: 'Monitor VHF 14 for tanker movements. No-wake in harbor.',
  },

  // ──────────────────────────────────────────
  // 11. Sausalito → Point San Pablo YH
  // ──────────────────────────────────────────
  {
    id: 'sau_psp',
    name: 'Sausalito to Point San Pablo',
    from: 'sau',
    to: 'srf',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.425, 37.8667],
      [-122.4, 37.8917],
      [-122.4083, 37.9333],
      [-122.4133, 37.9633],
      [-122.4167, 37.9617],
    ],
    distanceNm: 12.0,
    minDepthFt: 6,
    hazards:
      'Invincible Rock (7 ft, Red #16); Whiting Rock (13 ft, Red #18); The Sisters; currents >3 kts at Point San Pablo',
    crossesTss: true,
    bridges: 'Richmond-San Rafael Bridge: 185 ft main / 135 ft secondary',
    notes:
      'Use main (western) channel at bridge. Harbor approach only 6 ft MLLW.',
  },

  // ──────────────────────────────────────────
  // 12. Sausalito → Vallejo
  // ──────────────────────────────────────────
  {
    id: 'sau_val',
    name: 'Sausalito to Vallejo',
    from: 'sau',
    to: 'val',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.425, 37.8667],
      [-122.4, 37.9333],
      [-122.3667, 37.9667],
      [-122.3083, 38.0667],
      [-122.275, 38.075],
      [-122.2667, 38.0917],
      [-122.2633, 38.1],
    ],
    distanceNm: 20.0,
    minDepthFt: 6,
    hazards:
      'Pinole Shoal RNA (rec vessels prohibited—transit south); Vallejo guest docks very shallow; San Pablo Bay steep chop',
    crossesTss: true,
    bridges: 'Richmond-San Rafael: 185/135 ft',
    notes:
      'Ride flood tide north. Transit south of Pinole Shoal Channel (15-19 ft). Check Chart 18655.',
  },

  // ──────────────────────────────────────────
  // 13. Sausalito → Benicia
  // ──────────────────────────────────────────
  {
    id: 'sau_ben',
    name: 'Sausalito to Benicia',
    from: 'sau',
    to: 'ben',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.425, 37.8667],
      [-122.4, 37.9333],
      [-122.3667, 37.9667],
      [-122.3333, 38.0],
      [-122.3167, 38.0333],
      [-122.225, 38.0583],
      [-122.1667, 38.0467],
      [-122.1583, 38.0417],
      [-122.1574, 38.0449],
    ],
    distanceNm: 23.0,
    minDepthFt: 15,
    hazards:
      'Pinole Shoal RNA; Carquinez Strait tankers in narrow channel; currents >3 kts; wind-against-current chop',
    crossesTss: true,
    bridges:
      'Richmond-San Rafael: 185/135 ft; Carquinez (I-80): 148 ft; Benicia-Martinez (I-680): 138 ft',
    notes:
      'Full-day passage. Depart on rising flood. Follow Green #23 and #25 buoys to marina entrance.',
  },

  // ──────────────────────────────────────────
  // 14. Sausalito → Oyster Point
  // ──────────────────────────────────────────
  {
    id: 'sau_oyp',
    name: 'Sausalito to Oyster Point',
    from: 'sau',
    to: 'oyp',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.425, 37.815],
      [-122.3833, 37.7883],
      [-122.375, 37.775],
      [-122.3667, 37.6583],
      [-122.38, 37.6633],
    ],
    distanceNm: 10.0,
    minDepthFt: 2,
    hazards:
      'Central Bay shipping; San Bruno Shoal (2 ft MLLW—stay in marked channel); South Bay mudflats',
    crossesTss: true,
    bridges: 'Bay Bridge West Span: 220 ft MHHW',
    notes:
      'Stay strictly in marked South Bay channel. Verify depths with harbormaster.',
  },

  // ──────────────────────────────────────────
  // 15. Sausalito → Redwood City
  // ──────────────────────────────────────────
  {
    id: 'sau_rwc',
    name: 'Sausalito to Redwood City',
    from: 'sau',
    to: 'rwc',
    waypoints: [
      [-122.4833, 37.8583],
      [-122.425, 37.815],
      [-122.3833, 37.7883],
      [-122.375, 37.775],
      [-122.3667, 37.65],
      [-122.25, 37.5833],
      [-122.2167, 37.5083],
      [-122.2083, 37.505],
    ],
    distanceNm: 25.0,
    minDepthFt: 10,
    hazards:
      'San Bruno Shoal (2 ft MLLW); South Bay 1-3 ft outside channels; Redwood Creek shoaling',
    crossesTss: true,
    bridges: 'Bay Bridge: 220 ft; San Mateo-Hayward: 135 ft',
    notes:
      'Most demanding route. Arrive on rising/high tide. Not advisable S of San Mateo Bridge without local knowledge.',
  },
];
