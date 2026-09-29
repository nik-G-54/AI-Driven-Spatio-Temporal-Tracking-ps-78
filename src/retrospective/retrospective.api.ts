// Data adapter for the Retrospective AI Validation page.
//
// Components must go through these functions instead of importing JSON or
// fetching data directly. Today the source is mock JSON; later it becomes a
// real backend / ML pipeline. The function signatures and the
// `RetrospectiveCase` contract in `retrospective.types.ts` are the replacement
// point — UI code must not change.
//
// Two mock sources feed the contract:
//   - case-01 (rich): src/mockData/retrospective/case-01-extreme-precipitation/*.json
//     (multi-time-step gridded fields + derived anomaly / trajectory / metrics)
//   - cases.json (simplified): compact single-frame placeholders for the other cases
// ALL values are simulated prototype data.

import metadataData from '../mockData/retrospective/case-01-extreme-precipitation/metadata.json';
import nwpData from '../mockData/retrospective/case-01-extreme-precipitation/nwp.json';
import aiForecastData from '../mockData/retrospective/case-01-extreme-precipitation/ai_forecast.json';
import referenceData from '../mockData/retrospective/case-01-extreme-precipitation/reference.json';
import anomalyData from '../mockData/retrospective/case-01-extreme-precipitation/anomaly.json';
import trajectoryData from '../mockData/retrospective/case-01-extreme-precipitation/trajectory.json';
import metricsData from '../mockData/retrospective/case-01-extreme-precipitation/metrics.json';
import simplifiedCasesData from '../mockData/retrospective/cases.json';
import replayMapLayersData from '../mockData/historicalReplay/mapLayers.json';
import type {
  AnomalyData,
  AnomalyFrame,
  DatasetKey,
  EventDetection,
  EventType,
  GeoBounds,
  GridPoint,
  Provenance,
  RetrospectiveCase,
  RetrospectiveCaseOption,
  SpatialField,
  TimeStepField,
  TrajectoryData,
  TrajectoryPoint,
  ValidationMetric,
} from './retrospective.types';

export type * from './retrospective.types';

// ============================================================================
// Case 01 — structured dataset (snake_case JSON → camelCase contract)
// ============================================================================

interface RawProvenance {
  source?: string;
  source_type: string;
  data_status: string;
  source_name?: string;
  resolution_km?: number;
}

interface RawGridDataset {
  provenance: RawProvenance;
  grid: {
    bounds: GeoBounds;
    latitudes: number[];
    longitudes: number[];
  };
  frames: Array<{ timestamp: string; lead_hours: number; precipitation_mm: number[][] }>;
}

interface RawFootprint {
  cell_count: number;
  area_km2: number;
  peak: number;
  centroid: { latitude: number; longitude: number };
  bounding_region: GeoBounds;
  cells: Array<{ latitude: number; longitude: number; value: number; anomaly: number }>;
}

interface RawAnomaly {
  anomaly_type: string;
  unit: string;
  prototype_threshold: { value: number; unit: string; status: string; note: string };
  baseline: { value: number; unit: string; note: string };
  derivation: string;
  provenance: RawProvenance;
  sources: Record<
    DatasetKey,
    Array<{
      timestamp: string;
      lead_hours: number;
      peak: number;
      exceeds_threshold: boolean;
      footprint: RawFootprint | null;
    }>
  >;
}

interface RawTrajectory {
  representation: string;
  basis: string;
  note: string;
  unit: string;
  provenance: RawProvenance;
  sources: Record<
    DatasetKey,
    Array<{
      timestamp: string;
      lead_hours: number;
      latitude: number;
      longitude: number;
      intensity: number;
      footprint_area_km2: number;
    }>
  >;
}

interface RawMetrics {
  metrics: Array<{
    metric: string;
    nwp_value: number | null;
    ai_value: number | null;
    reference_value: number | null;
    unit: string;
    status: 'simulated' | 'not_computed';
    scope: string;
    note: string;
  }>;
}

const CASE_01_ID = metadataData.case_id;

function toProvenance(raw: RawProvenance, kind: Provenance['kind'], note: string): Provenance {
  return {
    kind,
    isMock: raw.data_status !== 'real',
    dataStatus: raw.data_status === 'real' ? 'real' : 'simulated',
    sourceType: raw.source_type,
    sourceName: raw.source_name ?? raw.source ?? raw.source_type,
    note,
  };
}

