// Deterministic generator for the Phase 2 prototype dataset:
//   src/mockData/retrospective/case-01-extreme-precipitation/*.json
//
// Run:  node scripts/generate-retrospective-case-01.mjs
//
// EVERYTHING produced here is SIMULATED prototype data. It is built from smooth
// analytic (Gaussian-band) fields — no randomness, no ML model, no real
// observations. The three fields (NWP-like, "AI"-refined, reference) are
// deliberately constructed to be different but physically related. The derived
// anomaly / trajectory / metrics files are calculated from those simulated
// fields and are NOT evidence of real model performance.

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT_DIR = fileURLToPath(new URL('../src/mockData/retrospective/case-01-extreme-precipitation/', import.meta.url));

// ---- Case constants --------------------------------------------------------

const CASE_ID = 'case-01-extreme-precipitation';
const DOMAIN = { south: 17.5, north: 19.5, west: 72.5, east: 74.5 };
const LEADS = [0, 6, 12, 18, 24];
// Synthetic base time: deliberately not a real date (see metadata).
const BASE_TIME = Date.UTC(2099, 6, 1, 0, 0, 0);
const UNIT = 'mm/6h';
const VARIABLE = 'precipitation_mm';
const THRESHOLD = 60; // prototype_threshold, NOT an official IMD threshold
const CLIMATOLOGY_BASELINE = 5; // prototype constant, NOT real climatology
const NWP_SPACING = 0.125; // ~14 km
const FINE_SPACING = 0.05; // ~5.5 km

const COS_LAT = Math.cos((18.5 * Math.PI) / 180);
const BAND_ANGLE = (112 * Math.PI) / 180; // band axis, roughly parallel to a NNW–SSE coast

// ---- Helpers ---------------------------------------------------------------

const round = (x, d = 1) => Number(x.toFixed(d));
const timestamp = (h) => new Date(BASE_TIME + h * 3600e3).toISOString().replace('.000Z', 'Z');

function makeGrid(spacing) {
  const nLat = Math.round((DOMAIN.north - DOMAIN.south) / spacing) + 1;
  const nLon = Math.round((DOMAIN.east - DOMAIN.west) / spacing) + 1;
  return {
    spacing,
    nLat,
    nLon,
    // Rows run north → south; columns west → east.
    latitudes: Array.from({ length: nLat }, (_, i) => round(DOMAIN.north - i * spacing, 4)),
    longitudes: Array.from({ length: nLon }, (_, j) => round(DOMAIN.west + j * spacing, 4)),
  };
}

function blob(lat, lon, center, sa, sb) {
  const dx = (lon - center.lon) * COS_LAT;
  const dy = lat - center.lat;
  const u = dx * Math.cos(BAND_ANGLE) + dy * Math.sin(BAND_ANGLE);
  const v = -dx * Math.sin(BAND_ANGLE) + dy * Math.cos(BAND_ANGLE);
  return Math.exp(-((u * u) / (2 * sa * sa) + (v * v) / (2 * sb * sb)));
}

function shifted(center, alongDeg) {
  return { lat: center.lat + alongDeg * Math.sin(BAND_ANGLE), lon: center.lon + (alongDeg * Math.cos(BAND_ANGLE)) / COS_LAT };
}

// Slow drift of the precipitation system: south-west offshore → north-east.
const referenceCenter = (k) => ({ lat: 18.45 + 0.125 * k, lon: 72.85 + 0.1 * k });

// Field builder: a smooth elongated band (+ optional embedded core and broad
// envelope), normalised so the grid maximum equals `peak` exactly.
function buildField(grid, { center, sa, sb, core, envelope, peak }, k) {
  const shape = grid.latitudes.map((lat) =>
    grid.longitudes.map((lon) => {
      let s = blob(lat, lon, center, sa, sb);
      if (core) s += core.amp * blob(lat, lon, shifted(center, core.shift), core.sa, core.sb);
      s += envelope.amp * blob(lat, lon, center, envelope.sa, envelope.sb);
      // Very gentle deterministic modulation so the band is not perfectly symmetric.
      return s * (1 + 0.03 * Math.sin(11 * lat + 2 * k) * Math.cos(9 * lon));
    }),
  );
  const max = Math.max(...shape.flat());
  return shape.map((row) => row.map((s) => round(2 + (peak - 2) * (s / max), 1)));
}

