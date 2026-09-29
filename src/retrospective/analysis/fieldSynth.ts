// Deterministic field synthesis for the weather-analysis workspace.
//
// The existing backend mock provides summary values (peaks, radii, track, thresholds,
// time evolution) but no gridded fields for most events. This module turns those
// values into smooth, reproducible fields so the map views have something to show.
// No randomness. Everything produced here is SIMULATED prototype data — the "AI
// refined" field is an analytic construction, not the output of a model.

import type {
  AiOutput,
  AnomalyData,
  AnomalyFrame,
  DatasetKey,
  EventFootprint,
  GeoBounds,
  GeoPoint,
  GridPoint,
  NwpInput,
  Provenance,
  SpatialField,
  TimeStepField,
  TrajectoryData,
  TrajectoryPoint,
} from '../retrospective.types';
import type { EvolutionPoint, VariableAnalysis, VariableMeta } from './analysis.types';

const DEG = Math.PI / 180;
const KM_PER_DEG = 111.32;

const round = (x: number, d = 1) => Number(x.toFixed(d));

// ---- Inputs ----------------------------------------------------------------

export interface StepCenter {
  leadTimeHours: number;
  timestamp: string | null;
  center: GeoPoint;
  // 0..1 strength of the event at this step (scales the peak above baseline).
  intensity: number;
}

export interface ShapeSpec {
  // blob: anisotropic Gaussian band (+ optional embedded core); vortex: ring of maximum wind
  // (radius = sigmaAlongKm); radial: isotropic Gaussian (sigma = sigmaAlongKm).
  kind: 'blob' | 'vortex' | 'radial';
  baseline: number;
  peak: number;
  sigmaAlongKm: number;
  sigmaAcrossKm: number;
  // Band orientation / vortex asymmetry axis, degrees counter-clockwise from east.
  angleDeg: number;
  envelope: { amp: number; sigmaKm: number };
  core?: { amp: number; sigmaKm: number; shiftKm: number };
}

export interface SynthVariableInput {
  meta: VariableMeta;
  steps: StepCenter[];
  bounds: GeoBounds;
  spacing: { nwp: number; ai: number };
  ai: ShapeSpec;
  nwp: {
    // NWP peak-above-baseline as a fraction of the AI peak-above-baseline.
    peakRatio: number;
    // NWP feature size = AI size × broaden.
    broaden: number;
    offsetKm: { east: number; north: number };
    // The NWP event lags the AI event by this many steps.
    lagSteps: number;
  };
  threshold: number;
  provenance: Provenance;
  labels: { nwpSource: string; aiModel: string; nwpResolutionKm: number; aiResolutionKm: number };
  confidence: (stepIndex: number) => number | null;
  // 'system_track': AI path = the backend track exactly. Otherwise the path is the
  // half-maximum centroid of the evolving footprint.
  trajectory: { representation: string; basis: string; note: string; useBackendCenter: boolean } | null;
}

// ---- Grid ------------------------------------------------------------------

interface Grid {
  spacing: number;
  bounds: GeoBounds;
  latitudes: number[]; // north → south
  longitudes: number[]; // west → east
  values: number[][];
}

function axes(bounds: GeoBounds, spacing: number) {
  const nLat = Math.round((bounds.north - bounds.south) / spacing) + 1;
  const nLon = Math.round((bounds.east - bounds.west) / spacing) + 1;
  return {
    latitudes: Array.from({ length: nLat }, (_, i) => round(bounds.north - i * spacing, 4)),
    longitudes: Array.from({ length: nLon }, (_, j) => round(bounds.west + j * spacing, 4)),
  };
}

function offsetCenter(center: GeoPoint, offsetKm: { east: number; north: number }): GeoPoint {
  return {
    latitude: center.latitude + offsetKm.north / KM_PER_DEG,
    longitude: center.longitude + offsetKm.east / (KM_PER_DEG * Math.cos(center.latitude * DEG)),
  };
}

function shapeValue(spec: ShapeSpec, dxKm: number, dyKm: number): number {
  const angle = spec.angleDeg * DEG;
  const r = Math.hypot(dxKm, dyKm);
  const env = spec.envelope.amp * Math.exp(-(r * r) / (2 * spec.envelope.sigmaKm ** 2));
  if (spec.kind === 'vortex') {
    const rm = spec.sigmaAlongKm;
    const profile = (r / rm) * Math.exp(1 - r / rm);
    // Right-hand asymmetry of a moving vortex.
    const asym = 1 + 0.25 * Math.cos(Math.atan2(dyKm, dxKm) - angle);
    return profile * asym + env;
  }
  if (spec.kind === 'radial') return Math.exp(-(r * r) / (2 * spec.sigmaAlongKm ** 2)) + env;
  const u = dxKm * Math.cos(angle) + dyKm * Math.sin(angle);
  const v = -dxKm * Math.sin(angle) + dyKm * Math.cos(angle);
  let s = Math.exp(-(u * u) / (2 * spec.sigmaAlongKm ** 2) - (v * v) / (2 * spec.sigmaAcrossKm ** 2));
  if (spec.core) {
    const cu = u - spec.core.shiftKm;
    s += spec.core.amp * Math.exp(-(cu * cu + v * v) / (2 * spec.core.sigmaKm ** 2));
  }
  return s + env;
}