function gridFrames(raw: RawGridDataset, unit: string): TimeStepField[] {
  const { latitudes, longitudes, bounds } = raw.grid;
  return raw.frames.map((frame) => {
    const points: GridPoint[] = [];
    latitudes.forEach((latitude, row) => {
      longitudes.forEach((longitude, col) => {
        points.push({ latitude, longitude, value: frame.precipitation_mm[row][col] });
      });
    });
    return {
      timestamp: frame.timestamp,
      leadTimeHours: frame.lead_hours,
      field: { unit, resolutionKm: raw.provenance.resolution_km ?? null, bounds, points },
    };
  });
}

function toAnomaly(raw: RawAnomaly): AnomalyData {
  const convert = (key: DatasetKey): AnomalyFrame[] =>
    raw.sources[key].map((frame) => ({
      timestamp: frame.timestamp,
      leadTimeHours: frame.lead_hours,
      peak: frame.peak,
      exceedsThreshold: frame.exceeds_threshold,
      footprint: frame.footprint && {
        cellCount: frame.footprint.cell_count,
        areaKm2: frame.footprint.area_km2,
        peak: frame.footprint.peak,
        centroid: frame.footprint.centroid,
        boundingRegion: frame.footprint.bounding_region,
        cells: frame.footprint.cells,
      },
    }));
  return {
    anomalyType: raw.anomaly_type,
    unit: raw.unit,
    threshold: raw.prototype_threshold,
    baseline: raw.baseline,
    derivation: raw.derivation,
    frames: { nwp: convert('nwp'), ai: convert('ai'), reference: convert('reference') },
    provenance: toProvenance(raw.provenance, 'derived', 'Derived from simulated fields; prototype threshold.'),
  };
}

function toTrajectory(raw: RawTrajectory): TrajectoryData {
  const convert = (key: DatasetKey): TrajectoryPoint[] =>
    raw.sources[key].map((p) => ({
      timestamp: p.timestamp,
      leadTimeHours: p.lead_hours,
      latitude: p.latitude,
      longitude: p.longitude,
      intensity: p.intensity,
      footprintAreaKm2: p.footprint_area_km2,
    }));
  return {
    representation: raw.representation,
    basis: raw.basis,
    note: raw.note,
    unit: raw.unit,
    points: { nwp: convert('nwp'), ai: convert('ai'), reference: convert('reference') },
    provenance: toProvenance(raw.provenance, 'derived', 'Derived from simulated fields.'),
  };
}

function toMetrics(raw: RawMetrics): ValidationMetric[] {
  return raw.metrics.map((m) => ({
    name: m.metric,
    value: null,
    unit: m.unit,
    baseline: m.nwp_value,
    aiOutput: m.ai_value,
    reference: m.reference_value,
    status: m.status === 'not_computed' ? 'pending' : 'simulated',
    scope: m.scope,
    note: m.note,
  }));
}

function buildCase01(): RetrospectiveCase {
  const nwp = nwpData as unknown as RawGridDataset;
  const ai = aiForecastData as unknown as RawGridDataset;
  const reference = referenceData as unknown as RawGridDataset;
  const unit = nwpData.provenance.unit;

  const anomaly = toAnomaly(anomalyData as unknown as RawAnomaly);
  const referencePeakFrame = anomaly.frames.reference.reduce((best, f, i, all) => (f.peak > all[best].peak ? i : best), 0);
  const aiFootprint = anomaly.frames.ai[referencePeakFrame];
  const referenceFootprint = anomaly.frames.reference[referencePeakFrame];

  const info = {
    caseId: metadataData.case_id,
    eventType: metadataData.event_type as EventType,
    eventName: metadataData.event_name,
    region: metadataData.region,
    country: metadataData.country,
    dateRange: {
      start: metadataData.start_time,
      end: metadataData.end_time,
      label: 'Synthetic timestamps (T0 → T+24h, 6-hourly) — not a real date',
    },
    description: metadataData.description,
    prototypeStatus: metadataData.prototype_status,
    provenance: toProvenance(
      { source_type: metadataData.source_type, data_status: metadataData.data_status, source_name: metadataData.source_name },
      'mock',
      metadataData.disclaimer,
    ),
  };

  const detection: EventDetection = {
    eventType: info.eventType,
    severity: 'extreme (prototype threshold)',
    confidence: aiForecastData.confidence.value,
    affectedRegion: referenceFootprint.footprint?.boundingRegion ?? aiFootprint.footprint?.boundingRegion ?? nwpData.grid.bounds,
    provenance: toProvenance(anomalyData.provenance, 'derived', 'Footprint bounding region of the simulated reference event at its peak frame.'),
  };

  return {
    info,
    nwp: {
      source: nwpData.provenance.source,
      variable: nwpData.provenance.variable,
      unit,
      frames: gridFrames(nwp, unit),
      provenance: toProvenance(nwpData.provenance, 'mock', nwpData.disclaimer),
    },
    ai: {
      model: aiForecastData.model,
      modelStatus: aiForecastData.model_status,
      variable: aiForecastData.provenance.variable,
      unit,
      confidence: aiForecastData.confidence.value,
      frames: gridFrames(ai, unit),
      provenance: toProvenance(aiForecastData.provenance, 'mock', aiForecastData.disclaimer),
    },
    reference: {
      source: referenceData.provenance.source,
      variable: referenceData.provenance.variable,
      unit,
      frames: gridFrames(reference, unit),
      provenance: toProvenance(referenceData.provenance, 'mock', referenceData.disclaimer),
    },
    anomaly,
    trajectory: toTrajectory(trajectoryData as unknown as RawTrajectory),
    validation: toMetrics(metricsData as unknown as RawMetrics),
    detection,
  };
}