const SOURCES = {
  nwp: {
    grid: makeGrid(NWP_SPACING),
    peaks: [25, 42, 58, 68, 50],
    // Broad, smoother, lower peak, and lagging the reference by one step (timing error).
    params: (k) => ({
      center: { lat: referenceCenter(k - 1).lat - 0.08, lon: referenceCenter(k - 1).lon - 0.06 },
      sa: 0.8,
      sb: 0.34,
      core: null,
      envelope: { amp: 0.15, sa: 1.2, sb: 0.7 },
    }),
  },
  ai: {
    grid: makeGrid(FINE_SPACING),
    peaks: [30, 78, 118, 96, 52],
    // Narrower, sharper, in step with the reference, small position offset.
    params: (k) => ({
      center: { lat: referenceCenter(k).lat + 0.03, lon: referenceCenter(k).lon - 0.04 },
      sa: 0.48,
      sb: 0.16,
      core: { amp: 0.18, shift: 0.05, sa: 0.09, sb: 0.09 },
      envelope: { amp: 0.12, sa: 0.9, sb: 0.45 },
    }),
  },
  reference: {
    grid: makeGrid(FINE_SPACING),
    peaks: [35, 85, 130, 105, 60],
    // The simulated "actual" event: narrow band with an embedded convective core.
    params: (k) => ({
      center: referenceCenter(k),
      sa: 0.42,
      sb: 0.13,
      core: { amp: 0.3, shift: 0.06, sa: 0.07, sb: 0.07 },
      envelope: { amp: 0.1, sa: 0.9, sb: 0.45 },
    }),
  },
};

const fields = {};
for (const [name, src] of Object.entries(SOURCES)) {
  fields[name] = LEADS.map((_, k) => buildField(src.grid, { ...src.params(k), peak: src.peaks[k] }, k));
}

// ---- Derived quantities ----------------------------------------------------

function cellAreaKm2(spacing, lat) {
  return spacing * 111.32 * spacing * 111.32 * Math.cos((lat * Math.PI) / 180);
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Largest 4-connected region of cells with value >= threshold.
function largestExceedanceRegion(grid, values) {
  const seen = values.map((row) => row.map(() => false));
  let best = [];
  let componentCount = 0;
  for (let i = 0; i < grid.nLat; i += 1) {
    for (let j = 0; j < grid.nLon; j += 1) {
      if (seen[i][j] || values[i][j] < THRESHOLD) continue;
      componentCount += 1;
      const stack = [[i, j]];
      const region = [];
      seen[i][j] = true;
      while (stack.length) {
        const [ci, cj] = stack.pop();
        region.push([ci, cj]);
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ni = ci + di;
          const nj = cj + dj;
          if (ni < 0 || nj < 0 || ni >= grid.nLat || nj >= grid.nLon) continue;
          if (seen[ni][nj] || values[ni][nj] < THRESHOLD) continue;
          seen[ni][nj] = true;
          stack.push([ni, nj]);
        }
      }
      if (region.length > best.length) best = region;
    }
  }
  return { region: best, componentCount };
}