function buildGrid(bounds: GeoBounds, spacing: number, center: GeoPoint, spec: ShapeSpec, intensity: number, stepIndex: number): Grid {
  const { latitudes, longitudes } = axes(bounds, spacing);
  const cosLat = Math.cos(center.latitude * DEG);
  const raw = latitudes.map((lat) =>
    longitudes.map((lon) => {
      const s = shapeValue(spec, (lon - center.longitude) * KM_PER_DEG * cosLat, (lat - center.latitude) * KM_PER_DEG);
      // Gentle deterministic modulation so features are not perfectly symmetric.
      return s * (1 + 0.03 * Math.sin(9 * lat + 2 * stepIndex) * Math.cos(7 * lon));
    }),
  );
  const max = Math.max(...raw.flat()) || 1;
  const peakStep = spec.baseline + (spec.peak - spec.baseline) * intensity;
  const values = raw.map((row) => row.map((s) => round(spec.baseline + (peakStep - spec.baseline) * (s / max), 1)));
  return { spacing, bounds, latitudes, longitudes, values };
}

function toField(grid: Grid, unit: string): SpatialField {
  const points: GridPoint[] = [];
  grid.latitudes.forEach((latitude, i) => {
    grid.longitudes.forEach((longitude, j) => points.push({ latitude, longitude, value: grid.values[i][j] }));
  });
  return { unit, resolutionKm: round(grid.spacing * KM_PER_DEG, 1), bounds: grid.bounds, points };
}

// ---- Derived quantities ----------------------------------------------------

const cellAreaKm2 = (spacing: number, lat: number) => spacing * KM_PER_DEG * spacing * KM_PER_DEG * Math.cos(lat * DEG);

function peakOf(grid: Grid): number {
  let m = -Infinity;
  for (const row of grid.values) for (const v of row) if (v > m) m = v;
  return m;
}

// Largest 4-connected region of cells at or above `threshold`.
function footprintOf(grid: Grid, threshold: number, baseline: number): EventFootprint | null {
  const nLat = grid.latitudes.length;
  const nLon = grid.longitudes.length;
  const seen = grid.values.map((row) => row.map(() => false));
  let best: Array<[number, number]> = [];
  for (let i = 0; i < nLat; i += 1) {
    for (let j = 0; j < nLon; j += 1) {
      if (seen[i][j] || grid.values[i][j] < threshold) continue;
      const stack: Array<[number, number]> = [[i, j]];
      const region: Array<[number, number]> = [];
      seen[i][j] = true;
      while (stack.length) {
        const [ci, cj] = stack.pop() as [number, number];
        region.push([ci, cj]);
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ni = ci + di;
          const nj = cj + dj;
          if (ni < 0 || nj < 0 || ni >= nLat || nj >= nLon || seen[ni][nj] || grid.values[ni][nj] < threshold) continue;
          seen[ni][nj] = true;
          stack.push([ni, nj]);
        }
      }
      if (region.length > best.length) best = region;
    }
  }
  if (best.length === 0) return null;
  const cells = best.map(([i, j]) => ({
    latitude: grid.latitudes[i],
    longitude: grid.longitudes[j],
    value: grid.values[i][j],
    anomaly: round(grid.values[i][j] - baseline, 1),
  }));
  const w = cells.reduce((s, c) => s + Math.max(c.anomaly, 1e-6), 0);
  const half = grid.spacing / 2;
  return {
    cellCount: cells.length,
    areaKm2: Math.round(cells.reduce((s, c) => s + cellAreaKm2(grid.spacing, c.latitude), 0)),
    peak: Math.max(...cells.map((c) => c.value)),
    centroid: {
      latitude: round(cells.reduce((s, c) => s + c.latitude * Math.max(c.anomaly, 1e-6), 0) / w, 4),
      longitude: round(cells.reduce((s, c) => s + c.longitude * Math.max(c.anomaly, 1e-6), 0) / w, 4),
    },
    boundingRegion: {
      north: round(Math.max(...cells.map((c) => c.latitude)) + half, 4),
      south: round(Math.min(...cells.map((c) => c.latitude)) - half, 4),
      east: round(Math.max(...cells.map((c) => c.longitude)) + half, 4),
      west: round(Math.min(...cells.map((c) => c.longitude)) - half, 4),
    },
    cells,
  };
}

