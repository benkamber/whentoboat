import type { ActivityProfile, ActivityType } from '@/engine/types';

export const activities: ActivityProfile[] = [
  {
    id: 'kayak',
    name: 'Kayak',
    description:
      'Sea kayaking in sheltered or moderate waters. Near-shore routes only — does not cross shipping lanes or open Central Bay.',
    icon: '🛶',
    idealWindRange: [0, 6],
    maxWind: 12,
    maxWave: 1.5,
    vesselType: 'kayak',
    preferredZoneTypes: ['sheltered', 'protected'],
    maxShoreDistanceM: null, // near-shore eddy-hopping, not open crossings
    maxRangeRoundTripMi: 10,
    requiresOpenWaterCrossing: false, // kayaks should NOT cross Central Bay TSS
    beforeYouGo: [
      {
        text: 'Wear a PFD at all times',
        url: null,
        activityTypes: 'all',
      },
      {
        text: 'Check current speed and direction — paddling against 3+ knot current is dangerous',
        url: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1201',
        activityTypes: ['kayak'],
      },
      {
        text: 'Tell someone your plan and expected return time',
        url: null,
        activityTypes: 'all',
      },
      {
        text: 'Check marine forecast',
        url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ530',
        activityTypes: 'all',
      },
      {
        text: 'Dress for immersion — SF Bay water is 50-65°F year-round',
        url: null,
        activityTypes: ['kayak', 'sup'],
      },
      {
        text: 'Carry a whistle and waterproof light',
        url: null,
        activityTypes: ['kayak'],
      },
      {
        text: 'File a float plan — tell someone your route and return time',
        url: 'https://www.uscgboating.org/recreational-boaters/floating-plan.php',
        activityTypes: 'all',
      },
    ],
    notes:
      'Can venture into moderate exposure zones. Current awareness critical. Spray skirt recommended for Bay conditions.',
  },
  {
    id: 'sup',
    name: 'Stand-Up Paddleboard',
    description:
      'Near-shore paddling in calm, protected water. Stay within 500m of shore. Very sensitive to wind and chop.',
    icon: '🏄‍♂️',
    idealWindRange: [0, 4],
    maxWind: 6,
    maxWave: 0.3,
    vesselType: 'sup',
    preferredZoneTypes: ['sheltered', 'protected'],
    maxShoreDistanceM: 500, // must stay near shore
    maxRangeRoundTripMi: 5,
    requiresOpenWaterCrossing: false, // warn on open water crossings
    beforeYouGo: [
      {
        text: 'Wear a PFD — required by law on SUPs in California',
        url: null,
        activityTypes: ['sup'],
      },
      {
        text: 'Use a leash — your board is your life raft',
        url: null,
        activityTypes: ['sup'],
      },
      {
        text: 'Check wind forecast — standing up means wind pushes you like a sail',
        url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ530',
        activityTypes: ['sup'],
      },
      {
        text: 'Check current speed — even 2 knots can overpower a SUP paddler',
        url: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1201',
        activityTypes: ['sup'],
      },
      {
        text: 'Stay within 500m of shore at all times',
        url: null,
        activityTypes: ['sup'],
      },
      {
        text: 'Dress for immersion — you WILL fall in. SF Bay is 50-65°F.',
        url: null,
        activityTypes: ['sup'],
      },
      {
        text: 'Tell someone your plan and expected return time',
        url: 'https://www.uscgboating.org/recreational-boaters/floating-plan.php',
        activityTypes: 'all',
      },
    ],
    notes:
      'Most weather-sensitive activity. Sheltered water only. Standing = high wind profile. Stay near shore. Launch from any beach or dock.',
  },
  {
    id: 'powerboat_cruise',
    name: 'Powerboat Cruise',
    description:
      'Day cruising with passengers. Optimizing for comfort and flat water.',
    icon: '🚤',
    idealWindRange: [0, 12],
    maxWind: 18,
    maxWave: 3.0,
    vesselType: 'powerboat',
    preferredZoneTypes: ['calm', 'moderate'],
    maxShoreDistanceM: null,
    maxRangeRoundTripMi: null, // fuel-limited
    requiresOpenWaterCrossing: true,
    beforeYouGo: [
      {
        text: 'Check marine forecast',
        url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ530',
        activityTypes: 'all',
      },
      {
        text: 'Verify fuel level for round trip plus 30% reserve',
        url: null,
        activityTypes: ['powerboat_cruise'],
      },
      {
        text: 'Test engine cutoff switch',
        url: null,
        activityTypes: ['powerboat_cruise'],
      },
      {
        text: 'Monitor VHF Ch 16',
        url: null,
        activityTypes: 'all',
      },
      {
        text: 'File a float plan with someone on shore',
        url: 'https://www.uscgboating.org/recreational-boaters/floating-plan.php',
        activityTypes: 'all',
      },
      {
        text: 'Check tide and current timing — ebb currents at Golden Gate can exceed 5 knots',
        url: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1201',
        activityTypes: ['powerboat_cruise'],
      },
    ],
    notes: 'Passenger comfort is priority. Avoid short-period chop.',
  },
  {
    id: 'casual_sail',
    name: 'Casual Daysail',
    description:
      'Relaxed sailing with crew. Enough wind to sail, not enough to intimidate.',
    icon: '⛵',
    idealWindRange: [8, 18],
    maxWind: 25,
    maxWave: 4.0,
    vesselType: 'sailboat',
    preferredZoneTypes: ['moderate', 'exposed'],
    maxShoreDistanceM: null,
    maxRangeRoundTripMi: null, // wind-dependent
    requiresOpenWaterCrossing: true,
    beforeYouGo: [
      {
        text: 'Check wind forecast — both speed and direction',
        url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ530',
        activityTypes: ['casual_sail'],
      },
      {
        text: 'Plan reefing strategy for afternoon wind buildup',
        url: null,
        activityTypes: ['casual_sail'],
      },
      {
        text: 'Monitor VHF Ch 16',
        url: null,
        activityTypes: 'all',
      },
      {
        text: 'Check tide and current timing for route',
        url: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1201',
        activityTypes: 'all',
      },
      {
        text: 'Verify engine starts for backup propulsion',
        url: null,
        activityTypes: ['casual_sail'],
      },
    ],
    notes:
      'Too little wind is boring. Too much is stressful. Sweet spot is 8-15 kts.',
  },
  {
    id: 'fishing_boat',
    name: 'Boat Fishing',
    description:
      'Fishing from a powerboat — trolling, drifting, or anchored. Higher wind tolerance than cruising. Tide phase and barometric pressure heavily influence fish activity.',
    icon: '🎣',
    idealWindRange: [0, 12],
    maxWind: 22,
    maxWave: 4.0,
    vesselType: 'powerboat',
    preferredZoneTypes: ['open', 'moderate'],
    maxShoreDistanceM: null,
    maxRangeRoundTripMi: null,
    requiresOpenWaterCrossing: true,
    beforeYouGo: [
      { text: 'Check CDFW regulations — seasons and limits change annually', url: 'https://wildlife.ca.gov/fishing', activityTypes: ['fishing_boat', 'fishing_kayak'] },
      { text: 'Verify tide times — incoming tide is best for most Bay species', url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9414290', activityTypes: ['fishing_boat', 'fishing_kayak'] },
      { text: 'File a float plan and tell someone where you are going', url: 'https://www.uscgboating.org/recreational-boaters/floating-plan.php', activityTypes: 'all' },
      { text: 'Check marine forecast for wind and small craft advisories', url: 'https://www.weather.gov/mtr/MarineProducts', activityTypes: 'all' },
      { text: 'Carry required safety equipment: PFDs, flares, fire extinguisher, VHF radio', url: null, activityTypes: 'all' },
    ],
    notes:
      'A fisherman\'s best day is often a boater\'s worst — overcast, falling pressure, moderate chop. Tide phase matters more than wind.',
  },
  {
    id: 'fishing_kayak',
    name: 'Kayak Fishing',
    description:
      'Fishing from a kayak — drift fishing in sheltered flats and nearshore areas. All kayak safety rules apply plus fishing-specific hazards.',
    icon: '🎣🛶',
    idealWindRange: [0, 8],
    maxWind: 12,
    maxWave: 1.0,
    vesselType: 'kayak',
    preferredZoneTypes: ['sheltered', 'protected'],
    maxShoreDistanceM: null,
    maxRangeRoundTripMi: 10,
    requiresOpenWaterCrossing: false,
    beforeYouGo: [
      { text: 'Check CDFW regulations — seasons and limits change annually', url: 'https://wildlife.ca.gov/fishing', activityTypes: ['fishing_boat', 'fishing_kayak'] },
      { text: 'Verify tide times — incoming tide is best for most Bay species', url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9414290', activityTypes: ['fishing_boat', 'fishing_kayak'] },
      { text: 'Secure all fishing gear — loose rods and tackle are capsizing hazards', url: null, activityTypes: ['fishing_kayak'] },
      { text: 'Wear a PFD at all times — fighting a fish from a kayak can capsize you', url: null, activityTypes: ['fishing_kayak'] },
      { text: 'File a float plan and tell someone where you are going', url: 'https://www.uscgboating.org/recreational-boaters/floating-plan.php', activityTypes: 'all' },
      { text: 'Check marine forecast for wind and small craft advisories', url: 'https://www.weather.gov/mtr/MarineProducts', activityTypes: 'all' },
    ],
    notes:
      'Kayak fishing combines all kayaking risks with fishing hazards. Stay in sheltered flats — Berkeley Flats, Alameda Wall, Richardson Bay for leopard sharks.',
  },
];

export function getActivity(id: ActivityType): ActivityProfile {
  const activity = activities.find((a) => a.id === id);
  if (!activity) {
    throw new Error(`Unknown activity: ${id}`);
  }
  return activity;
}
