import type { CrossZoneRule } from '@/engine/types';

// Area groupings:
//   Marin:       "marin"
//   Marin North: "marin_n"        (San Rafael)
//   SF:          "sf_n", "sf_e", "sf_s"
//   East Bay:    "east", "east_n"
//   South Bay:   "south", "south_deep"
//   San Pablo:   "sanpablo"        (Vallejo, Benicia)
//   Gate:        "gate"            (Golden Gate Bridge — in central_bay zone)
//   Ocean:       "ocean_s", "ocean_n", "ocean_far"
//   Central:     "central"         (Clipper Cove)

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
    toAreas: ['south', 'south_deep'],
    transitZones: ['central_bay', 'south_bay'],
  },

  // East Bay ↔ South Bay → must transit south_bay
  {
    fromAreas: ['east', 'east_n'],
    toAreas: ['south', 'south_deep'],
    transitZones: ['south_bay'],
  },

  // SF south ↔ South Bay deep → must transit south_bay
  {
    fromAreas: ['sf_s'],
    toAreas: ['south_deep'],
    transitZones: ['south_bay'],
  },

  // SF north / east ↔ South Bay → must transit central_bay + south_bay
  {
    fromAreas: ['sf_n', 'sf_e'],
    toAreas: ['south', 'south_deep'],
    transitZones: ['central_bay', 'south_bay'],
  },

  // South Bay deep ↔ anything north of South Bay → adds south_bay
  {
    fromAreas: ['south_deep'],
    toAreas: ['marin', 'marin_n', 'sf_n', 'sf_e', 'central', 'gate', 'east', 'east_n', 'sanpablo'],
    transitZones: ['south_bay'],
  },

  // Any ↔ Ocean (must transit the Gate / central_bay)
  {
    fromAreas: ['marin', 'marin_n', 'sf_n', 'sf_e', 'sf_s', 'east', 'east_n', 'south', 'south_deep', 'central', 'sanpablo'],
    toAreas: ['ocean_s', 'ocean_n', 'ocean_far'],
    transitZones: ['central_bay'],
  },

  // North Bay (marin_n / San Rafael) ↔ SF/East Bay → adds central_bay
  {
    fromAreas: ['marin_n'],
    toAreas: ['sf_n', 'sf_e', 'sf_s', 'east', 'east_n'],
    transitZones: ['central_bay'],
  },

  // North Bay (east_n / Pt Richmond area) ↔ SF → must transit central_bay
  {
    fromAreas: ['east_n'],
    toAreas: ['sf_n', 'sf_e', 'sf_s'],
    transitZones: ['central_bay'],
  },

  // San Pablo Bay ↔ anything south of north_bay → adds north_bay + central_bay
  {
    fromAreas: ['sanpablo'],
    toAreas: ['marin', 'sf_n', 'sf_e', 'sf_s', 'east', 'central', 'south', 'south_deep'],
    transitZones: ['north_bay', 'central_bay'],
  },

  // San Pablo Bay ↔ Marin North / East North → adds north_bay
  {
    fromAreas: ['sanpablo'],
    toAreas: ['marin_n', 'east_n'],
    transitZones: ['north_bay'],
  },

  // San Pablo Bay ↔ Gate → adds north_bay + central_bay
  {
    fromAreas: ['sanpablo'],
    toAreas: ['gate'],
    transitZones: ['north_bay', 'central_bay'],
  },

  // Marin North ↔ South Bay → adds north_bay + central_bay + south_bay
  {
    fromAreas: ['marin_n'],
    toAreas: ['south', 'south_deep'],
    transitZones: ['north_bay', 'central_bay', 'south_bay'],
  },

  // San Pablo Bay ↔ South Bay → adds north_bay + central_bay + south_bay
  {
    fromAreas: ['sanpablo'],
    toAreas: ['south', 'south_deep'],
    transitZones: ['north_bay', 'central_bay', 'south_bay'],
  },
];
