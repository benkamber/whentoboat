/**
 * Single source of truth for marine jargon expansions.
 *
 * WhenToBoat is used by beginners (SUP renters, first-time kayakers)
 * alongside experienced boaters. Technical terms like TSS and MLLW
 * are second nature to sailors but opaque to newcomers — we expand
 * them on first use via <Term id="..." /> and provide a hover tooltip
 * for the abbreviation form.
 *
 * Keep this list short — every addition is a term users have to learn.
 * Only put something here if it appears unexplained in the UI.
 */

export type GlossaryId = 'tss' | 'mllw' | 'loa' | 'gph';

export interface GlossaryEntry {
  /** Canonical abbreviation, e.g., "TSS" */
  abbr: string;
  /** Short plain-English replacement, e.g., "shipping lane" */
  short: string;
  /** Long tooltip explanation — what it means and why the user should care */
  tooltip: string;
}

export const GLOSSARY: Record<GlossaryId, GlossaryEntry> = {
  tss: {
    abbr: 'TSS',
    short: 'shipping lane',
    tooltip:
      'Traffic Separation Scheme — the designated lane commercial ships follow. Kayaks and SUPs cannot cross safely; ferries and powerboats must yield to large traffic.',
  },
  mllw: {
    abbr: 'MLLW',
    short: 'at lowest tide',
    tooltip:
      'Mean Lower Low Water — the baseline nautical charts use for depth. The water will usually be deeper than this; only at the lowest tide of the day will it match.',
  },
  loa: {
    abbr: 'LOA',
    short: 'length',
    tooltip:
      'Length Over All — the total length of the boat from bow to stern.',
  },
  gph: {
    abbr: 'GPH',
    short: 'fuel burn',
    tooltip:
      'Gallons Per Hour — how much fuel the engine burns at cruise speed.',
  },
};
