import type { DistanceMatrix } from '@/engine/types';

// All destination IDs
// Original 13: sau, ang, tib, aqp, p39, fbg, mcc, clp, jls, alm, brk, ptr, hmb
// New 10: rwc, oyp, cop, srf, val, ben, ggb, stn, bol, pry

const ids = [
  'sau', 'ang', 'tib', 'aqp', 'p39', 'fbg', 'mcc', 'clp', 'jls', 'alm', 'brk', 'ptr', 'hmb',
  'rwc', 'oyp', 'cop', 'srf', 'val', 'ben', 'ggb', 'stn', 'bol', 'pry', 'mry',
] as const;

// Raw distance pairs (symmetric — both directions included via matrix builder)
const raw: [string, string, number][] = [
  // ══════════════════════════════════════════
  // ORIGINAL distances (13 destinations)
  // ══════════════════════════════════════════

  // sau ↔ all original
  ['sau', 'ang', 1.8],
  ['sau', 'tib', 1.5],
  ['sau', 'aqp', 2.8],
  ['sau', 'p39', 3.5],
  ['sau', 'fbg', 4.2],
  ['sau', 'mcc', 6],
  ['sau', 'clp', 5.5],
  ['sau', 'jls', 7.5],
  ['sau', 'alm', 9],
  ['sau', 'brk', 8.5],
  ['sau', 'ptr', 8],
  ['sau', 'hmb', 25],

  // ang ↔ remaining original
  ['ang', 'tib', 1],
  ['ang', 'aqp', 3],
  ['ang', 'p39', 3.2],
  ['ang', 'fbg', 4.5],
  ['ang', 'mcc', 6.5],
  ['ang', 'clp', 5],
  ['ang', 'jls', 7],
  ['ang', 'alm', 8.5],
  ['ang', 'brk', 6.5],
  ['ang', 'ptr', 7],
  ['ang', 'hmb', 27],

  // tib ↔ remaining original
  ['tib', 'aqp', 3.2],
  ['tib', 'p39', 3.8],
  ['tib', 'fbg', 4.8],
  ['tib', 'mcc', 7],
  ['tib', 'clp', 6],
  ['tib', 'jls', 8],
  ['tib', 'alm', 9],
  ['tib', 'brk', 7.5],
  ['tib', 'ptr', 7.5],
  ['tib', 'hmb', 27],

  // aqp ↔ remaining original
  ['aqp', 'p39', 1],
  ['aqp', 'fbg', 2],
  ['aqp', 'mcc', 4],
  ['aqp', 'clp', 4.5],
  ['aqp', 'jls', 6.5],
  ['aqp', 'alm', 8],
  ['aqp', 'brk', 7.5],
  ['aqp', 'ptr', 7.5],
  ['aqp', 'hmb', 22],

  // p39 ↔ remaining original
  ['p39', 'fbg', 1.5],
  ['p39', 'mcc', 3.5],
  ['p39', 'clp', 3.5],
  ['p39', 'jls', 5.5],
  ['p39', 'alm', 7],
  ['p39', 'brk', 6.5],
  ['p39', 'ptr', 7],
  ['p39', 'hmb', 23],

  // fbg ↔ remaining original
  ['fbg', 'mcc', 2.5],
  ['fbg', 'clp', 3],
  ['fbg', 'jls', 4.5],
  ['fbg', 'alm', 5.5],
  ['fbg', 'brk', 6.5],
  ['fbg', 'ptr', 7.5],
  ['fbg', 'hmb', 24],

  // mcc ↔ remaining original
  ['mcc', 'clp', 4.5],
  ['mcc', 'jls', 5.5],
  ['mcc', 'alm', 6],
  ['mcc', 'brk', 8],
  ['mcc', 'ptr', 9],
  ['mcc', 'hmb', 22],

  // clp ↔ remaining original
  ['clp', 'jls', 3],
  ['clp', 'alm', 3.5],
  ['clp', 'brk', 4],
  ['clp', 'ptr', 5.5],
  ['clp', 'hmb', 27],

  // jls ↔ remaining original
  ['jls', 'alm', 2],
  ['jls', 'brk', 5],
  ['jls', 'ptr', 7],
  ['jls', 'hmb', 28],

  // alm ↔ remaining original
  ['alm', 'brk', 5.5],
  ['alm', 'ptr', 8],
  ['alm', 'hmb', 28],

  // brk ↔ remaining original
  ['brk', 'ptr', 4],
  ['brk', 'hmb', 30],

  // ptr ↔ remaining original
  ['ptr', 'hmb', 30],

  // ══════════════════════════════════════════
  // NEW distances — sau ↔ new destinations
  // ══════════════════════════════════════════

  ['sau', 'rwc', 25],
  ['sau', 'oyp', 14],
  ['sau', 'cop', 18],
  ['sau', 'srf', 7],
  ['sau', 'val', 18],
  ['sau', 'ben', 23],
  ['sau', 'ggb', 2],
  ['sau', 'stn', 12],
  ['sau', 'bol', 15],
  ['sau', 'pry', 30],

  // ══════════════════════════════════════════
  // NEW distances — ang ↔ new destinations
  // ══════════════════════════════════════════

  ['ang', 'rwc', 24],
  ['ang', 'oyp', 13],
  ['ang', 'cop', 17],
  ['ang', 'srf', 8],
  ['ang', 'val', 17],
  ['ang', 'ben', 22],
  ['ang', 'ggb', 3.5],
  ['ang', 'stn', 14],
  ['ang', 'bol', 17],
  ['ang', 'pry', 32],

  // ══════════════════════════════════════════
  // NEW distances — tib ↔ new destinations
  // ══════════════════════════════════════════

  ['tib', 'rwc', 25],
  ['tib', 'oyp', 14],
  ['tib', 'cop', 18],
  ['tib', 'srf', 7.5],
  ['tib', 'val', 17],
  ['tib', 'ben', 22],
  ['tib', 'ggb', 3.8],
  ['tib', 'stn', 14],
  ['tib', 'bol', 17],
  ['tib', 'pry', 32],

  // ══════════════════════════════════════════
  // NEW distances — aqp ↔ new destinations
  // ══════════════════════════════════════════

  ['aqp', 'rwc', 22],
  ['aqp', 'oyp', 11],
  ['aqp', 'cop', 15],
  ['aqp', 'srf', 10],
  ['aqp', 'val', 20],
  ['aqp', 'ben', 25],
  ['aqp', 'ggb', 3],
  ['aqp', 'stn', 13],
  ['aqp', 'bol', 16],
  ['aqp', 'pry', 31],

  // ══════════════════════════════════════════
  // NEW distances — p39 ↔ new destinations
  // ══════════════════════════════════════════

  ['p39', 'rwc', 21],
  ['p39', 'oyp', 10],
  ['p39', 'cop', 14],
  ['p39', 'srf', 11],
  ['p39', 'val', 20],
  ['p39', 'ben', 25],
  ['p39', 'ggb', 4],
  ['p39', 'stn', 14],
  ['p39', 'bol', 17],
  ['p39', 'pry', 32],

  // ══════════════════════════════════════════
  // NEW distances — fbg ↔ new destinations
  // ══════════════════════════════════════════

  ['fbg', 'rwc', 19],
  ['fbg', 'oyp', 8],
  ['fbg', 'cop', 12],
  ['fbg', 'srf', 12],
  ['fbg', 'val', 21],
  ['fbg', 'ben', 26],
  ['fbg', 'ggb', 5],
  ['fbg', 'stn', 15],
  ['fbg', 'bol', 18],
  ['fbg', 'pry', 33],

  // ══════════════════════════════════════════
  // NEW distances — mcc ↔ new destinations
  // ══════════════════════════════════════════

  ['mcc', 'rwc', 17],
  ['mcc', 'oyp', 6],
  ['mcc', 'cop', 10],
  ['mcc', 'srf', 14],
  ['mcc', 'val', 23],
  ['mcc', 'ben', 28],
  ['mcc', 'ggb', 7],
  ['mcc', 'stn', 17],
  ['mcc', 'bol', 20],
  ['mcc', 'pry', 35],

  // ══════════════════════════════════════════
  // NEW distances — clp ↔ new destinations
  // ══════════════════════════════════════════

  ['clp', 'rwc', 18],
  ['clp', 'oyp', 8],
  ['clp', 'cop', 12],
  ['clp', 'srf', 12],
  ['clp', 'val', 19],
  ['clp', 'ben', 24],
  ['clp', 'ggb', 6],
  ['clp', 'stn', 16],
  ['clp', 'bol', 19],
  ['clp', 'pry', 34],

  // ══════════════════════════════════════════
  // NEW distances — jls ↔ new destinations
  // ══════════════════════════════════════════

  ['jls', 'rwc', 16],
  ['jls', 'oyp', 7],
  ['jls', 'cop', 10],
  ['jls', 'srf', 14],
  ['jls', 'val', 20],
  ['jls', 'ben', 25],
  ['jls', 'ggb', 8],
  ['jls', 'stn', 18],
  ['jls', 'bol', 21],
  ['jls', 'pry', 36],

  // ══════════════════════════════════════════
  // NEW distances — alm ↔ new destinations
  // ══════════════════════════════════════════

  ['alm', 'rwc', 14],
  ['alm', 'oyp', 6],
  ['alm', 'cop', 8],
  ['alm', 'srf', 15],
  ['alm', 'val', 21],
  ['alm', 'ben', 26],
  ['alm', 'ggb', 10],
  ['alm', 'stn', 20],
  ['alm', 'bol', 23],
  ['alm', 'pry', 38],

  // ══════════════════════════════════════════
  // NEW distances — brk ↔ new destinations
  // ══════════════════════════════════════════

  ['brk', 'rwc', 20],
  ['brk', 'oyp', 12],
  ['brk', 'cop', 15],
  ['brk', 'srf', 10],
  ['brk', 'val', 16],
  ['brk', 'ben', 21],
  ['brk', 'ggb', 9],
  ['brk', 'stn', 19],
  ['brk', 'bol', 22],
  ['brk', 'pry', 37],

  // ══════════════════════════════════════════
  // NEW distances — ptr ↔ new destinations
  // ══════════════════════════════════════════

  ['ptr', 'rwc', 22],
  ['ptr', 'oyp', 14],
  ['ptr', 'cop', 17],
  ['ptr', 'srf', 6],
  ['ptr', 'val', 12],
  ['ptr', 'ben', 17],
  ['ptr', 'ggb', 10],
  ['ptr', 'stn', 20],
  ['ptr', 'bol', 23],
  ['ptr', 'pry', 38],

  // ══════════════════════════════════════════
  // NEW distances — hmb ↔ new destinations
  // ══════════════════════════════════════════

  ['hmb', 'rwc', 30],
  ['hmb', 'oyp', 22],
  ['hmb', 'cop', 25],
  ['hmb', 'srf', 30],
  ['hmb', 'val', 40],
  ['hmb', 'ben', 45],
  ['hmb', 'ggb', 20],
  ['hmb', 'stn', 18],
  ['hmb', 'bol', 20],
  ['hmb', 'pry', 35],

  // ══════════════════════════════════════════
  // NEW distances — cross-distances between new destinations
  // ══════════════════════════════════════════

  // rwc ↔ other new
  ['rwc', 'oyp', 8],
  ['rwc', 'cop', 5],
  ['rwc', 'srf', 30],
  ['rwc', 'val', 35],
  ['rwc', 'ben', 40],
  ['rwc', 'ggb', 26],
  ['rwc', 'stn', 36],
  ['rwc', 'bol', 39],
  ['rwc', 'pry', 54],

  // oyp ↔ other new
  ['oyp', 'cop', 5],
  ['oyp', 'srf', 20],
  ['oyp', 'val', 28],
  ['oyp', 'ben', 33],
  ['oyp', 'ggb', 15],
  ['oyp', 'stn', 25],
  ['oyp', 'bol', 28],
  ['oyp', 'pry', 43],

  // cop ↔ other new
  ['cop', 'srf', 24],
  ['cop', 'val', 32],
  ['cop', 'ben', 37],
  ['cop', 'ggb', 19],
  ['cop', 'stn', 29],
  ['cop', 'bol', 32],
  ['cop', 'pry', 47],

  // srf ↔ other new
  ['srf', 'val', 14],
  ['srf', 'ben', 19],
  ['srf', 'ggb', 8],
  ['srf', 'stn', 15],
  ['srf', 'bol', 18],
  ['srf', 'pry', 33],

  // val ↔ other new
  ['val', 'ben', 6],
  ['val', 'ggb', 20],
  ['val', 'stn', 28],
  ['val', 'bol', 31],
  ['val', 'pry', 46],

  // ben ↔ other new
  ['ben', 'ggb', 25],
  ['ben', 'stn', 33],
  ['ben', 'bol', 36],
  ['ben', 'pry', 51],

  // ggb ↔ other new
  ['ggb', 'stn', 10],
  ['ggb', 'bol', 13],
  ['ggb', 'pry', 28],

  // stn ↔ other new
  ['stn', 'bol', 4],
  ['stn', 'pry', 20],

  // bol ↔ other new
  ['bol', 'pry', 17],

  // ══════════════════════════════════════════
  // Monterey (mry) distances
  // ══════════════════════════════════════════

  ['sau', 'mry', 75],
  ['aqp', 'mry', 73],
  ['fbg', 'mry', 74],
  ['hmb', 'mry', 50],

  // Estimated distances from other points to Monterey
  ['ang', 'mry', 76],
  ['tib', 'mry', 77],
  ['p39', 'mry', 73],
  ['mcc', 'mry', 72],
  ['clp', 'mry', 75],
  ['jls', 'mry', 78],
  ['alm', 'mry', 80],
  ['brk', 'mry', 80],
  ['ptr', 'mry', 82],
  ['rwc', 'mry', 80],
  ['oyp', 'mry', 72],
  ['cop', 'mry', 70],
  ['srf', 'mry', 82],
  ['val', 'mry', 90],
  ['ben', 'mry', 95],
  ['ggb', 'mry', 70],
  ['stn', 'mry', 65],
  ['bol', 'mry', 62],
  ['pry', 'mry', 55],
];

// Build symmetric distance matrix
const matrix: DistanceMatrix = {};
for (const [a, b, dist] of raw) {
  matrix[`${a}-${b}`] = dist;
  matrix[`${b}-${a}`] = dist;
}

export const distances: DistanceMatrix = matrix;
