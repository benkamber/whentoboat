// Structured guide data for SEO content pages.
// Each guide maps to /guides/[slug] and generates static pages at build time.

export interface GuideRoute {
  originId: string;
  destinationId: string;
  distance: number;
  difficulty: string;
  season: string;
  highlight: string;
}

export interface Guide {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  activity: string;
  routes: GuideRoute[];
  tips: string[];
  bestMonths: string;
}

export const guides: Guide[] = [
  {
    slug: 'best-kayak-trips-sausalito',
    title: 'Best 5 Kayak Trips from Sausalito',
    subtitle: 'Sheltered paddles and classic crossings in Richardson Bay',
    description: 'Sausalito is the #1 kayak launch on SF Bay. These 5 routes range from calm houseboat paddles to the classic Angel Island crossing.',
    activity: 'kayak',
    routes: [
      { originId: 'sau', destinationId: 'tib', distance: 2.5, difficulty: 'Easy', season: 'Year-round', highlight: 'Richardson Bay loop past houseboats — the quintessential Sausalito paddle' },
      { originId: 'sau', destinationId: 'ang', distance: 3, difficulty: 'Medium', season: 'Spring-Fall (calm mornings)', highlight: 'Cross Raccoon Strait to Angel Island — the classic Bay kayak route' },
      { originId: 'skm', destinationId: 'hsb', distance: 2, difficulty: 'Easy', season: 'Year-round', highlight: 'Schoonmaker Point to Horseshoe Bay along the Marin waterfront' },
      { originId: 'sau', destinationId: 'pcm', distance: 3, difficulty: 'Easy', season: 'Year-round', highlight: 'North through Richardson Bay to Paradise Cay — sheltered the entire way' },
      { originId: 'sau', destinationId: 'ggb', distance: 4, difficulty: 'Advanced', season: 'Summer-Fall (experienced only)', highlight: 'Paddle to the Golden Gate Bridge — powerful currents, incredible views' },
    ],
    tips: [
      'Launch from Sea Trek (Schoonmaker Point) for rentals and guided tours',
      'Morning departures are critical — afternoon winds build to 15+ knots',
      'Check Raccoon Strait current predictions before crossing to Angel Island',
      'Richardson Bay is sheltered from the prevailing westerlies — perfect for beginners',
      'Always carry a VHF radio and wear a PFD — ferries transit Raccoon Strait frequently',
    ],
    bestMonths: 'September-October (lightest winds, warmest water)',
  },
  {
    slug: 'weekend-powerboat-getaways',
    title: 'Weekend Powerboat Getaways on SF Bay',
    subtitle: 'Day cruises and overnight destinations by motor yacht',
    description: 'From a quick lunch cruise to Tiburon to an overnight at Angel Island, these are the most popular powerboat destinations on the Bay.',
    activity: 'powerboat_cruise',
    routes: [
      { originId: 'sau', destinationId: 'tib', distance: 2.5, difficulty: 'Easy', season: 'Year-round', highlight: "Lunch at Sam's Anchor Cafe — the #1 casual powerboat route on the Bay" },
      { originId: 'brk', destinationId: 'ang', distance: 5, difficulty: 'Easy', season: 'Year-round', highlight: 'Angel Island moorings — overnight or day trip with hiking and views' },
      { originId: 'alm', destinationId: 'clp', distance: 4, difficulty: 'Easy', season: 'Year-round', highlight: 'Clipper Cove anchorage behind Treasure Island — calm and scenic' },
      { originId: 'sau', destinationId: 'p39', distance: 4, difficulty: 'Easy', season: 'Year-round', highlight: 'SF waterfront cruise — Pier 39 guest docks, Fisherman\'s Wharf' },
      { originId: 'sau', destinationId: 'hmb', distance: 25, difficulty: 'Advanced', season: 'Summer (calm days only)', highlight: 'Half Moon Bay ocean passage — experienced crews, check bar conditions' },
    ],
    tips: [
      'Angel Island moorings fill up early on summer weekends — arrive before 11 AM',
      'Sam\'s Anchor Cafe dock in Tiburon has time limits on weekends',
      'Pier 39 guest slips are first-come, first-served — call ahead on busy days',
      'The Golden Gate bar can be rough even on calm days — check buoy 46237 before ocean passages',
      'Fuel is available at Sausalito, Berkeley, Alameda, and South Beach — plan your fuel stops',
    ],
    bestMonths: 'May-October (calmest conditions, longest days)',
  },
  {
    slug: 'first-daysail-sf-bay',
    title: 'Your First Daysail on SF Bay',
    subtitle: 'A beginner\'s guide to sailing from Berkeley to Angel Island',
    description: 'The Berkeley-to-Angel Island round trip is the most recommended first daysail on the Bay. Here\'s everything you need to know.',
    activity: 'casual_sail',
    routes: [
      { originId: 'brk', destinationId: 'ang', distance: 5, difficulty: 'Medium', season: 'Spring-Fall', highlight: 'The classic: beam reach across the Bay to Ayala Cove, lunch, sail back' },
      { originId: 'sau', destinationId: 'tib', distance: 2.5, difficulty: 'Easy', season: 'Year-round', highlight: 'Short reach across Richardson Bay — good for first-timers in light wind' },
      { originId: 'brk', destinationId: 'clp', distance: 4, difficulty: 'Easy', season: 'Year-round', highlight: 'Treasure Island via the Berkeley Circle — classic buoy racing territory' },
      { originId: 'alm', destinationId: 'ang', distance: 5, difficulty: 'Medium', season: 'Spring-Fall', highlight: 'Alameda to Angel Island — longer reach with great views of the skyline' },
      { originId: 'fbg', destinationId: 'sau', distance: 4, difficulty: 'Medium', season: 'Spring-Fall', highlight: 'South Beach to Sausalito — ride the afternoon wind across the Bay' },
    ],
    tips: [
      'Mornings are typically calm (5-8 knots); afternoons build to 15-25 knots in summer',
      'Your first sail should be in 8-12 knot conditions — avoid summer afternoons until experienced',
      'September and October offer the "Goldilocks window" — moderate wind, warm weather, light fog',
      'Reef before you think you need to — the wind always builds faster than you expect on the Bay',
      'Join a yacht club\'s beer can racing series for the best way to learn Bay sailing quickly',
    ],
    bestMonths: 'September-October (moderate wind, warm, clear skies)',
  },
  {
    slug: 'sup-launch-guide',
    title: 'Best SUP Spots on San Francisco Bay',
    subtitle: 'Protected launch points for stand-up paddleboarding',
    description: 'SUP on SF Bay is all about finding sheltered water. These are the best launch points with calm conditions and easy access.',
    activity: 'sup',
    routes: [
      { originId: 'sau', destinationId: 'skm', distance: 0.5, difficulty: 'Easy', season: 'Year-round', highlight: 'Richardson Bay from Sea Trek — flat water, houseboats, harbor seals' },
      { originId: 'crb', destinationId: 'crb', distance: 0, difficulty: 'Easy', season: 'Year-round', highlight: 'Crown Beach, Alameda — protected East Bay shoreline with sandy beach' },
      { originId: 'fcy', destinationId: 'fcy', distance: 0, difficulty: 'Easy', season: 'Year-round', highlight: 'Foster City Lagoon — dead-flat water, perfect for beginners and families' },
      { originId: 'hdb', destinationId: 'hdb', distance: 0, difficulty: 'Easy', season: 'Spring-Fall', highlight: 'Heart\'s Desire Beach, Tomales Bay — stunning scenery, bioluminescence in summer' },
      { originId: 'lkm', destinationId: 'lkm', distance: 0, difficulty: 'Easy', season: 'Year-round', highlight: 'Lake Merritt, Oakland — urban paddle with bird sanctuary and skyline views' },
    ],
    tips: [
      'SUP on the Bay is about picking your spot, not planning long routes',
      'Wind is the enemy — go early morning for glass-flat conditions',
      'Richardson Bay and Foster City are the most reliably calm spots',
      'Always wear a leash and PFD — Bay waters are cold (50-60°F year-round)',
      'Avoid open-water crossings entirely — stick to shorelines and protected coves',
    ],
    bestMonths: 'September-October (calmest wind, warmest water)',
  },
  {
    slug: 'fall-boating-sf-bay',
    title: 'Fall Boating on SF Bay: The Golden Window',
    subtitle: 'Why September and October are the best months on the water',
    description: 'Indian summer on SF Bay means light winds, warm weather, and clear skies. Here\'s how to make the most of the best boating season.',
    activity: 'all',
    routes: [
      { originId: 'sau', destinationId: 'ang', distance: 3, difficulty: 'Easy', season: 'Sep-Oct', highlight: 'Angel Island in fall — 9/10 comfort score, warm enough for swimming' },
      { originId: 'brk', destinationId: 'tib', distance: 6, difficulty: 'Easy', season: 'Sep-Oct', highlight: 'Cross-Bay cruise to Tiburon — afternoon winds stay under 10 knots' },
      { originId: 'cnc', destinationId: 'mcn', distance: 2, difficulty: 'Easy', season: 'Sep-Oct', highlight: 'China Camp to McNears — kayak through protected North Bay waters' },
      { originId: 'sau', destinationId: 'p39', distance: 4, difficulty: 'Easy', season: 'Sep-Oct', highlight: 'SF waterfront day — perfect weather for pier hopping' },
      { originId: 'hdb', destinationId: 'hdb', distance: 0, difficulty: 'Easy', season: 'Sep-Oct', highlight: 'Tomales Bay bioluminescence — paddle at night in late summer/early fall' },
    ],
    tips: [
      'September and October typically see 3-6 knot morning winds (vs. 15-24 knots in summer)',
      'Water temperature peaks at 60-63°F — still cold, but the warmest it gets',
      'Fog probability drops to the lowest of the year in October',
      'This is when San Pablo Bay becomes accessible — normally too rough other months',
      'Book Angel Island moorings early — everyone knows this is the best time',
    ],
    bestMonths: 'September-October',
  },
  {
    slug: 'bucket-list-sailing',
    title: 'Bucket List Sailing Routes on SF Bay',
    subtitle: 'The routes Bay Area sailors dream about',
    description: 'From racing past Alcatraz to sailing under the Golden Gate, these are the legendary routes that define SF Bay sailing.',
    activity: 'casual_sail',
    routes: [
      { originId: 'sau', destinationId: 'ggb', distance: 4, difficulty: 'Advanced', season: 'Summer (strong wind)', highlight: 'Sail under the Golden Gate Bridge — iconic, challenging, unforgettable' },
      { originId: 'fbg', destinationId: 'ben', distance: 22, difficulty: 'Advanced', season: 'Summer', highlight: 'Jazz Cup route: South Beach to Benicia — 22nm downwind run through the Bay' },
      { originId: 'brk', destinationId: 'ang', distance: 5, difficulty: 'Medium', season: 'Year-round', highlight: 'Angel Island round trip — the most recommended daysail on the Bay' },
      { originId: 'sau', destinationId: 'val', distance: 18, difficulty: 'Advanced', season: 'May', highlight: 'Great Vallejo Race — 200+ boats, through San Pablo Bay to Mare Island' },
      { originId: 'fbg', destinationId: 'clp', distance: 3, difficulty: 'Easy', season: 'Year-round', highlight: 'Treasure Island/Clipper Cove — raft up with friends in the protected cove' },
    ],
    tips: [
      'The Golden Gate has 4-5 knot currents — time your transit with slack water',
      'Bay sailing in 20+ knots is world-class but demands respect and preparation',
      'Join a yacht club\'s midwinter series to build experience in all conditions',
      'The Three Bridge Fiasco (January) is the largest single-day race on the West Coast — 300+ boats',
      'Reef early, bear off in puffs, and always have a plan for the afternoon buildup',
    ],
    bestMonths: 'April-October (wind season for sailing)',
  },
];