// ============================================================================
// Simplified cases (single frame, compact spec expanded here)
// ============================================================================

interface FieldSpec {
  unit: string;
  variable: string;
  resolutionKm: number;
  gridSize: number;
  baseline: number;
  peak: number;
  centerFrac: [number, number];
  spreadFrac: number;
}

interface SimplifiedCase {
  label: string;
  regionSource: string;
  eventType: EventType;
  eventName: string;
  country: string;
  dateLabel: string;
  description: string;
  nwp: FieldSpec & { source: string; leadTimeHours: number };
  ai: FieldSpec & { model: string; confidence: number };
  reference: FieldSpec & { source: string };
  detection: { severity: string; confidence: number; affectedFrac: GeoBounds };
}

interface ReplayDomain {
  domain: { name: string; bounds: GeoBounds };
}

// JSON arrays are typed number[], so go through unknown for the [lat, lon] tuples.
const SIMPLIFIED_CASES = simplifiedCasesData as unknown as Record<string, SimplifiedCase>;
const REPLAY_DOMAINS = replayMapLayersData as Record<string, ReplayDomain>;

const SIMPLIFIED_PROVENANCE: Provenance = {
  kind: 'mock',
  isMock: true,
  dataStatus: 'simulated',
  sourceType: 'prototype',
  sourceName: 'Simplified placeholder (cases.json)',
  note: 'Prototype simulation — illustrative values, not a real observation or model run.',
};

// Expands a compact field description into explicit lat/lon/value points
// (a smooth peak over a baseline). Deterministic — no randomness.
function expandField(spec: FieldSpec, bounds: GeoBounds): SpatialField {
  const { gridSize, baseline, peak, centerFrac, spreadFrac } = spec;
  const latSpan = bounds.north - bounds.south;
  const lonSpan = bounds.east - bounds.west;
  const points: GridPoint[] = [];
  for (let row = 0; row < gridSize; row += 1) {
    const latFrac = 1 - (row + 0.5) / gridSize; // row 0 = northernmost
    for (let col = 0; col < gridSize; col += 1) {
      const lonFrac = (col + 0.5) / gridSize;
      const dist2 = (latFrac - centerFrac[0]) ** 2 + (lonFrac - centerFrac[1]) ** 2;
      const value = baseline + (peak - baseline) * Math.exp(-dist2 / (2 * spreadFrac ** 2));
      points.push({
        latitude: Number((bounds.south + latFrac * latSpan).toFixed(4)),
        longitude: Number((bounds.west + lonFrac * lonSpan).toFixed(4)),
        value: Number(value.toFixed(1)),
      });
    }
  }
  return { unit: spec.unit, resolutionKm: spec.resolutionKm, bounds, points };
}

function fractionToBounds(frac: GeoBounds, bounds: GeoBounds): GeoBounds {
  const latSpan = bounds.north - bounds.south;
  const lonSpan = bounds.east - bounds.west;
  return {
    north: bounds.south + frac.north * latSpan,
    south: bounds.south + frac.south * latSpan,
    east: bounds.west + frac.east * lonSpan,
    west: bounds.west + frac.west * lonSpan,
  };
}