// Area (and centroid) of cells at least half-way from baseline to the field's own peak.
function halfMaximum(grid: Grid, baseline: number): { areaKm2: number; centroid: GeoPoint } {
  const peak = peakOf(grid);
  const cut = baseline + 0.5 * (peak - baseline);
  let area = 0;
  let w = 0;
  let lat = 0;
  let lon = 0;
  grid.latitudes.forEach((la, i) => {
    grid.longitudes.forEach((lo, j) => {
      const v = grid.values[i][j];
      if (v < cut) return;
      const weight = Math.max(v - baseline, 1e-6);
      area += cellAreaKm2(grid.spacing, la);
      w += weight;
      lat += la * weight;
      lon += lo * weight;
    });
  });
  return { areaKm2: Math.round(area), centroid: { latitude: round(lat / w, 4), longitude: round(lon / w, 4) } };
}

// ---- Assembly ---------------------------------------------------------------

export function synthesizeVariable(input: SynthVariableInput): VariableAnalysis {
  const { meta, steps, bounds, spacing, ai, nwp, threshold } = input;
  const scaleShape = (s: ShapeSpec, k: number, peakRatio: number): ShapeSpec => ({
    ...s,
    peak: s.baseline + (s.peak - s.baseline) * peakRatio,
    sigmaAlongKm: s.sigmaAlongKm * k,
    sigmaAcrossKm: s.sigmaAcrossKm * k,
    envelope: { amp: s.envelope.amp, sigmaKm: s.envelope.sigmaKm * k },
    core: s.core ? { ...s.core, sigmaKm: s.core.sigmaKm * k, shiftKm: s.core.shiftKm * k } : undefined,
  });
  const nwpShape = scaleShape(ai, nwp.broaden, nwp.peakRatio);

  const aiGrids = steps.map((s, i) => buildGrid(bounds, spacing.ai, s.center, ai, s.intensity, i));
  const nwpGrids = steps.map((_, i) => {
    const lagged = steps[Math.max(0, i - nwp.lagSteps)];
    return buildGrid(bounds, spacing.nwp, offsetCenter(lagged.center, nwp.offsetKm), nwpShape, lagged.intensity, i);
  });

  const frames = (grids: Grid[]): TimeStepField[] =>
    grids.map((g, i) => ({ timestamp: steps[i].timestamp, leadTimeHours: steps[i].leadTimeHours, field: toField(g, meta.unit) }));

  const nwpInput: NwpInput = {
    source: input.labels.nwpSource,
    variable: meta.id,
    unit: meta.unit,
    frames: frames(nwpGrids),
    provenance: input.provenance,
  };
  const aiOutput: AiOutput = {
    model: input.labels.aiModel,
    modelStatus: 'simulated',
    variable: meta.id,
    unit: meta.unit,
    confidence: input.confidence(0),
    frames: frames(aiGrids),
    provenance: input.provenance,
  };

  const footprintFrames = (grids: Grid[]): AnomalyFrame[] =>
    grids.map((g, i) => {
      const footprint = footprintOf(g, threshold, ai.baseline);
      return {
        timestamp: steps[i].timestamp,
        leadTimeHours: steps[i].leadTimeHours,
        peak: peakOf(g),
        exceedsThreshold: footprint !== null,
        footprint,
      };
    });
  const nwpFootprints = footprintFrames(nwpGrids);
  const aiFootprints = footprintFrames(aiGrids);

  const anomaly: AnomalyData = {
    anomalyType: `${meta.id}_exceedance`,
    unit: meta.unit,
    threshold: {
      value: threshold,
      unit: meta.unit,
      status: 'prototype_threshold',
      note: 'Prototype threshold chosen for this simulation. It is NOT an official IMD (or other agency) threshold.',
    },
    baseline: { value: ai.baseline, unit: meta.unit, note: 'Prototype background value used to express anomaly = value − baseline.' },
    derivation:
      'Cells with value ≥ prototype threshold are exceedance cells; the largest 4-connected region is the event footprint (cells, intensity, centroid, bounding region, area). Computed in the browser from the simulated fields.',
    // No separate reference for these events: the "reference" slot repeats the AI frames and is never shown.
    frames: { nwp: nwpFootprints, ai: aiFootprints, reference: aiFootprints } as Record<DatasetKey, AnomalyFrame[]>,
    provenance: { ...input.provenance, kind: 'derived', sourceType: 'derived', sourceName: 'Derived from the simulated fields' },
  };

  let trajectory: TrajectoryData | null = null;
  if (input.trajectory) {
    const pointsFor = (grids: Grid[], useBackend: boolean, footprints: AnomalyFrame[]): TrajectoryPoint[] =>
      grids.map((g, i) => {
        const centroid = useBackend ? steps[i].center : halfMaximum(g, ai.baseline).centroid;
        return {
          timestamp: steps[i].timestamp,
          leadTimeHours: steps[i].leadTimeHours,
          latitude: centroid.latitude,
          longitude: centroid.longitude,
          intensity: peakOf(g),
          footprintAreaKm2: footprints[i].footprint?.areaKm2 ?? 0,
        };
      });
    const aiPoints = pointsFor(aiGrids, input.trajectory.useBackendCenter, aiFootprints);
    trajectory = {
      representation: input.trajectory.representation,
      basis: input.trajectory.basis,
      note: input.trajectory.note,
      unit: meta.unit,
      points: { nwp: pointsFor(nwpGrids, false, nwpFootprints), ai: aiPoints, reference: aiPoints },
      provenance: { ...input.provenance, kind: 'derived', sourceType: 'derived', sourceName: 'Derived from the backend track / simulated fields' },
    };
  }

  const evolution: EvolutionPoint[] = steps.map((s, i) => ({
    leadTimeHours: s.leadTimeHours,
    nwpPeak: peakOf(nwpGrids[i]),
    aiPeak: peakOf(aiGrids[i]),
    nwpFootprintAreaKm2: nwpFootprints[i].footprint?.areaKm2 ?? 0,
    aiFootprintAreaKm2: aiFootprints[i].footprint?.areaKm2 ?? 0,
    nwpHalfMaxAreaKm2: halfMaximum(nwpGrids[i], ai.baseline).areaKm2,
    aiHalfMaxAreaKm2: halfMaximum(aiGrids[i], ai.baseline).areaKm2,
    confidence: input.confidence(i),
  }));

  const all = [...nwpGrids, ...aiGrids].flatMap((g) => g.values.flat());
  let min = Infinity;
  let max = -Infinity;
  for (const v of all) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  return {
    meta,
    nwp: nwpInput,
    ai: aiOutput,
    reference: null,
    anomaly,
    trajectory,
    validation: null,
    evolution,
    range: { min, max },
    threshold,
    baseline: ai.baseline,
  };
}

