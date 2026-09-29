// Deterministic generator for the SIMULATED satellite context of case 01:
//   src/mockData/retrospective/case-01-extreme-precipitation/satellite.json
//
// Run (after generate-retrospective-case-01.mjs):
//   node scripts/generate-retrospective-satellite-mock.mjs
//
// THIS IS NOT SATELLITE DATA. It is a synthetic "IR brightness temperature"
// field constructed from the SIMULATED reference precipitation field (colder =
// more rain, with a wider cloud shield), only to exercise the satellite-context
// contract, the temporal-alignment logic and the UI. It carries no independent
// information and is not evidence of any validation. No INSAT/MOSDAC data was
// used, downloaded or referenced by values here.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../src/mockData/retrospective/case-01-extreme-precipitation/', import.meta.url));
const reference = JSON.parse(readFileSync(`${DIR}reference.json`, 'utf8'));
const ref = reference.grid;

const round = (x, d = 1) => Number(x.toFixed(d));
const SPACING = 0.04; // ~4.4 km, nominal size of a geostationary IR pixel (illustrative)
const { north, south, west, east } = ref.bounds;
const nLat = Math.round((north - south) / SPACING) + 1;
const nLon = Math.round((east - west) / SPACING) + 1;
const latitudes = Array.from({ length: nLat }, (_, i) => round(north - i * SPACING, 4));
const longitudes = Array.from({ length: nLon }, (_, j) => round(west + j * SPACING, 4));

// Bilinear sample of a reference frame (grid cell centres on the reference grid).
function sampleRef(frame, lat, lon) {
  const fi = Math.min(ref.n_lat - 1, Math.max(0, (ref.latitudes[0] - lat) / ref.spacing_deg));
  const fj = Math.min(ref.n_lon - 1, Math.max(0, (lon - ref.longitudes[0]) / ref.spacing_deg));
  const i0 = Math.floor(fi);
  const j0 = Math.floor(fj);
  const i1 = Math.min(ref.n_lat - 1, i0 + 1);
  const j1 = Math.min(ref.n_lon - 1, j0 + 1);
  const ti = fi - i0;
  const tj = fj - j0;
  const v = (i, j) => frame[i][j];
  return v(i0, j0) * (1 - ti) * (1 - tj) + v(i0, j1) * (1 - ti) * tj + v(i1, j0) * ti * (1 - tj) + v(i1, j1) * ti * tj;
}

const KERNEL = [-0.2, -0.1, 0, 0.1, 0.2];

// Synthetic brightness temperature: warm background, cold where the (simulated)
// reference rain is, with a wider "cloud shield" from a blurred copy.
function brightnessTemperature(frame, lat, lon) {
  let blur = 0;
  for (const dy of KERNEL) for (const dx of KERNEL) blur += sampleRef(frame, lat + dy, lon + dx);
  blur /= KERNEL.length * KERNEL.length;
  const rain = sampleRef(frame, lat, lon);
  return round(Math.max(190, 300 - 0.55 * blur - 0.3 * rain), 1);
}

const isoAt = (hours, minutes = 0) =>
  new Date(Date.parse(reference.frames[0].timestamp) + (hours * 60 + minutes) * 60000).toISOString().replace('.000Z', 'Z');

// Deliberately irregular sampling so the alignment logic has all three cases:
//   T0     exact
//   T+6h   observation at +15 min  → "nearby"
//   T+12h  exact
//   T+18h  no observation          → "missing"
//   T+24h  exact
const OBSERVATIONS = [
  { lead: 0, minutes: 0, refFrame: 0 },
  { lead: 6, minutes: 15, refFrame: 1 },
  { lead: 12, minutes: 0, refFrame: 2 },
  { lead: 24, minutes: 0, refFrame: 4 },
];

const file = {
  dataset: 'satellite_context',
  data_status: 'simulated',
  source_type: 'prototype_simulation',
  source_name: 'Prototype satellite observation (simulated; no satellite was used)',
  disclaimer:
    'SIMULATED satellite context. Built from the simulated reference field for interface demonstration only. Not INSAT/MOSDAC data, not an observation, and not validation of any model output.',
  product: {
    name: 'IR brightness temperature (simulated)',
    variable: 'brightness_temperature',
    unit: 'K',
    sensor: 'Simulated imager',
    satellite: 'None (prototype)',
    real_analogue: 'INSAT Imager TIR-1 / IR1 brightness temperature — analogue only, NOT used',
  },
  coverage: { fraction: 1, note: 'Full case domain (simulated)' },
  grid: {
    description: 'Regular latitude/longitude grid clipped to the case domain. brightness_temperature_k[row][col] ↔ latitudes[row], longitudes[col]; rows run north → south.',
    bounds: ref.bounds,
    spacing_deg: SPACING,
    resolution_km: round(SPACING * 111.32, 1),
    n_lat: nLat,
    n_lon: nLon,
    latitudes,
    longitudes,
  },
  observations: OBSERVATIONS.map((o) => ({
    observation_id: `sim-sat-case01-T${o.lead}h${o.minutes ? `+${o.minutes}m` : ''}`,
    valid_time: isoAt(o.lead, o.minutes),
    note: o.minutes ? `Simulated frame timed ${o.minutes} min after T+${o.lead}h; content built from the T+${o.lead}h reference field.` : `Simulated frame at T+${o.lead}h.`,
    brightness_temperature_k: latitudes.map((lat) => longitudes.map((lon) => brightnessTemperature(reference.frames[o.refFrame].precipitation_mm, lat, lon))),
  })),
};

function stringify(value) {
  return JSON.stringify(value, null, 2)
    .replace(/\[\s*\n\s*(-?[\d.eE+-]+(?:,\s*\n\s*-?[\d.eE+-]+)*)\s*\n\s*\]/g, (_, inner) => `[${inner.replace(/\s*\n\s*/g, ' ')}]`)
    .replace(
      /\{\s*\n\s*("(?:[^"\\]|\\.)*":\s*[^{}[\]\n]+(?:,\s*\n\s*"(?:[^"\\]|\\.)*":\s*[^{}[\]\n]+)*)\s*\n\s*\}/g,
      (_, inner) => `{ ${inner.replace(/\s*\n\s*/g, ' ')} }`,
    );
}

writeFileSync(`${DIR}satellite.json`, `${stringify(file)}\n`);
const all = file.observations.flatMap((o) => o.brightness_temperature_k.flat());
console.log(`wrote satellite.json: ${file.observations.length} frames, ${nLat}x${nLon}, BT ${Math.min(...all)}–${Math.max(...all)} K`);
