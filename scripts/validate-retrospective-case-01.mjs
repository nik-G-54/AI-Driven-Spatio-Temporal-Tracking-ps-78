// Validates src/mockData/retrospective/case-01-extreme-precipitation/*.json
//
// Run:  node scripts/validate-retrospective-case-01.mjs
//
// Checks structure, coordinates, timestamps, units, grid spacing, NaN values,
// that NWP / AI / reference differ, and that the anomaly footprint is really
// derived from the precipitation fields. Exits non-zero on any failure.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../src/mockData/retrospective/case-01-extreme-precipitation/', import.meta.url));
const NAMES = ['metadata', 'nwp', 'ai_forecast', 'reference', 'anomaly', 'trajectory', 'metrics'];

let failures = 0;
const check = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`);
  if (!ok) failures += 1;
};

const data = {};
for (const name of NAMES) {
  try {
    data[name] = JSON.parse(readFileSync(`${DIR}${name}.json`, 'utf8'));
    check(true, `${name}.json exists and is valid JSON`);
  } catch (error) {
    check(false, `${name}.json exists and is valid JSON (${error.message})`);
  }
}
if (failures) process.exit(1);

const { metadata, nwp, ai_forecast: ai, reference, anomaly, trajectory, metrics } = data;
const grids = { nwp, ai, reference };

// Simulated labelling
for (const [name, file] of Object.entries({ ...grids, anomaly, trajectory, metrics })) {
  check(file.provenance?.data_status === 'simulated', `${name}: provenance.data_status is "simulated"`);
}
check(metadata.data_status === 'simulated' && metadata.source_type === 'prototype', 'metadata: prototype / simulated');
check(reference.provenance.source_type === 'reference_simulation', 'reference: source_type "reference_simulation"');
check(ai.model_status === 'simulated', 'ai_forecast: model_status "simulated"');
check(anomaly.prototype_threshold.status === 'prototype_threshold', 'anomaly: threshold labelled prototype_threshold');

// Grids
const timesOf = (file) => file.frames.map((f) => Date.parse(f.timestamp));
for (const [name, file] of Object.entries(grids)) {
  const g = file.grid;
  check(g.latitudes.length === g.n_lat && g.longitudes.length === g.n_lon, `${name}: axis lengths match n_lat/n_lon`);
  check(g.latitudes.every((v) => v >= -90 && v <= 90) && g.longitudes.every((v) => v >= -180 && v <= 180), `${name}: coordinates are valid`);
  const within = g.latitudes.every((v) => v >= g.bounds.south && v <= g.bounds.north) && g.longitudes.every((v) => v >= g.bounds.west && v <= g.bounds.east);
  check(within, `${name}: coordinates lie within bounds`);
  const evenLat = g.latitudes.every((v, i) => i === 0 || Math.abs(g.latitudes[i - 1] - v - g.spacing_deg) < 1e-6);
  const evenLon = g.longitudes.every((v, i) => i === 0 || Math.abs(v - g.longitudes[i - 1] - g.spacing_deg) < 1e-6);
  check(evenLat && evenLon, `${name}: grid spacing is consistent (${g.spacing_deg}°)`);
  const shapeOk = file.frames.every((f) => f.precipitation_mm.length === g.n_lat && f.precipitation_mm.every((row) => row.length === g.n_lon));
  check(shapeOk, `${name}: every frame is n_lat × n_lon`);
  const values = file.frames.flatMap((f) => f.precipitation_mm.flat());
  check(values.every((v) => Number.isFinite(v) && v >= 0), `${name}: no NaN / negative values (${values.length} values)`);
  const times = timesOf(file);
  check(times.length >= 5 && times.every((t, i) => i === 0 || t > times[i - 1]), `${name}: ${times.length} timestamps, strictly ordered`);
  check(file.provenance.unit === 'mm/6h' && file.provenance.variable === 'precipitation_mm', `${name}: unit/variable consistent`);
}
check(timesOf(nwp).join() === timesOf(ai).join() && timesOf(ai).join() === timesOf(reference).join(), 'all fields share the same time steps');
check(Date.parse(metadata.start_time) === timesOf(nwp)[0] && Date.parse(metadata.end_time) === timesOf(nwp).at(-1), 'metadata start/end match the time steps');

// Smoothness: neighbouring cells should differ by a small fraction of the peak.
for (const [name, file] of Object.entries(grids)) {
  let maxStep = 0;
  let peak = 0;
  for (const frame of file.frames) {
    const v = frame.precipitation_mm;
    for (let i = 0; i < v.length; i += 1) {
      for (let j = 0; j < v[i].length; j += 1) {
        peak = Math.max(peak, v[i][j]);
        if (j > 0) maxStep = Math.max(maxStep, Math.abs(v[i][j] - v[i][j - 1]));
        if (i > 0) maxStep = Math.max(maxStep, Math.abs(v[i][j] - v[i - 1][j]));
      }
    }
  }
  check(maxStep / peak < 0.25, `${name}: field is smooth (max neighbour step ${maxStep.toFixed(1)} vs peak ${peak})`);
}

// NWP ≠ AI ≠ Reference
const flat = (file) => file.frames.map((f) => f.precipitation_mm.flat().join(',')).join('|');
check(flat(nwp) !== flat(ai), 'NWP ≠ AI');
check(flat(ai) !== flat(reference), 'AI ≠ Reference');
check(flat(nwp) !== flat(reference), 'NWP ≠ Reference');
const peakOf = (file) => Math.max(...file.frames.flatMap((f) => f.precipitation_mm.flat()));
check(peakOf(nwp) < peakOf(ai) && peakOf(ai) <= peakOf(reference) + 1e-9, `peaks ordered as designed (NWP ${peakOf(nwp)} < AI ${peakOf(ai)} ≤ reference ${peakOf(reference)})`);

// Anomaly footprint recomputed from the fields
const threshold = anomaly.prototype_threshold.value;
function recomputeRegion(file, frameIndex) {
  const g = file.grid;
  const v = file.frames[frameIndex].precipitation_mm;
  const seen = v.map((r) => r.map(() => false));
  let best = [];
  for (let i = 0; i < g.n_lat; i += 1) {
    for (let j = 0; j < g.n_lon; j += 1) {
      if (seen[i][j] || v[i][j] < threshold) continue;
      const stack = [[i, j]];
      const region = [];
      seen[i][j] = true;
      while (stack.length) {
        const [ci, cj] = stack.pop();
        region.push([ci, cj]);
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ni = ci + di;
          const nj = cj + dj;
          if (ni < 0 || nj < 0 || ni >= g.n_lat || nj >= g.n_lon || seen[ni][nj] || v[ni][nj] < threshold) continue;
          seen[ni][nj] = true;
          stack.push([ni, nj]);
        }
      }
      if (region.length > best.length) best = region;
    }
  }
  return best;
}

let footprintsChecked = 0;
let footprintsOk = true;
for (const [name, file] of Object.entries(grids)) {
  anomaly.sources[name].forEach((frame, k) => {
    const region = recomputeRegion(file, k);
    const stored = frame.footprint;
    if (region.length === 0) {
      footprintsOk &&= stored === null && frame.exceeds_threshold === false;
      return;
    }
    footprintsChecked += 1;
    const g = file.grid;
    const v = file.frames[k].precipitation_mm;
    const expected = new Set(region.map(([i, j]) => `${g.latitudes[i]}:${g.longitudes[j]}:${v[i][j]}`));
    const actual = new Set((stored?.cells ?? []).map((c) => `${c.latitude}:${c.longitude}:${c.value}`));
    const sameCells = expected.size === actual.size && [...expected].every((c) => actual.has(c));
    const allExceed = (stored?.cells ?? []).every((c) => c.value >= threshold && Math.abs(c.anomaly - (c.value - anomaly.baseline.value)) < 0.06);
    const b = stored?.bounding_region;
    const cen = stored?.centroid;
    const inBox = cen && b && cen.latitude >= b.south && cen.latitude <= b.north && cen.longitude >= b.west && cen.longitude <= b.east;
    footprintsOk &&= sameCells && allExceed && Boolean(inBox) && stored.cell_count === region.length;
  });
}
check(footprintsOk && footprintsChecked > 0, `anomaly footprints re-derived from the fields match (${footprintsChecked} non-empty footprints)`);

// Trajectory
for (const name of ['nwp', 'ai', 'reference']) {
  const points = trajectory.sources[name];
  const ok = points.length === grids[name].frames.length && points.every((p, i) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Number.isFinite(p.intensity) && (i === 0 || Date.parse(p.timestamp) > Date.parse(points[i - 1].timestamp)));
  check(ok, `trajectory.${name}: one ordered, finite point per time step`);
}

// Metrics
check(metrics.metrics.length > 0 && metrics.metrics.every((m) => ['simulated', 'not_computed'].includes(m.status)), 'metrics: statuses are simulated / not_computed');
check(metrics.metrics.filter((m) => m.status === 'not_computed').every((m) => m.nwp_value === null && m.ai_value === null && m.reference_value === null), 'metrics: not_computed entries have null values');
check(
  metrics.metrics.every((m) => [m.nwp_value, m.ai_value, m.reference_value].every((v) => v === null || Number.isFinite(v))),
  'metrics: no NaN values',
);

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
