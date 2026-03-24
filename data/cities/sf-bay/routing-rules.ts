import type { CrossZoneRule } from '@/engine/types';

// Area groupings:
//   Marin:     "marin"
//   SF:        "sf_n", "sf_e", "sf_s"
//   East Bay:  "east", "east_n"
//   South Bay: (destinations in south_bay zone — area captured by zone membership)
//   Ocean:     "ocean_s"

export const routingRules: CrossZoneRule[] = [
  // Marin ↔ SF → must transit central_bay
  {
    fromAreas: ['marin'],
    toAreas: ['sf_n', 'sf_e', 'sf_s'],
    transitZones: ['central_bay'],
  },

  // Marin ↔ East Bay → must transit central_bay
  {
    fromAreas: ['marin'],
    toAreas: ['east', 'east_n'],
    transitZones: ['central_bay'],
  },

  // SF ↔ East Bay → must transit central_bay
  {
    fromAreas: ['sf_n', 'sf_e', 'sf_s'],
    toAreas: ['east', 'east_n'],
    transitZones: ['central_bay'],
  },

  // Marin ↔ South Bay → must transit central_bay + south_bay
  {
    fromAreas: ['marin'],
    toAreas: ['sf_s'],
    transitZones: ['central_bay', 'south_bay'],
  },

  // East Bay ↔ South Bay → must transit central_bay + south_bay
  {
    fromAreas: ['east', 'east_n'],
    toAreas: ['sf_s'],
    transitZones: ['central_bay', 'south_bay'],
  },

  // Any ↔ Ocean (must transit the Gate)
  {
    fromAreas: ['marin', 'sf_n', 'sf_e', 'sf_s', 'east', 'east_n'],
    toAreas: ['ocean_s'],
    transitZones: ['central_bay'],
  },

  // North Bay (ptr area) ↔ SF → must transit central_bay
  {
    fromAreas: ['east_n'],
    toAreas: ['sf_n', 'sf_e', 'sf_s'],
    transitZones: ['central_bay'],
  },
];
