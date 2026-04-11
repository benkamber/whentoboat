// SF Bay fish species with seasonal patterns, regulations, and preferred conditions.
// Source: CDFW regulations 2025-2026, NOAA fisheries data, local angler knowledge.
// Update annually when CDFW publishes new regulations (typically January).

export interface FishSpecies {
  id: string;
  name: string;
  /** Months when this species is actively targetable (0-11) */
  activeMonths: number[];
  /** Preferred water temperature range in °F */
  preferredTempRange: [number, number];
  /** Preferred tide phase for this species */
  preferredTide: 'flood' | 'ebb' | 'slack' | 'any';
  /** Best zones on SF Bay */
  bestZones: string[];
  /** Current bag/size limits */
  regulations: string;
  /** Brief fishing tips */
  tips: string;
}

export const speciesSeasons: FishSpecies[] = [
  {
    id: 'halibut',
    name: 'California Halibut',
    activeMonths: [3, 4, 5, 6, 7, 8], // Apr-Sep
    preferredTempRange: [54, 68],
    preferredTide: 'flood',
    bestZones: ['east_bay', 'sf_shore', 'south_bay'],
    regulations: 'Min 22 inches. 5 fish daily bag limit.',
    tips: 'Drift the Berkeley Flats and Alameda Wall on incoming tide. Live bait (anchovy) or swimbaits.',
  },
  {
    id: 'striped_bass',
    name: 'Striped Bass',
    activeMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Year-round
    preferredTempRange: [58, 68],
    preferredTide: 'flood',
    bestZones: ['central_bay', 'north_bay', 'san_pablo'],
    regulations: 'Min 18 inches. 2 fish daily bag limit.',
    tips: 'Best at Golden Gate on flood tide. Fall run (Oct-Dec) brings fish into the Bay from ocean.',
  },
  {
    id: 'sturgeon',
    name: 'White Sturgeon',
    activeMonths: [10, 11, 0, 1, 2], // Nov-Mar
    preferredTempRange: [48, 55],
    preferredTide: 'ebb',
    bestZones: ['san_pablo', 'north_bay'],
    regulations: 'Slot limit 40-60 inches. 1 fish daily, 3 annual. Green sturgeon: catch-and-release only.',
    tips: 'San Pablo Bay and Carquinez Strait. Use grass shrimp or ghost shrimp. Anchor and wait.',
  },
  {
    id: 'salmon',
    name: 'King Salmon (Chinook)',
    activeMonths: [3, 4, 5, 6, 7, 8, 9], // Apr-Oct (when open — season varies yearly)
    preferredTempRange: [50, 60],
    preferredTide: 'any',
    bestZones: ['central_bay'],
    regulations: 'Season set annually by PFMC. Check regulations before fishing — may be closed.',
    tips: 'Troll near the Gate or ocean side. Herring cut-plug or dodger/flasher rigs. Season is highly variable.',
  },
  {
    id: 'leopard_shark',
    name: 'Leopard Shark',
    activeMonths: [4, 5, 6, 7, 8, 9], // May-Oct
    preferredTempRange: [56, 68],
    preferredTide: 'flood',
    bestZones: ['south_bay', 'east_bay', 'richardson'],
    regulations: 'Min 36 inches. 3 fish daily bag limit.',
    tips: 'Shallow mud flats on incoming tide. Squid or cut bait. Popular kayak fishing target.',
  },
  {
    id: 'rockfish',
    name: 'Rockfish (various)',
    activeMonths: [3, 4, 5, 6, 7, 8, 9, 10], // Apr-Nov (ocean only)
    preferredTempRange: [50, 58],
    preferredTide: 'any',
    bestZones: ['ocean_south', 'ocean_north'],
    regulations: 'Complex depth restrictions by month. Check CDFW ocean sport fishing regulations.',
    tips: 'Ocean fishing only — out the Gate to Farallon Islands or along the coast. Party boats from Pillar Point.',
  },
];

/** Get species that are in season for a given month and water temp */
export function getActiveSpecies(month: number, waterTempF?: number): FishSpecies[] {
  return speciesSeasons.filter(sp => {
    if (!sp.activeMonths.includes(month)) return false;
    if (waterTempF !== undefined) {
      // Include if water temp is within ±5°F of preferred range (some flexibility)
      if (waterTempF < sp.preferredTempRange[0] - 5) return false;
      if (waterTempF > sp.preferredTempRange[1] + 5) return false;
    }
    return true;
  });
}