function footprintOf(grid, values) {
  const { region, componentCount } = largestExceedanceRegion(grid, values);
  if (region.length === 0) return { footprint: null, componentCount };
  const cells = region
    .map(([i, j]) => ({
      latitude: grid.latitudes[i],
      longitude: grid.longitudes[j],
      value: values[i][j],
      anomaly: round(values[i][j] - CLIMATOLOGY_BASELINE, 1),
    }))
    .sort((a, b) => b.latitude - a.latitude || a.longitude - b.longitude);
  const w = cells.reduce((s, c) => s + c.anomaly, 0);
  const half = grid.spacing / 2;
  return {
    componentCount,
    footprint: {
      cell_count: cells.length,
      area_km2: round(cells.reduce((s, c) => s + cellAreaKm2(grid.spacing, c.latitude), 0), 0),
      peak: Math.max(...cells.map((c) => c.value)),
      centroid: {
        latitude: round(cells.reduce((s, c) => s + c.latitude * c.anomaly, 0) / w, 4),
        longitude: round(cells.reduce((s, c) => s + c.longitude * c.anomaly, 0) / w, 4),
      },
      bounding_region: {
        north: round(Math.max(...cells.map((c) => c.latitude)) + half, 4),
        south: round(Math.min(...cells.map((c) => c.latitude)) - half, 4),
        east: round(Math.max(...cells.map((c) => c.longitude)) + half, 4),
        west: round(Math.min(...cells.map((c) => c.longitude)) - half, 4),
      },
      cells,
    },
  };
}

// Intensity-weighted centroid of cells >= 50 % of the field maximum. Always
// defined, even when nothing exceeds the extreme threshold.
function halfMaximumCentroid(grid, values) {
  const max = Math.max(...values.flat());
  let w = 0;
  let lat = 0;
  let lon = 0;
  for (let i = 0; i < grid.nLat; i += 1) {
    for (let j = 0; j < grid.nLon; j += 1) {
      if (values[i][j] < 0.5 * max) continue;
      w += values[i][j];
      lat += grid.latitudes[i] * values[i][j];
      lon += grid.longitudes[j] * values[i][j];
    }
  }
  return { lat: lat / w, lon: lon / w };
}

function bilinear(grid, values, lat, lon) {
  const fi = Math.min(grid.nLat - 1, Math.max(0, (DOMAIN.north - lat) / grid.spacing));
  const fj = Math.min(grid.nLon - 1, Math.max(0, (lon - DOMAIN.west) / grid.spacing));
  const i0 = Math.floor(fi);
  const j0 = Math.floor(fj);
  const i1 = Math.min(grid.nLat - 1, i0 + 1);
  const j1 = Math.min(grid.nLon - 1, j0 + 1);
  const ti = fi - i0;
  const tj = fj - j0;
  return (
    values[i0][j0] * (1 - ti) * (1 - tj) +
    values[i0][j1] * (1 - ti) * tj +
    values[i1][j0] * ti * (1 - tj) +
    values[i1][j1] * ti * tj
  );
}

// Model field resampled onto the fine (reference) grid.
function onFineGrid(name, k) {
  const fine = SOURCES.reference.grid;
  if (SOURCES[name].grid === fine || name !== 'nwp') return fields[name][k];
  return fine.latitudes.map((lat) => fine.longitudes.map((lon) => bilinear(SOURCES.nwp.grid, fields.nwp[k], lat, lon)));
}

// ---- Anomaly ---------------------------------------------------------------

const anomalySources = {};
const trajectorySources = {};
for (const [name, src] of Object.entries(SOURCES)) {
  anomalySources[name] = LEADS.map((lead, k) => {
    const values = fields[name][k];
    const { footprint, componentCount } = footprintOf(src.grid, values);
    return {
      timestamp: timestamp(lead),
      lead_hours: lead,
      peak: Math.max(...values.flat()),
      exceeds_threshold: footprint !== null,
      exceedance_region_count: componentCount,
      footprint,
    };
  });
  trajectorySources[name] = LEADS.map((lead, k) => {
    const c = halfMaximumCentroid(src.grid, fields[name][k]);
    return {
      timestamp: timestamp(lead),
      lead_hours: lead,
      latitude: round(c.lat, 4),
      longitude: round(c.lon, 4),
      intensity: Math.max(...fields[name][k].flat()),
      footprint_area_km2: anomalySources[name][k].footprint?.area_km2 ?? 0,
    };
  });
}

// ---- Metrics (calculated from the simulated fields) ------------------------

