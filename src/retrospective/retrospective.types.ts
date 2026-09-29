// Retrospective AI Validation — data contract.
//
// This is the shape the Retrospective page consumes. It is a PROTOTYPE
// interface: it describes what real NWP, ML-model and reference data will
// eventually look like, and is NOT evidence that any model currently produces
// these values. Everything served today is simulated (see `provenance`).
//
// Any data source (mock JSON now, a real backend / ML pipeline later) must be
// converted into `RetrospectiveCase` inside `retrospective.api.ts`. UI code
// depends only on the types in this file.

export type DataKind = 'mock' | 'real' | 'derived' | 'model-output' | 'reference';
export type DataStatus = 'simulated' | 'real';

export interface Provenance {
  kind: DataKind;
  // true while the values are simulated and not produced by a real pipeline.
  isMock: boolean;
  dataStatus: DataStatus;
  // e.g. 'nwp_simulation', 'ai_simulation', 'reference_simulation', 'derived', 'prototype'.
  sourceType: string;
  sourceName: string;
  note: string;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GridPoint {
  latitude: number;
  longitude: number;
  value: number;
}

export interface SpatialField {
  unit: string;
  // null when the resolution is unknown / not applicable.
  resolutionKm: number | null;
  bounds: GeoBounds;
  points: GridPoint[];
}

// One valid time of a gridded field. A dataset is a list of these.
export interface TimeStepField {
  // ISO 8601 valid time, or null when illustrative.
  timestamp: string | null;
  leadTimeHours: number;
  field: SpatialField;
}

export type EventType = 'extreme_rainfall' | 'heatwave' | 'cyclone';

// What kind of case this is; decides e.g. whether real satellite context may exist.
//   synthetic_prototype — synthetic timestamps/domain/values (all current cases).
//   historical_real     — a real past event with real, aligned data.
//   realtime            — a current event.
export type CaseKind = 'synthetic_prototype' | 'historical_real' | 'realtime';

export interface CaseInfo {
  caseId: string;
  caseKind: CaseKind;
  eventType: EventType;
  eventName: string;
  region: string;
  country: string;
  // ISO 8601 when real; null for illustrative cases with no real date.
  dateRange: { start: string | null; end: string | null; label: string };
  description: string;
  // e.g. 'prototype_simulation' (rich dataset) or 'prototype_simplified'.
  prototypeStatus: string;
  provenance: Provenance;
}

export interface NwpInput {
  source: string;
  variable: string;
  unit: string;
  frames: TimeStepField[];
  provenance: Provenance;
}

export interface AiOutput {
  model: string;
  // 'simulated' until a real model produces the values.
  modelStatus: string;
  variable: string;
  unit: string;
  // 0..1, or null when the model does not report one.
  confidence: number | null;
  frames: TimeStepField[];
  provenance: Provenance;
}

export interface ReferenceData {
  source: string;
  variable: string;
  unit: string;
  frames: TimeStepField[];
  provenance: Provenance;
}

export type DatasetKey = 'nwp' | 'ai' | 'reference';

// ---- Anomaly / event footprint ---------------------------------------------

export interface FootprintCell extends GridPoint {
  // value minus the (prototype) baseline.
  anomaly: number;
}

export interface EventFootprint {
  cellCount: number;
  areaKm2: number;
  peak: number;
  centroid: GeoPoint;
  boundingRegion: GeoBounds;
  cells: FootprintCell[];
}

export interface AnomalyFrame {
  timestamp: string | null;
  leadTimeHours: number;
  peak: number;
  exceedsThreshold: boolean;
  // null when no cell reaches the threshold.
  footprint: EventFootprint | null;
}

export interface AnomalyData {
  anomalyType: string;
  unit: string;
  threshold: {
    value: number;
    unit: string;
    // 'prototype_threshold' — never an official agency threshold unless verified.
    status: string;
    note: string;
  };
  baseline: { value: number; unit: string; note: string };
  derivation: string;
  frames: Record<DatasetKey, AnomalyFrame[]>;
  provenance: Provenance;
}

// ---- Trajectory / evolution ------------------------------------------------

export interface TrajectoryPoint extends GeoPoint {
  timestamp: string | null;
  leadTimeHours: number;
  intensity: number;
  footprintAreaKm2: number;
}

export interface TrajectoryData {
  // e.g. 'evolving_footprint_centroid' (not a cyclone-like point track).
  representation: string;
  basis: string;
  note: string;
  unit: string;
  points: Record<DatasetKey, TrajectoryPoint[]>;
  provenance: Provenance;
}

// ---- Validation ------------------------------------------------------------

// 'pending'   — not computed; values are null.
// 'simulated' — calculated from simulated data; illustrative only.
// 'computed'  — computed from a real, documented experiment.
export type ValidationStatus = 'pending' | 'simulated' | 'computed';

export interface ValidationMetric {
  name: string;
  value: number | null;
  unit: string;
  baseline: number | null;
  aiOutput: number | null;
  reference: number | null;
  status: ValidationStatus;
  // What the metric was evaluated over (frame, grid, sign convention).
  scope: string;
  note: string;
}

export interface EventDetection {
  eventType: EventType;
  severity: string;
  // 0..1, or null when not available.
  confidence: number | null;
  affectedRegion: GeoBounds;
  provenance: Provenance;
}

export interface RetrospectiveCase {
  info: CaseInfo;
  nwp: NwpInput;
  ai: AiOutput;
  reference: ReferenceData;
  // null for simplified cases that have no derived footprint yet.
  anomaly: AnomalyData | null;
  trajectory: TrajectoryData | null;
  validation: ValidationMetric[];
  detection: EventDetection;
}

// Lightweight entry for the case selector.
export interface RetrospectiveCaseOption {
  caseId: string;
  label: string;
  eventType: EventType;
  isMock: boolean;
}