function peakOf(field: SpatialField): number {
  return Math.max(...field.points.map((p) => p.value));
}

function simplifiedValidation(nwp: SpatialField, ai: SpatialField, reference: SpatialField): ValidationMetric[] {
  const pendingNote = 'Not computed — no real experiment has been run yet.';
  const pending = (name: string, unit: string): ValidationMetric => ({
    name,
    value: null,
    unit,
    baseline: null,
    aiOutput: null,
    reference: null,
    status: 'pending',
    scope: 'n/a',
    note: pendingNote,
  });
  return [
    {
      name: 'Field peak value',
      value: null,
      unit: nwp.unit,
      baseline: peakOf(nwp),
      aiOutput: peakOf(ai),
      reference: peakOf(reference),
      status: 'simulated',
      scope: 'single illustrative frame',
      note: 'Descriptive maximum of each simulated field. Illustrative comparison only; not a measure of accuracy.',
    },
    pending('Mean absolute error', nwp.unit),
    pending('Spatial overlap', '%'),
    pending('Timing error', 'h'),
  ];
}

function buildSimplifiedCase(caseId: string, simplified: SimplifiedCase): RetrospectiveCase {
  const replay = REPLAY_DOMAINS[simplified.regionSource];
  if (!replay) throw new Error(`Unknown region source for case: ${caseId}`);
  const bounds = replay.domain.bounds;

  const nwpField = expandField(simplified.nwp, bounds);
  const aiField = expandField(simplified.ai, bounds);
  const referenceField = expandField(simplified.reference, bounds);
  const frame = (field: SpatialField, leadTimeHours: number): TimeStepField[] => [{ timestamp: null, leadTimeHours, field }];

  return {
    info: {
      caseId,
      eventType: simplified.eventType,
      eventName: simplified.eventName,
      region: replay.domain.name,
      country: simplified.country,
      dateRange: { start: null, end: null, label: simplified.dateLabel },
      description: simplified.description,
      prototypeStatus: 'prototype_simplified',
      provenance: SIMPLIFIED_PROVENANCE,
    },
    nwp: {
      source: simplified.nwp.source,
      variable: simplified.nwp.variable,
      unit: simplified.nwp.unit,
      frames: frame(nwpField, simplified.nwp.leadTimeHours),
      provenance: SIMPLIFIED_PROVENANCE,
    },
    ai: {
      model: simplified.ai.model,
      modelStatus: 'simulated',
      variable: simplified.ai.variable,
      unit: simplified.ai.unit,
      confidence: simplified.ai.confidence,
      frames: frame(aiField, 0),
      provenance: SIMPLIFIED_PROVENANCE,
    },
    reference: {
      source: simplified.reference.source,
      variable: simplified.reference.variable,
      unit: simplified.reference.unit,
      frames: frame(referenceField, 0),
      provenance: SIMPLIFIED_PROVENANCE,
    },
    anomaly: null,
    trajectory: null,
    validation: simplifiedValidation(nwpField, aiField, referenceField),
    detection: {
      eventType: simplified.eventType,
      severity: simplified.detection.severity,
      confidence: simplified.detection.confidence,
      affectedRegion: fractionToBounds(simplified.detection.affectedFrac, bounds),
      provenance: SIMPLIFIED_PROVENANCE,
    },
  };
}

// ============================================================================
// Public adapter API
// ============================================================================

export async function getRetrospectiveCases(): Promise<RetrospectiveCaseOption[]> {
  const rich: RetrospectiveCaseOption = {
    caseId: CASE_01_ID,
    label: metadataData.selector_label,
    eventType: metadataData.event_type as EventType,
    isMock: true,
  };
  const simplified = Object.entries(SIMPLIFIED_CASES).map(([caseId, c]) => ({
    caseId,
    label: c.label,
    eventType: c.eventType,
    isMock: true,
  }));
  return [rich, ...simplified];
}

export async function getRetrospectiveCase(caseId: string): Promise<RetrospectiveCase> {
  if (caseId === CASE_01_ID) return buildCase01();
  const simplified = SIMPLIFIED_CASES[caseId];
  if (!simplified) throw new Error(`Unknown retrospective case id: ${caseId}`);
  return buildSimplifiedCase(caseId, simplified);
}
