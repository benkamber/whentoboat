import type { DistanceMatrix } from '@/engine/types';

// Index-to-ID mapping from PRD:
// 0=sau, 1=ang, 2=tib, 5=aqp, 6=p39, 7=fbg, 8=mcc, 12=clp, 13=jls, 14=alm, 15=brk, 17=ptr, 21=hmb

const ids = ['sau', 'ang', 'tib', 'aqp', 'p39', 'fbg', 'mcc', 'clp', 'jls', 'alm', 'brk', 'ptr', 'hmb'] as const;

// Raw distance pairs (symmetric — both directions included)
const raw: [string, string, number][] = [
  // sau ↔ all
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

  // ang ↔ remaining
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

  // tib ↔ remaining
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

  // aqp ↔ remaining
  ['aqp', 'p39', 1],
  ['aqp', 'fbg', 2],
  ['aqp', 'mcc', 4],
  ['aqp', 'clp', 4.5],
  ['aqp', 'jls', 6.5],
  ['aqp', 'alm', 8],
  ['aqp', 'brk', 7.5],
  ['aqp', 'ptr', 7.5],
  ['aqp', 'hmb', 22],

  // p39 ↔ remaining
  ['p39', 'fbg', 1.5],
  ['p39', 'mcc', 3.5],
  ['p39', 'clp', 3.5],
  ['p39', 'jls', 5.5],
  ['p39', 'alm', 7],
  ['p39', 'brk', 6.5],
  ['p39', 'ptr', 7],
  ['p39', 'hmb', 23],

  // fbg ↔ remaining
  ['fbg', 'mcc', 2.5],
  ['fbg', 'clp', 3],
  ['fbg', 'jls', 4.5],
  ['fbg', 'alm', 5.5],
  ['fbg', 'brk', 6.5],
  ['fbg', 'ptr', 7.5],
  ['fbg', 'hmb', 24],

  // mcc ↔ remaining
  ['mcc', 'clp', 4.5],
  ['mcc', 'jls', 5.5],
  ['mcc', 'alm', 6],
  ['mcc', 'brk', 8],
  ['mcc', 'ptr', 9],
  ['mcc', 'hmb', 22],

  // clp ↔ remaining
  ['clp', 'jls', 3],
  ['clp', 'alm', 3.5],
  ['clp', 'brk', 4],
  ['clp', 'ptr', 5.5],
  ['clp', 'hmb', 27],

  // jls ↔ remaining
  ['jls', 'alm', 2],
  ['jls', 'brk', 5],
  ['jls', 'ptr', 7],
  ['jls', 'hmb', 28],

  // alm ↔ remaining
  ['alm', 'brk', 5.5],
  ['alm', 'ptr', 8],
  ['alm', 'hmb', 28],

  // brk ↔ remaining
  ['brk', 'ptr', 4],
  ['brk', 'hmb', 30],

  // ptr ↔ remaining
  ['ptr', 'hmb', 30],
];

// Build symmetric distance matrix
const matrix: DistanceMatrix = {};
for (const [a, b, dist] of raw) {
  matrix[`${a}-${b}`] = dist;
  matrix[`${b}-${a}`] = dist;
}

export const distances: DistanceMatrix = matrix;