const peakIdx = (name) => anomalySources[name].reduce((b, f, k, a) => (f.peak > a[b].peak ? k : b), 0);
const REF_PEAK_K = peakIdx('reference');
const fineGrid = SOURCES.reference.grid;

function mae(name) {
  let total = 0;
  for (let k = 0; k < LEADS.length; k += 1) {
    const model = onFineGrid(name, k);
    const ref = fields.reference[k];
    let sum = 0;
    for (let i = 0; i < fineGrid.nLat; i += 1) for (let j = 0; j < fineGrid.nLon; j += 1) sum += Math.abs(model[i][j] - ref[i][j]);
    total += sum / (fineGrid.nLat * fineGrid.nLon);
  }
  return round(total / LEADS.length, 2);
}

function iou(name) {
  const model = onFineGrid(name, REF_PEAK_K);
  const ref = fields.reference[REF_PEAK_K];
  let inter = 0;
  let union = 0;
  for (let i = 0; i < fineGrid.nLat; i += 1) {
    for (let j = 0; j < fineGrid.nLon; j += 1) {
      const a = model[i][j] >= THRESHOLD;
      const b = ref[i][j] >= THRESHOLD;
      if (a && b) inter += 1;
      if (a || b) union += 1;
    }
  }
  return union === 0 ? null : round((inter / union) * 100, 1);
}

const globalPeak = (name) => Math.max(...anomalySources[name].map((f) => f.peak));
const areaAtRefPeak = (name) => anomalySources[name][REF_PEAK_K].footprint?.area_km2 ?? 0;
const centroidAt = (name) => trajectorySources[name][REF_PEAK_K];
const centroidDist = (name) =>
  round(haversineKm({ lat: centroidAt(name).latitude, lon: centroidAt(name).longitude }, { lat: centroidAt('reference').latitude, lon: centroidAt('reference').longitude }), 1);
const peakTime = (name) => LEADS[peakIdx(name)];

const CALC_NOTE = 'Calculated from the simulated fields by the generator script; fields were constructed to illustrate refinement, so this is not evidence of real model performance.';
const evalFrame = `T+${LEADS[REF_PEAK_K]}h (reference peak frame)`;

const metrics = [
  { metric: 'Peak intensity', nwp_value: globalPeak('nwp'), ai_value: globalPeak('ai'), reference_value: globalPeak('reference'), unit: UNIT, status: 'simulated', scope: 'all frames, field maximum', note: CALC_NOTE },
  { metric: 'Peak intensity error', nwp_value: round(globalPeak('nwp') - globalPeak('reference'), 1), ai_value: round(globalPeak('ai') - globalPeak('reference'), 1), reference_value: null, unit: UNIT, status: 'simulated', scope: 'all frames; model peak − reference peak', note: CALC_NOTE },
  { metric: 'Mean absolute error', nwp_value: mae('nwp'), ai_value: mae('ai'), reference_value: null, unit: UNIT, status: 'simulated', scope: 'all frames, on the 0.05° reference grid (NWP bilinearly resampled)', note: CALC_NOTE },
  { metric: 'Spatial overlap (IoU of exceedance area)', nwp_value: iou('nwp'), ai_value: iou('ai'), reference_value: null, unit: '%', status: 'simulated', scope: evalFrame, note: CALC_NOTE },
  { metric: 'Centroid distance', nwp_value: centroidDist('nwp'), ai_value: centroidDist('ai'), reference_value: null, unit: 'km', status: 'simulated', scope: `${evalFrame}; half-maximum centroid vs reference`, note: CALC_NOTE },
  { metric: 'Affected area (exceedance footprint)', nwp_value: areaAtRefPeak('nwp'), ai_value: areaAtRefPeak('ai'), reference_value: areaAtRefPeak('reference'), unit: 'km²', status: 'simulated', scope: evalFrame, note: CALC_NOTE },
  { metric: 'Affected-area difference', nwp_value: areaAtRefPeak('nwp') - areaAtRefPeak('reference'), ai_value: areaAtRefPeak('ai') - areaAtRefPeak('reference'), reference_value: null, unit: 'km²', status: 'simulated', scope: `${evalFrame}; model − reference`, note: CALC_NOTE },
  { metric: 'Timing difference of peak', nwp_value: peakTime('nwp') - peakTime('reference'), ai_value: peakTime('ai') - peakTime('reference'), reference_value: null, unit: 'h', status: 'simulated', scope: 'time of field maximum, model − reference', note: CALC_NOTE },
  { metric: 'Event detection score', nwp_value: null, ai_value: null, reference_value: null, unit: '', status: 'not_computed', scope: 'n/a', note: 'Not computed — needs a defined detection protocol; not derived in Phase 2.' },
  { metric: 'Confidence calibration', nwp_value: null, ai_value: null, reference_value: null, unit: '', status: 'not_computed', scope: 'n/a', note: 'Not computed — the simulated AI output has no real probabilistic confidence to calibrate.' },
];

