import type { Source } from '@/engine/types';

export interface DockInfo {
  name: string;
  destinationId: string;
  dockType: 'marina_guest' | 'public_guest' | 'restaurant_dock' | 'state_park' | 'yacht_club';
  lat: number;
  lng: number;
  fees: string;
  hours: string;
  depthFt: string;
  maxLoa: string;
  restrictions: string;
  amenities: string;
  dineOptions: string[];
  sources: Source[];
}

export const docks: DockInfo[] = [
  // ── Tiburon ──────────────────────────────────────────────────────────
  {
    name: "Sam's Anchor Cafe",
    destinationId: 'tib',
    dockType: 'restaurant_dock',
    lat: 37.8723,
    lng: -122.4554,
    fees: 'Free with dining (2-hr limit)',
    hours: 'Restaurant hours (10am-9pm)',
    depthFt: '2.5-4 ft MLLW — HIGH GROUNDING RISK at low tide',
    maxLoa: '40 ft',
    restrictions:
      'Dining required. Extreme shallow water — sailboats and deep-draft vessels will ground at low tide. Charter fleets prohibit this dock.',
    amenities: 'Waterfront dining, outdoor deck',
    dineOptions: ["Sam's Anchor Cafe"],
    sources: [
      {
        name: 'Cruising Guide to SF Bay (Mehaffy, 3rd ed.)',
        url: null,
        date: '2016',
        section: 'Tiburon chapter',
      },
      {
        name: 'ActiveCaptain community reviews',
        url: 'https://activecaptain.garmin.com/',
        date: '2025',
      },
      {
        name: "Sam's Anchor Cafe",
        url: 'https://www.samscafe.com',
        date: '2026-03',
      },
    ],
  },
  {
    name: 'Luna Blu / Servino (Tiburon waterfront)',
    destinationId: 'tib',
    dockType: 'restaurant_dock',
    lat: 37.873,
    lng: -122.4565,
    fees: 'Free short-term with dining (via adjacent docks)',
    hours: 'Restaurant hours',
    depthFt: '3-4 ft MLLW — shallow',
    maxLoa: '40 ft',
    restrictions:
      "No dedicated dock — use Sam's or public docks. Shallow water warnings apply.",
    amenities: 'Walk to multiple Tiburon waterfront restaurants',
    dineOptions: ['Luna Blu', 'Servino Ristorante', 'The Caprice', 'Petite Left Bank'],
    sources: [
      {
        name: 'Cruising Guide to SF Bay (Mehaffy, 3rd ed.)',
        url: null,
        date: '2016',
        section: 'Tiburon chapter',
      },
      {
        name: 'Yelp — Tiburon waterfront restaurants',
        url: 'https://www.yelp.com/search?find_desc=waterfront+restaurant&find_loc=Tiburon+CA',
        date: '2026-03',
      },
    ],
  },

  // ── Schoonmaker ──────────────────────────────────────────────────────
  {
    name: 'Schoonmaker Point Marina (Le Garage)',
    destinationId: 'skm',
    dockType: 'marina_guest',
    lat: 37.8681,
    lng: -122.4938,
    fees: '$20 flat for 4 hours',
    hours: '8am-4pm M-F (closed weekends)',
    depthFt: '8 ft',
    maxLoa: '70 ft',
    restrictions: 'Check-in with harbormaster required. Tie up on North Dock for Le Garage access.',
    amenities: 'Secure docks, showers, high-capacity shore power',
    dineOptions: ['Le Garage Cafe'],
    sources: [
      {
        name: 'Schoonmaker Point Marina',
        url: 'https://www.schoonmakerpointmarina.com',
        date: '2026-03',
      },
      {
        name: 'Dockwa — Schoonmaker Point',
        url: 'https://dockwa.com/explore/destination/schoonmaker-point-marina',
        date: '2026-03',
      },
    ],
  },

  // ── Sausalito ────────────────────────────────────────────────────────
  {
    name: 'Clipper Yacht Harbor (Fish.)',
    destinationId: 'sau',
    dockType: 'marina_guest',
    lat: 37.8654,
    lng: -122.4952,
    fees: 'Free short-term for diners on south dock',
    hours: '8am-5pm',
    depthFt: '7 ft',
    maxLoa: '60 ft',
    restrictions:
      'Tie up strictly on South Dock for Fish. access. Advanced notice recommended.',
    amenities: 'Fuel dock (gas/diesel), pumpout, laundry, showers, boatyard',
    dineOptions: ['Fish.'],
    sources: [
      {
        name: 'Clipper Yacht Harbor',
        url: 'https://www.clipperyacht.com',
        date: '2026-03',
      },
      {
        name: 'Cruising Guide to SF Bay (Mehaffy, 3rd ed.)',
        url: null,
        date: '2016',
        section: 'Sausalito chapter',
      },
    ],
  },
  {
    name: 'Sausalito Yacht Harbor',
    destinationId: 'sau',
    dockType: 'marina_guest',
    lat: 37.855,
    lng: -122.478,
    fees: 'Variable per-foot rate',
    hours: '9am-5pm',
    depthFt: '10 ft',
    maxLoa: '80 ft',
    restrictions: 'High traffic area; reservations strongly recommended.',
    amenities: 'Guest slips, walk to downtown Sausalito',
    dineOptions: [
      'Poggio Trattoria',
      "Scoma's of Sausalito",
      'The Spinnaker',
      'Copita',
      'Barrel House Tavern',
    ],
    sources: [
      {
        name: 'Sausalito Yacht Harbor',
        url: 'https://www.sausalitoyachtharbor.com',
        date: '2026-03',
      },
      {
        name: 'Cruising Guide to SF Bay (Mehaffy, 3rd ed.)',
        url: null,
        date: '2016',
        section: 'Sausalito chapter',
      },
    ],
  },

  // ── Pier 39 ──────────────────────────────────────────────────────────
  {
    name: 'Pier 39 Marina',
    destinationId: 'p39',
    dockType: 'marina_guest',
    lat: 37.8095,
    lng: -122.4115,
    fees: '$25 day stay (8am-3pm); $50 overnight',
    hours: '8am-3pm (day stay); closed Sun-Mon office',
    depthFt: '14 ft',
    maxLoa: '85 ft',
    restrictions:
      'Seasonal only (March to mid-October). Advanced reservations mandatory (24+ hrs). No same-day requests. No pick-up/drop-off.',
    amenities: 'Pumpout (mobile), Pier 39 shops',
    dineOptions: [
      'Fog Harbor Fish House',
      'Crab House',
      'Pier Market Seafood',
      'Swiss Louis',
      'Wipeout Bar & Grill',
    ],
    sources: [
      {
        name: 'Pier 39 Marina',
        url: 'https://www.pier39.com/merchant/pier-39-marina/',
        date: '2026-03',
      },
      {
        name: 'Dockwa — Pier 39',
        url: 'https://dockwa.com/explore/destination/pier-39-marina',
        date: '2026-03',
      },
      {
        name: 'US Coast Pilot Vol 7',
        url: 'https://nauticalcharts.noaa.gov/publications/coast-pilot/',
        date: '2026-03',
        section: 'Chapter 7',
      },
    ],
  },

  // ── SF Waterfront / South Beach ──────────────────────────────────────
  {
    name: 'South Beach Harbor',
    destinationId: 'fbg',
    dockType: 'public_guest',
    lat: 37.7811,
    lng: -122.3873,
    fees: '$30 flat (<3 hrs); $1.50/ft/day (min $42); $3/ft over 50ft. Hourly rates suspended on game days.',
    hours: '8:30am-5pm',
    depthFt: '9 ft',
    maxLoa: '50 ft',
    restrictions:
      '14-day max stay. Key card access ($20 deposit). Advanced reservation recommended.',
    amenities: 'Secure concrete docks, 30/50A power, showers, laundry, 640-ft guest dock',
    dineOptions: ['Waterbar', 'EPIC Steak', 'ATwater Tavern', 'Mission Rock Resort'],
    sources: [
      {
        name: 'South Beach Harbor / SF Rec & Park',
        url: 'https://sfrecpark.org/facilities/facility/details/south-beach-harbor-234',
        date: '2026-03',
      },
      {
        name: 'Dockwa — South Beach Harbor',
        url: 'https://dockwa.com/explore/destination/south-beach-harbor',
        date: '2026-03',
      },
    ],
  },

  // ── Aquatic Park / Marina District ───────────────────────────────────
  {
    name: 'San Francisco Marina (Gas House Cove)',
    destinationId: 'aqp',
    dockType: 'marina_guest',
    lat: 37.8088,
    lng: -122.4395,
    fees: '$2-4/ft/night (seasonal: $4 Jun-Oct, $2 Nov-May)',
    hours: '8:30am-4:30pm',
    depthFt: '10-12 ft (dredging active in West Entry Channel)',
    maxLoa: '90 ft (15 end-ties)',
    restrictions:
      '30-day advance digital reservation required. Must upload insurance, USCG docs, photo ID. No day rates. Overnight only.',
    amenities: 'Fuel dock (City Yachts in Gas House Cove), 24-hr pumpout, 30/50A power',
    dineOptions: ['Marina District restaurants (walk)'],
    sources: [
      {
        name: 'SF Marina / Rec & Park',
        url: 'https://sfrecpark.org/facilities/facility/details/san-francisco-marina-small-craft-harbor-227',
        date: '2026-03',
      },
      {
        name: 'Cruising Guide to SF Bay (Mehaffy, 3rd ed.)',
        url: null,
        date: '2016',
        section: 'San Francisco chapter',
      },
    ],
  },

  // ── McCovey Cove ─────────────────────────────────────────────────────
  {
    name: 'McCovey Cove',
    destinationId: 'mcc',
    dockType: 'public_guest',
    lat: 37.777,
    lng: -122.3895,
    fees: 'Free anchorage',
    hours: '24 hours',
    depthFt: '10-15 ft',
    maxLoa: 'No limit',
    restrictions:
      'Strict anchoring boundaries during Giants games. High vessel density on game days. No-wake.',
    amenities: 'Anchorage with Oracle Park views',
    dineOptions: ['Oracle Park concessions (via kayak/dinghy)'],
    sources: [
      {
        name: 'SF Giants / Oracle Park',
        url: 'https://www.mlb.com/giants/ballpark',
        date: '2026-03',
      },
      {
        name: 'ActiveCaptain community reviews',
        url: 'https://activecaptain.garmin.com/',
        date: '2025',
      },
    ],
  },

  // ── Jack London Square / Oakland Estuary ─────────────────────────────
  {
    name: 'Jack London Square Public Dock',
    destinationId: 'jls',
    dockType: 'public_guest',
    lat: 37.7942,
    lng: -122.2778,
    fees: 'FREE daytime use',
    hours: 'Sunrise to sunset',
    depthFt: '15 ft (estuary)',
    maxLoa: '80 ft',
    restrictions:
      'First-come, first-served. Side-tie only. NO overnight berthing. Intermediate docking skills required (ferry wakes).',
    amenities: 'Modern docks, lockable dock boxes, water, restrooms, Amtrak access',
    dineOptions: [
      "Scott's Seafood",
      'Seabreeze on the Dock',
      'Lungomare',
      'Farmhouse Kitchen Thai',
      "Yoshi's",
      "Heinold's First and Last Chance Saloon",
    ],
    sources: [
      {
        name: 'Port of Oakland — Jack London Square',
        url: 'https://www.jacklondonsquare.com',
        date: '2026-03',
      },
      {
        name: 'Cruising Guide to SF Bay (Mehaffy, 3rd ed.)',
        url: null,
        date: '2016',
        section: 'Oakland chapter',
      },
    ],
  },
  {
    name: 'Pasta Pelican',
    destinationId: 'jls',
    dockType: 'restaurant_dock',
    lat: 37.7915,
    lng: -122.2721,
    fees: 'Free with dining',
    hours: 'Restaurant hours',
    depthFt: '10 ft (estuary)',
    maxLoa: '50 ft',
    restrictions: 'Customers only. Call ahead required: (510) 864-7427',
    amenities: 'Direct restaurant access',
    dineOptions: ['Pasta Pelican'],
    sources: [
      {
        name: 'Pasta Pelican',
        url: 'https://www.pastapelican.com',
        date: '2026-03',
      },
      {
        name: 'ActiveCaptain community reviews',
        url: 'https://activecaptain.garmin.com/',
        date: '2025',
      },
    ],
  },
  {
    name: "Quinn's Lighthouse",
    destinationId: 'jls',
    dockType: 'restaurant_dock',
    lat: 37.794,
    lng: -122.276,
    fees: 'Free with dining',
    hours: 'Restaurant hours',
    depthFt: '10 ft (estuary)',
    maxLoa: '60 ft',
    restrictions: 'Customers only',
    amenities: 'Direct restaurant access, estuary views',
    dineOptions: ["Quinn's Lighthouse"],
    sources: [
      {
        name: "Quinn's Lighthouse",
        url: 'https://www.quinnslighthouse.com',
        date: '2026-03',
      },
      {
        name: 'ActiveCaptain community reviews',
        url: 'https://activecaptain.garmin.com/',
        date: '2025',
      },
    ],
  },

  // ── Alameda / Emeryville ─────────────────────────────────────────────
  {
    name: 'Grand Marina (Alameda)',
    destinationId: 'alm',
    dockType: 'marina_guest',
    lat: 37.7788,
    lng: -122.2522,
    fees: '$1/ft/day',
    hours: 'Regular business hours',
    depthFt: '10 ft MLW; 25 ft approach',
    maxLoa: '60 ft',
    restrictions: 'Double-fingered concrete berths',
    amenities: 'Wide concrete docks, bike/rideshare to downtown Alameda',
    dineOptions: [],
    sources: [
      {
        name: 'Grand Marina',
        url: 'https://www.grandmarina.com',
        date: '2026-03',
      },
      {
        name: 'Dockwa — Grand Marina',
        url: 'https://dockwa.com/explore/destination/grand-marina',
        date: '2026-03',
      },
    ],
  },
  {
    name: 'Oakland Yacht Club',
    destinationId: 'alm',
    dockType: 'yacht_club',
    lat: 37.7835,
    lng: -122.263,
    fees: 'Reciprocal / guest fees apply',
    hours: '24 hours (check-in required)',
    depthFt: '12 ft',
    maxLoa: '60 ft',
    restrictions: 'Located on West side of Dock 2. Reciprocal club members or guests.',
    amenities: '30-amp power, potable water, bar, restaurant, live music',
    dineOptions: ['OYC Galley'],
    sources: [
      {
        name: 'Oakland Yacht Club',
        url: 'https://www.oaklandyachtclub.com',
        date: '2026-03',
      },
    ],
  },
  {
    name: 'Emeryville Marina (Safe Harbor)',
    destinationId: 'alm',
    dockType: 'marina_guest',
    lat: 37.837,
    lng: -122.295,
    fees: '$1.50/ft/day; weekly/monthly available',
    hours: '8:30am-5pm',
    depthFt: '10-14 ft',
    maxLoa: '80 ft',
    restrictions: 'Keyed entry, overnight security. 382 slips total.',
    amenities:
      'Full-service restrooms, showers, laundry, free WiFi, cable TV, fuel dock, oil disposal, Emery-Go-Round bus',
    dineOptions: ['Bay Street Mall restaurants (via Emery-Go-Round bus)'],
    sources: [
      {
        name: 'Safe Harbor Emeryville',
        url: 'https://shmarinas.com/locations/safe-harbor-emeryville/',
        date: '2026-03',
      },
      {
        name: 'Dockwa — Emeryville',
        url: 'https://dockwa.com/explore/destination/emery-cove-yacht-harbor',
        date: '2026-03',
      },
    ],
  },

  // ── Berkeley ─────────────────────────────────────────────────────────
  {
    name: 'Berkeley Marina',
    destinationId: 'brk',
    dockType: 'marina_guest',
    lat: 37.8655,
    lng: -122.3168,
    fees: 'Free (<4 hrs); $18 day rate',
    hours: '8am-4pm',
    depthFt: '8-10 ft (approach channel)',
    maxLoa: '100 ft',
    restrictions:
      'ONLY use south entrance. 4-hour limit for free docking. $1,000 penalty for abandoned vessels.',
    amenities: 'Fuel, pumpout, launch ramp, showers, extensive public park',
    dineOptions: ['Skates on the Bay'],
    sources: [
      {
        name: 'Berkeley Marina',
        url: 'https://www.cityofberkeley.info/marina/',
        date: '2026-03',
      },
      {
        name: 'Cruising Guide to SF Bay (Mehaffy, 3rd ed.)',
        url: null,
        date: '2016',
        section: 'Berkeley chapter',
      },
    ],
  },

  // ── Richmond / Pt Richmond ──────────────────────────────────────────
  {
    name: 'Marina Bay Yacht Harbor (Richmond)',
    destinationId: 'ptr',
    dockType: 'marina_guest',
    lat: 37.9135,
    lng: -122.3551,
    fees: '$1/ft/day (<100ft); $1.50/ft (>100ft); $18 flat day rate',
    hours: '9am-5pm',
    depthFt: '10+ ft MLW',
    maxLoa: '150 ft',
    restrictions:
      'Call ahead for >100ft. Dock immediately adjacent to Lara\'s is RED-TAGGED — must use Harbormaster dock (0.1 mi walk).',
    amenities: '2 free pumpouts, 30/50A power, laundry, showers, concrete docks',
    dineOptions: ["Lara's Fine Dining", 'Assemble (Craneway Pavilion, 0.3 mi walk)'],
    sources: [
      {
        name: 'Marina Bay Yacht Harbor',
        url: 'https://www.marinabayyachtharbor.com',
        date: '2026-03',
      },
      {
        name: 'Dockwa — Marina Bay',
        url: 'https://dockwa.com/explore/destination/marina-bay-yacht-harbor',
        date: '2026-03',
      },
      {
        name: 'ActiveCaptain — dock warning',
        url: 'https://activecaptain.garmin.com/',
        date: '2025',
      },
    ],
  },
  {
    name: 'Brickyard Cove Marina (Pt Richmond)',
    destinationId: 'ptr',
    dockType: 'marina_guest',
    lat: 37.9224,
    lng: -122.3735,
    fees: 'Call for transient rates',
    hours: 'Regular business hours',
    depthFt: 'varies (verify locally)',
    maxLoa: 'varies',
    restrictions: 'Check with harbormaster. Point Richmond area.',
    amenities: 'Protected cove, walk to Point Richmond village',
    dineOptions: ['Assemble (Craneway Pavilion)', 'Armistice Brewing'],
    sources: [
      {
        name: 'Brickyard Cove Marina',
        url: 'https://www.brickyardcove.com',
        date: '2026-03',
      },
    ],
  },

  // ── Vallejo ──────────────────────────────────────────────────────────
  {
    name: 'Vallejo Municipal Marina',
    destinationId: 'val',
    dockType: 'marina_guest',
    lat: 38.1022,
    lng: -122.2641,
    fees: '$10 day use; $1/ft/night',
    hours: '24 hours; office call (707) 648-4370',
    depthFt: 'Variable — EXTREME SILTATION. < 4 ft in spots. Approach on rising tide ONLY.',
    maxLoa: '110 ft',
    restrictions:
      'Not dredged in 25+ years. Unmarked mud shoal in middle of south guest dock. Deep-draft vessels: high tide only.',
    amenities: 'Fuel dock, 2 free pumpouts, 30/50A power, showers, laundry, boatyard',
    dineOptions: ['Sardine Can', "Zio Fraedo's", 'Mare Island Brewing Co. Ferry Taproom'],
    sources: [
      {
        name: 'Vallejo Municipal Marina (F3 Marina)',
        url: 'https://www.f3marina.com/vallejo',
        date: '2026-03',
      },
      {
        name: 'ActiveCaptain — siltation warnings',
        url: 'https://activecaptain.garmin.com/',
        date: '2025',
      },
      {
        name: 'Cruising Guide to SF Bay (Mehaffy, 3rd ed.)',
        url: null,
        date: '2016',
        section: 'Vallejo chapter',
      },
    ],
  },

  // ── Benicia ──────────────────────────────────────────────────────────
  {
    name: 'Benicia Marina',
    destinationId: 'ben',
    dockType: 'marina_guest',
    lat: 38.0456,
    lng: -122.1614,
    fees: 'Variable; call ahead',
    hours: '8am-5pm; 24-hr fuel dock',
    depthFt: '12 ft',
    maxLoa: '75 ft',
    restrictions:
      'Strong currents in Carquinez Strait outside breakwater. Advance inquiry suggested.',
    amenities: '24-hr fuel, pumpout, walk to historic downtown Benicia',
    dineOptions: ["Sailor Jack's", 'Bella Siena', 'Lucca Bar & Grill'],
    sources: [
      {
        name: 'Benicia Marina',
        url: 'https://www.ci.benicia.ca.us/marina',
        date: '2026-03',
      },
      {
        name: 'Cruising Guide to SF Bay (Mehaffy, 3rd ed.)',
        url: null,
        date: '2016',
        section: 'Benicia chapter',
      },
    ],
  },

  // ── Angel Island ─────────────────────────────────────────────────────
  {
    name: 'Ayala Cove (Angel Island State Park)',
    destinationId: 'ang',
    dockType: 'state_park',
    lat: 37.86,
    lng: -122.42,
    fees: '$15 day / $30 overnight (moorings)',
    hours: 'Daylight; call (415) 435-5390',
    depthFt: '5-6 ft MLLW at moorings; 3.5 ft NE interior',
    maxLoa: '50 ft',
    restrictions:
      'First-come, first-served. Only 16 slips open (storm repairs through Nov 2025). Fore-and-aft mooring on color-coded buoys required. 27 mooring buoys available.',
    amenities: 'Island hiking, BBQs, self-pay station, park restrooms',
    dineOptions: ['Angel Island Cafe'],
    sources: [
      {
        name: 'California State Parks — Angel Island',
        url: 'https://www.parks.ca.gov/?page_id=468',
        date: '2026-03',
      },
      {
        name: 'Angel Island Association',
        url: 'https://angelisland.org',
        date: '2026-03',
      },
      {
        name: 'Cruising Guide to SF Bay (Mehaffy, 3rd ed.)',
        url: null,
        date: '2016',
        section: 'Angel Island chapter',
      },
    ],
  },

  // ── South Bay ────────────────────────────────────────────────────────
  {
    name: 'Westpoint Harbor (Hurrica Restaurant)',
    destinationId: 'rwc',
    dockType: 'marina_guest',
    lat: 37.5052,
    lng: -122.2081,
    fees: '$2/ft/night (up to 50ft); higher for larger vessels',
    hours: '9am-6pm daily',
    depthFt: '8.5-10 ft draft clearance',
    maxLoa: '120 ft',
    restrictions:
      'Strict: vessel inspection, photos, $500K insurance required. 90-day max stay. Follow Westpoint Slough markers carefully after green marker 13.',
    amenities: 'Slip-side vacuum pumpout, Valvtect fuel, gigabit WiFi, bike lockers, helipad',
    dineOptions: ['Hurrica Restaurant & Bar'],
    sources: [
      {
        name: 'Westpoint Harbor',
        url: 'https://www.westpointharbor.com',
        date: '2026-03',
      },
      {
        name: 'Dockwa — Westpoint Harbor',
        url: 'https://dockwa.com/explore/destination/westpoint-harbor',
        date: '2026-03',
      },
    ],
  },
  {
    name: 'Redwood City Municipal Marina',
    destinationId: 'rwc',
    dockType: 'marina_guest',
    lat: 37.5088,
    lng: -122.2135,
    fees: 'Call (~$1.50-2/ft)',
    hours: '7:30am-5:30pm M-Th, 8am-5pm Fri',
    depthFt: '10 ft at low tide',
    maxLoa: '50 ft',
    restrictions: 'Online application for temporary berth required. 190 berths.',
    amenities: 'Electric, water, pumpout, restrooms, showers, laundry',
    dineOptions: [],
    sources: [
      {
        name: 'Port of Redwood City',
        url: 'https://www.redwoodcityport.com/marina',
        date: '2026-03',
      },
      {
        name: 'ActiveCaptain community reviews',
        url: 'https://activecaptain.garmin.com/',
        date: '2025',
      },
    ],
  },
  {
    name: 'Oyster Point Marina',
    destinationId: 'oyp',
    dockType: 'marina_guest',
    lat: 37.664,
    lng: -122.378,
    fees: '$0.78/ft/day (150% for multihulls)',
    hours: 'Regular business hours',
    depthFt: '8-10 ft',
    maxLoa: 'varies',
    restrictions: 'Lowest transient rate in region',
    amenities: 'Fuel dock, launch ramp, free pumpout, ferry access, parkland',
    dineOptions: [],
    sources: [
      {
        name: 'San Mateo County Harbor District',
        url: 'https://www.smcharbor.com/oyster-point-marina',
        date: '2026-03',
      },
    ],
  },
  {
    name: 'Coyote Point Marina',
    destinationId: 'cop',
    dockType: 'marina_guest',
    lat: 37.5869,
    lng: -122.32,
    fees: 'Call for rates',
    hours: 'Regular business hours',
    depthFt: '6 ft MLW (inner basins); 8 ft approach',
    maxLoa: 'varies',
    restrictions:
      'Report to Harbormaster NW side for slip assignment. Protected basin behind tree-covered outcropping.',
    amenities: 'Launch ramp, Coyote Point Yacht Club, weekly racing, youth sailing',
    dineOptions: [],
    sources: [
      {
        name: 'San Mateo County Harbor District',
        url: 'https://www.smcharbor.com/coyote-point-marina',
        date: '2026-03',
      },
    ],
  },
  {
    name: 'Brisbane Marina (Sierra Point)',
    destinationId: 'cop',
    dockType: 'marina_guest',
    lat: 37.68,
    lng: -122.38,
    fees: '$25 flat (<35ft); $0.85-1.00/ft for larger',
    hours: 'Regular business hours',
    depthFt: '9 ft MLW at dock; 3-7 ft approach channel',
    maxLoa: '100 ft (250-ft guest dock)',
    restrictions: 'Harbormaster approval and documentation required.',
    amenities: 'Night security, pumpout, 580 berths',
    dineOptions: [],
    sources: [
      {
        name: 'Brisbane Marina',
        url: 'https://www.brisbaneca.org/marina',
        date: '2026-03',
      },
    ],
  },

  // ── Embarcadero ──────────────────────────────────────────────────────
  {
    name: 'Pier 1.5 (Embarcadero)',
    destinationId: 'fbg',
    dockType: 'public_guest',
    lat: 37.798,
    lng: -122.397,
    fees: 'Free (1-hour limit)',
    hours: '24 hours',
    depthFt: 'varies',
    maxLoa: '40 ft',
    restrictions:
      '1-hour limit strictly enforced. Only 100 ft of linear space. Fills immediately on weekends. Fast-moving currents and massive ferry swells — hazardous approach for novices.',
    amenities: 'Near Exploratorium, Ferry Building, Embarcadero restaurants',
    dineOptions: ['Pier 23 Cafe', "Gott's Roadside", 'Ferry Building Marketplace'],
    sources: [
      {
        name: 'Port of San Francisco',
        url: 'https://sfport.com',
        date: '2026-03',
      },
      {
        name: 'ActiveCaptain community reviews',
        url: 'https://activecaptain.garmin.com/',
        date: '2025',
      },
    ],
  },

  // ── Horseshoe Bay ────────────────────────────────────────────────────
  {
    name: 'Horseshoe Bay (Fort Baker)',
    destinationId: 'hsb',
    dockType: 'public_guest',
    lat: 37.8335,
    lng: -122.4775,
    fees: 'Free (carry-in launch)',
    hours: 'Dawn to dusk',
    depthFt: '8 ft',
    maxLoa: 'N/A (carry-in only)',
    restrictions: 'Beach launch for kayaks/SUP only. No motorboat dock.',
    amenities: 'Beach, Fort Baker historic buildings, Cavallo Point Lodge nearby',
    dineOptions: ['Murray Circle at Cavallo Point (walk)'],
    sources: [
      {
        name: 'National Park Service — Fort Baker',
        url: 'https://www.nps.gov/goga/planyourvisit/fortbaker.htm',
        date: '2026-03',
      },
    ],
  },

  // ── Clipper Cove / Treasure Island ───────────────────────────────────
  {
    name: 'Clipper Cove (Treasure Island)',
    destinationId: 'clp',
    dockType: 'public_guest',
    lat: 37.82,
    lng: -122.37,
    fees: 'Free anchorage (24-hr limit without TIDA permit)',
    hours: '24 hours',
    depthFt: '8-20 ft inside cove; 4-5 ft at entrance shoal',
    maxLoa: 'varies',
    restrictions:
      'CRITICAL: Large shoal at entrance (4-5 ft MLLW). Enter NORTH side hugging Pier 1 on starboard. Enter only on rising/flood tide. Boats with 5+ ft draft have grounded. USCG restricted area on east side of YBI.',
    amenities: 'Protected anchorage, excellent mud/sand holding, San Francisco views',
    dineOptions: [],
    sources: [
      {
        name: 'Treasure Island Development Authority',
        url: 'https://sftreasureisland.org',
        date: '2026-03',
      },
      {
        name: 'US Coast Pilot Vol 7',
        url: 'https://nauticalcharts.noaa.gov/publications/coast-pilot/',
        date: '2026-03',
        section: 'Chapter 7 — Clipper Cove',
      },
      {
        name: 'ActiveCaptain community reviews',
        url: 'https://activecaptain.garmin.com/',
        date: '2025',
      },
    ],
  },

  // ── St. Francis Yacht Club ───────────────────────────────────────────
  {
    name: 'St. Francis Yacht Club',
    destinationId: 'aqp',
    dockType: 'yacht_club',
    lat: 37.807,
    lng: -122.44,
    fees: 'Variable; contact Port Captain',
    hours: 'Advance coordination required',
    depthFt: '12 ft (recently dredged 2023)',
    maxLoa: '125 ft (5 docks, 850 linear ft)',
    restrictions:
      'Members, guests of members, or verified reciprocal yacht club members ONLY. Contact Port Captain via email or VHF 69 before arrival. Unannounced vessels turned away.',
    amenities: 'Private club dining, bar, views',
    dineOptions: ['St. Francis YC dining room (members only)'],
    sources: [
      {
        name: 'St. Francis Yacht Club',
        url: 'https://www.stfyc.com',
        date: '2026-03',
      },
    ],
  },
];

/** Look up docks by destination ID */
export function getDocksForDestination(destId: string): DockInfo[] {
  return docks.filter((d) => d.destinationId === destId);
}
