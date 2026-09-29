// Weather-analysis contract: the one shape the analysis workspace consumes for
// EVERY event type (extreme precipitation, heatwave, cyclone).
//
//   backend mock API (existing *.api.ts adapters)  ─┐
//   retrospective case 01 (existing adapter)        ├─→ analysis.adapter.ts ─→ WeatherAnalysis ─→ workspace
//   deterministic frontend simulation (fieldSynth)  ─┘
//
// The `provenance` of every dataset says what it is. AI output is ALWAYS a
// simulation here: no ML model exists. Nothing in this contract is an
// observation or a measured model result.

import type {
  AiOutput,
  AnomalyData,
  GeoBounds,
  GeoPoint,
  NwpInput,
  ReferenceData,
  TrajectoryData,
  ValidationMetric,
} from '../retrospective.types';

export type WeatherEventType = 'precipitation' | 'heatwave' | 'cyclone';
export type VariableId = 'precipitation' | 'temperature' | 'wind' | 'pressure';

export const EVENT_TYPE_LABEL: Record<WeatherEventType, string> = {
  precipitation: 'Extreme Precipitation',
  heatwave: 'Heatwave',
  cyclone: 'Cyclone',
};

export const VARIABLE_LABEL: Record<VariableId, string> = {
  precipitation: 'Precipitation',
  temperature: 'Temperature',
  wind: 'Wind',
  pressure: 'Pressure',
};

// One entry in the scenario selector.
export interface WeatherScenarioOption {
  scenarioId: string;
  eventType: WeatherEventType;
  label: string;
  // Where the data comes from.
  source: 'backend-mock-api' | 'retrospective-prototype';
}

// One backend field and what the UI does with it (shown in the mapping panel).
export interface BackendFieldUse {
  // e.g. "event.intensity.peakRainfall" (backend field path)
  field: string;
  value: string;
  // e.g. "AI peak amplitude of the precipitation field"
  usedFor: string;
  // 'backend' = value read from the backend mock; 'derived' = computed from backend values;
  // 'prototype' = a prototype constant chosen here (clearly not backend data).
  origin: 'backend' | 'derived' | 'prototype';
}

export interface EventSummary {
  scenarioId: string;
  backendId: string | null;
  type: WeatherEventType;
  name: string;
  classification: string;
  severity: string;
  status: string;
  region: string;
  centroid: GeoPoint;
  boundingBox: GeoBounds;
  detectedAt: string | null;
  forecastStart: string | null;
  forecastEnd: string | null;
  // 0..1 prototype confidence, or null.
  confidence: number | null;
  modelLabel: string;
  source: WeatherScenarioOption['source'];
  // Short plain-language provenance line for the header.
  provenanceNote: string;
}

export interface VariableMeta {
  id: VariableId;
  label: string;
  unit: string;
  // What the field values mean, e.g. "Pressure deficit below 1010 hPa".
  description: string;
  // Prototype threshold for "extreme" (never an official threshold).
  thresholdLabel: string;
}

// Per-time-step summary numbers used by the evolution charts and the AI panel.
export interface EvolutionPoint {
  leadTimeHours: number;
  nwpPeak: number;
  aiPeak: number;
  nwpFootprintAreaKm2: number;
  aiFootprintAreaKm2: number;
  // Area where the field is at least half of its own peak-over-baseline (how concentrated it is).
  nwpHalfMaxAreaKm2: number;
  aiHalfMaxAreaKm2: number;
  // 0..1 prototype confidence at this step.
  confidence: number | null;
}

export interface VariableAnalysis {
  meta: VariableMeta;
  nwp: NwpInput;
  ai: AiOutput;
  // null unless the source really has a separate reference (case 01 only, itself simulated).
  reference: ReferenceData | null;
  anomaly: AnomalyData;
  trajectory: TrajectoryData | null;
  validation: ValidationMetric[] | null;
  evolution: EvolutionPoint[];
  // Value extremes for scales (over all steps and datasets).
  range: { min: number; max: number };
  threshold: number;
  // Baseline (background) value of the field.
  baseline: number;
}

// Backend polygon/point overlays (uncertainty cone, affected region).
export interface RegionOverlay {
  kind: 'cone' | 'affected';
  label: string;
  // [lon, lat] ring, first point not repeated.
  ring: Array<[number, number]>;
}

export interface AnalysisStep {
  leadTimeHours: number;
  timestamp: string | null;
}

export interface WeatherAnalysis {
  event: EventSummary;
  steps: AnalysisStep[];
  variables: VariableAnalysis[];
  defaultVariable: VariableId;
  regions: RegionOverlay[];
  // Backend field → UI use, for the transparency panel and the report.
  backendFields: BackendFieldUse[];
  // Extra event facts from the backend for the summary (label → value).
  facts: Array<{ label: string; value: string }>;
  // Radar/satellite context is derived from this variable's AI field (null: no context available).
  contextVariable: VariableId | null;
}
