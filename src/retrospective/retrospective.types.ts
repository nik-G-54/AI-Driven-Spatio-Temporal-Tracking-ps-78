// Retrospective AI Validation — data contract.
//
// This is the shape the Retrospective page consumes. It is a PROTOTYPE
// interface: it describes what real NWP, ML-model and reference data will
// eventually look like, and is NOT evidence that any model currently produces
// these values. Everything served today is mock (see `provenance`).
//
// Any data source (mock JSON now, a real backend / ML pipeline later) must be
// converted into `RetrospectiveCase` inside `retrospective.api.ts`. UI code
// depends only on the types in this file.

export type DataKind = 'mock' | 'real' | 'derived' | 'model-output' | 'reference';

export interface Provenance {
  kind: DataKind;
  // true while the values are illustrative and not produced by a real pipeline.
  isMock: boolean;
  note: string;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
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

export type EventType = 'extreme_rainfall' | 'heatwave' | 'cyclone';

export interface CaseInfo {
  caseId: string;
  eventType: EventType;
  eventName: string;
  region: string;
  country: string;
  // ISO 8601 when real; null for illustrative cases with no real date.
  dateRange: { start: string | null; end: string | null; label: string };
  description: string;
  provenance: Provenance;
}

export interface NwpInput {
  source: string;
  variable: string;
  unit: string;
  // ISO 8601 valid time, or null when illustrative.
  timestamp: string | null;
  leadTimeHours: number;
  field: SpatialField;
  provenance: Provenance;
}

export interface AiOutput {
  model: string;
  variable: string;
  unit: string;
  timestamp: string | null;
  // 0..1, or null when the model does not report one.
  confidence: number | null;
  field: SpatialField;
  provenance: Provenance;
}

export interface ReferenceData {
  source: string;
  variable: string;
  unit: string;
  timestamp: string | null;
  field: SpatialField;
  provenance: Provenance;
}

// 'pending'   — not computed; values are null.
// 'simulated' — derived from mock data; illustrative only.
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