// ---- Small helpers used by the adapter -------------------------------------

// Linear interpolation of a track [{lead, lat, lon}] at `lead` hours (clamped at the ends).
export function interpolateTrack(points: Array<{ lead: number; latitude: number; longitude: number }>, lead: number): GeoPoint {
  const sorted = [...points].sort((a, b) => a.lead - b.lead);
  if (lead <= sorted[0].lead) return { latitude: sorted[0].latitude, longitude: sorted[0].longitude };
  for (let i = 1; i < sorted.length; i += 1) {
    if (lead <= sorted[i].lead) {
      const a = sorted[i - 1];
      const b = sorted[i];
      const t = (lead - a.lead) / (b.lead - a.lead || 1);
      return { latitude: a.latitude + (b.latitude - a.latitude) * t, longitude: a.longitude + (b.longitude - a.longitude) * t };
    }
  }
  const last = sorted[sorted.length - 1];
  return { latitude: last.latitude, longitude: last.longitude };
}

// Linear interpolation of a scalar series [{x, y}] at x (clamped).
export function interpolateSeries(points: Array<{ x: number; y: number }>, x: number): number {
  const sorted = [...points].sort((a, b) => a.x - b.x);
  if (x <= sorted[0].x) return sorted[0].y;
  for (let i = 1; i < sorted.length; i += 1) {
    if (x <= sorted[i].x) {
      const a = sorted[i - 1];
      const b = sorted[i];
      return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x || 1);
    }
  }
  return sorted[sorted.length - 1].y;
}

const MONTHS: Record<string, number> = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };

// "28 SEP 2026, 12:00 UTC" or "13 MAY 2022 12:00 UTC" → ISO 8601, or null.
export function parseBackendTime(text: string | null | undefined): string | null {
  const m = text?.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4}),?\s+(\d{1,2}):(\d{2})/);
  if (!m || MONTHS[m[2].toUpperCase()] === undefined) return null;
  return new Date(Date.UTC(Number(m[3]), MONTHS[m[2].toUpperCase()], Number(m[1]), Number(m[4]), Number(m[5]))).toISOString().replace('.000Z', 'Z');
}

export function addHours(iso: string | null, hours: number): string | null {
  return iso === null ? null : new Date(Date.parse(iso) + hours * 3600000).toISOString().replace('.000Z', 'Z');
}