// ---- Assemble files --------------------------------------------------------

const timesteps = LEADS.map(timestamp);

function provenance(name, extra) {
  const g = SOURCES[name].grid;
  return {
    source_type: extra.source_type,
    data_status: 'simulated',
    variable: VARIABLE,
    unit: UNIT,
    resolution_deg: g.spacing,
    resolution_km: round(g.spacing * 111.32, 1),
    valid_times: timesteps,
    ...extra,
  };
}

function gridFile(name, header) {
  const g = SOURCES[name].grid;
  return {
    ...header,
    grid: {
      description: 'Regular latitude/longitude grid. precipitation_mm[frame][row][col] ↔ latitudes[row], longitudes[col]; rows run north → south.',
      bounds: DOMAIN,
      spacing_deg: g.spacing,
      n_lat: g.nLat,
      n_lon: g.nLon,
      latitudes: g.latitudes,
      longitudes: g.longitudes,
    },
    frames: LEADS.map((lead, k) => ({ timestamp: timestamp(lead), lead_hours: lead, precipitation_mm: fields[name][k] })),
  };
}

const NOT_REAL = 'SIMULATED prototype data. Not a real observation, real NWP output or real model output.';

const files = {
  'metadata.json': {
    case_id: CASE_ID,
    event_type: 'extreme_rainfall',
    event_name: 'Prototype Case 01 — Extreme Precipitation (simulated)',
    selector_label: 'Case 01 — Extreme Precipitation (Prototype)',
    region: 'Konkan–Maharashtra coast (prototype domain)',
    country: 'India',
    start_time: timestamp(LEADS[0]),
    end_time: timestamp(LEADS[LEADS.length - 1]),
    time_step_hours: 6,
    description:
      'A simulated slow-moving band of extreme precipitation near a coast, used to build and test the retrospective NWP → AI → reference comparison. The event is fictional; the region only sets the geographic frame.',
    prototype_status: 'prototype_simulation',
    source_type: 'prototype',
    source_name: 'Deterministic analytic generator (scripts/generate-retrospective-case-01.mjs)',
    data_status: 'simulated',
    timestamps_note: 'Timestamps are synthetic (year 2099) so they cannot be mistaken for a real event date.',
    domain: DOMAIN,
    disclaimer: NOT_REAL,
  },
  'nwp.json': gridFile('nwp', {
    dataset: 'nwp',
    description: 'NWP-like forecast field before AI refinement: broad, smooth, lower peak, and lagging the reference by one time step.',
    provenance: provenance('nwp', { source: 'Simulated NWP-like field (generator)', source_type: 'nwp_simulation' }),
    disclaimer: NOT_REAL,
  }),
  'ai_forecast.json': gridFile('ai', {
    dataset: 'ai_forecast',
    model: 'Simulated AI refinement (deterministic generator; no ML model was run)',
    model_status: 'simulated',
    confidence: { value: 0.7, status: 'simulated', note: 'Placeholder number; the simulated output has no real model confidence.' },
    description: 'Hypothetical AI-refined field: narrower, sharper peak, better localisation, in step with the reference.',
    provenance: provenance('ai', { source: 'Simulated AI-refined field (generator)', source_type: 'ai_simulation' }),
    disclaimer: NOT_REAL,
  }),
  'reference.json': gridFile('reference', {
    dataset: 'reference',
    description: 'Simulated "actual" event used as the comparison target: narrow band with an embedded convective core.',
    provenance: provenance('reference', { source: 'Simulated reference field (generator)', source_type: 'reference_simulation' }),
    disclaimer: NOT_REAL,
  }),
  'anomaly.json': {
    dataset: 'anomaly',
    anomaly_type: 'precipitation_exceedance',
    variable: VARIABLE,
    unit: UNIT,
    prototype_threshold: {
      value: THRESHOLD,
      unit: UNIT,
      status: 'prototype_threshold',
      note: 'Prototype threshold chosen for this simulation. It is NOT an official IMD (or other agency) threshold.',
    },
    baseline: { value: CLIMATOLOGY_BASELINE, unit: UNIT, note: 'Constant prototype baseline used to express anomaly = value − baseline. Not real climatology.' },
    derivation:
      'For each source and time step: cells with precipitation_mm >= prototype_threshold are exceedance cells; the largest 4-connected region of exceedance cells is the event footprint (cells, intensity, centroid, bounding region, area). Recomputed from the simulated fields by scripts/validate-retrospective-case-01.mjs.',
    provenance: { source: 'Derived from nwp.json, ai_forecast.json and reference.json', source_type: 'derived', data_status: 'simulated', variable: VARIABLE, unit: UNIT, valid_times: timesteps },
    sources: anomalySources,
    disclaimer: NOT_REAL,
  },
  'trajectory.json': {
    dataset: 'trajectory',
    representation: 'evolving_footprint_centroid',
    basis: 'half_maximum_centroid',
    note: 'This precipitation system is a slowly moving band, not a cyclone-like point track. Each point is the intensity-weighted centroid of cells >= 50 % of the field maximum at that time step, plus the intensity and exceedance-footprint area, to support animation of the evolving footprint.',
    unit: UNIT,
    provenance: { source: 'Derived from nwp.json, ai_forecast.json and reference.json', source_type: 'derived', data_status: 'simulated', variable: VARIABLE, unit: UNIT, valid_times: timesteps },
    sources: trajectorySources,
    disclaimer: NOT_REAL,
  },
  'metrics.json': {
    dataset: 'metrics',
    reference_peak_frame_lead_hours: LEADS[REF_PEAK_K],
    provenance: { source: 'Calculated from the simulated fields', source_type: 'derived', data_status: 'simulated', variable: VARIABLE, unit: UNIT },
    statement: 'Prototype calculations on simulated data. Not evidence of real model performance.',
    metrics,
    disclaimer: NOT_REAL,
  },
};

// JSON.stringify(…, 2) puts every array element on its own line; collapse
// numeric arrays and flat objects onto single lines to keep the files readable.
function stringify(value) {
  return JSON.stringify(value, null, 2)
    .replace(/\[\s*\n\s*(-?[\d.eE+-]+(?:,\s*\n\s*-?[\d.eE+-]+)*)\s*\n\s*\]/g, (_, inner) => `[${inner.replace(/\s*\n\s*/g, ' ')}]`)
    .replace(
      /\{\s*\n\s*("(?:[^"\\]|\\.)*":\s*[^{}[\]\n]+(?:,\s*\n\s*"(?:[^"\\]|\\.)*":\s*[^{}[\]\n]+)*)\s*\n\s*\}/g,
      (_, inner) => `{ ${inner.replace(/\s*\n\s*/g, ' ')} }`,
    );
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, content] of Object.entries(files)) {
  writeFileSync(OUT_DIR + name, `${stringify(content)}\n`);
  console.log(`wrote ${name}`);
}
console.log('metrics:', metrics.map((m) => `${m.metric}: nwp=${m.nwp_value} ai=${m.ai_value} ref=${m.reference_value} ${m.unit}`).join('\n  '));
