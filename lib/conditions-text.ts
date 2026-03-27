/**
 * Plain language descriptions for boating conditions.
 * Translates raw numbers into human-readable text with severity levels.
 */

export interface ConditionDescription {
  text: string;
  emoji: string;
  severity: string;
  warning?: string;
}

// --- Wind ---

export function describeWind(windKts: number): {
  text: string;
  emoji: string;
  severity: 'calm' | 'light' | 'moderate' | 'strong' | 'dangerous';
} {
  if (windKts <= 3) {
    return { text: 'Calm \u2014 glass-like water', emoji: '\u{1F32C}\uFE0F', severity: 'calm' };
  }
  if (windKts <= 8) {
    return { text: 'Light breeze \u2014 comfortable for all', emoji: '\u{1F343}', severity: 'light' };
  }
  if (windKts <= 12) {
    return { text: 'Moderate wind \u2014 some spray, manageable', emoji: '\u{1F4A8}', severity: 'moderate' };
  }
  if (windKts <= 18) {
    return { text: 'Fresh wind \u2014 experienced boaters, hold on', emoji: '\u{1F32A}\uFE0F', severity: 'strong' };
  }
  if (windKts <= 25) {
    return { text: 'Strong wind \u2014 small craft advisory conditions', emoji: '\u26A0\uFE0F', severity: 'dangerous' };
  }
  return { text: 'Gale \u2014 stay home', emoji: '\u{1F6A8}', severity: 'dangerous' };
}

// --- Waves ---

export function describeWaves(
  waveHtFt: number,
  periodS: number
): { text: string; emoji: string; severity: 'flat' | 'light' | 'moderate' | 'rough' | 'dangerous' } {
  // Short period + any real height = steep uncomfortable chop
  if (periodS > 0 && periodS < 4 && waveHtFt > 1) {
    return {
      text: 'Steep, uncomfortable chop',
      emoji: '\u{1F30A}',
      severity: waveHtFt > 3 ? 'dangerous' : 'rough',
    };
  }

  if (waveHtFt <= 0.5) {
    return { text: 'Flat calm \u2014 paddle heaven', emoji: '\u{1F3DD}\uFE0F', severity: 'flat' };
  }
  if (waveHtFt <= 1.5) {
    return { text: 'Light chop \u2014 comfortable ride', emoji: '\u{1F30A}', severity: 'light' };
  }
  if (waveHtFt <= 3) {
    return { text: 'Moderate chop \u2014 bumpy, some spray', emoji: '\u{1F30A}', severity: 'moderate' };
  }
  if (waveHtFt <= 5) {
    return { text: 'Rough \u2014 uncomfortable for small boats', emoji: '\u26A0\uFE0F', severity: 'rough' };
  }
  return { text: 'Very rough \u2014 dangerous for most recreational boats', emoji: '\u{1F6A8}', severity: 'dangerous' };
}

// --- Water Temperature ---

export function describeWaterTemp(tempF: number): {
  text: string;
  emoji: string;
  warning?: string;
} {
  if (tempF > 65) {
    return { text: 'Warm \u2014 comfortable for swimming', emoji: '\u{1F3CA}' };
  }
  if (tempF >= 58) {
    return {
      text: 'Cool \u2014 wetsuit recommended if you might fall in',
      emoji: '\u{1F9CA}',
    };
  }
  if (tempF >= 50) {
    return {
      text: 'Cold \u2014 drysuit or wetsuit required, cold shock risk',
      emoji: '\u2744\uFE0F',
      warning: 'Cold water: wear thermal protection',
    };
  }
  return {
    text: 'Very cold \u2014 hypothermia risk within minutes of immersion',
    emoji: '\u{1F6A8}',
    warning: 'Extreme cold water: drysuit required, hypothermia risk',
  };
}

// --- Visibility ---

export function describeVisibility(visMi: number): {
  text: string;
  emoji: string;
  warning?: string;
} {
  if (visMi > 10) {
    return { text: 'Clear', emoji: '\u2600\uFE0F' };
  }
  if (visMi >= 5) {
    return { text: 'Haze \u2014 reduced visibility', emoji: '\u{1F324}\uFE0F' };
  }
  if (visMi >= 1) {
    return {
      text: 'Fog \u2014 use nav lights, sound signals',
      emoji: '\u{1F32B}\uFE0F',
      warning: 'Fog: use navigation lights and sound signals',
    };
  }
  return {
    text: 'Dense fog \u2014 do not depart',
    emoji: '\u{1F6AB}',
    warning: 'Dense fog: do not depart, near-zero visibility',
  };
}

// --- Tide ---

export function describeTide(
  phase: string,
  heightFt: number
): { text: string; emoji: string } {
  if (phase === 'slack_high') {
    return { text: 'Slack high \u2014 calm current window', emoji: '\u{1F7F0}' };
  }
  if (phase === 'slack_low') {
    return { text: 'Slack low \u2014 calm current window, minimum depth', emoji: '\u{1F7F0}' };
  }
  if (phase === 'flood' && heightFt > 4) {
    return {
      text: 'High tide (flooding) \u2014 maximum depth, strong currents at Gate',
      emoji: '\u2B06\uFE0F',
    };
  }
  if (phase === 'flood') {
    return { text: `Flooding (+${heightFt.toFixed(1)}ft)`, emoji: '\u2B06\uFE0F' };
  }
  if (phase === 'ebb' && heightFt < 2) {
    return {
      text: 'Low tide (ebbing) \u2014 watch for exposed shoals',
      emoji: '\u2B07\uFE0F',
    };
  }
  if (phase === 'ebb') {
    return { text: `Ebbing (+${heightFt.toFixed(1)}ft)`, emoji: '\u2B07\uFE0F' };
  }
  return { text: `Tide: ${heightFt.toFixed(1)}ft`, emoji: '\u{1F30A}' };
}

// --- Overall Summary ---

export function describeOverall(
  windKts: number,
  waveHtFt: number,
  waterTempF: number
): string {
  const wind = describeWind(windKts);
  const wave = describeWaves(waveHtFt, 0);
  const water = describeWaterTemp(waterTempF);

  const parts: string[] = [];

  // Wind + wave summary
  if (wind.severity === 'calm' && (wave.severity === 'flat' || wave.severity === 'light')) {
    parts.push('A calm, pleasant day on the water.');
  } else if (wind.severity === 'light' && (wave.severity === 'flat' || wave.severity === 'light')) {
    parts.push('Light winds and smooth water \u2014 great conditions.');
  } else if (wind.severity === 'moderate') {
    parts.push('Moderate conditions \u2014 some wind and chop to manage.');
  } else if (wind.severity === 'strong') {
    parts.push('Breezy conditions \u2014 experienced boaters only.');
  } else if (wind.severity === 'dangerous') {
    parts.push('Dangerous conditions \u2014 not recommended for recreational boating.');
  } else {
    parts.push(`${wind.text.split('\u2014')[0].trim()} with ${wave.text.split('\u2014')[0].trim().toLowerCase()}.`);
  }

  // Water temp note
  if (waterTempF < 58) {
    parts.push(`Water is cold (${waterTempF}\u00B0F) \u2014 dress for immersion.`);
  } else if (waterTempF < 65) {
    parts.push(`Water is cool (${waterTempF}\u00B0F) \u2014 consider a wetsuit.`);
  }

  return parts.join(' ');
}
