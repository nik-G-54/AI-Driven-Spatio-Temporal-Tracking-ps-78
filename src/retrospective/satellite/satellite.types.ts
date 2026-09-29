// Satellite observational context — data contract.
//
// Satellite data is CONTEXT for the NWP → AI → Reference workflow, never a
// replacement for it and never (in this contract) a claim of validation. The
// contract makes three things impossible to blur:
//   - what the data IS:        dataStatus 'simulated' | 'real'
//   - whether it exists:       availability 'simulated' | 'real' | 'unavailable'
//   - when it is from:         validTime + temporal alignment to the analytic step
//
// A mock source (today) and a real source (later, via a backend) must both be
// converted into `SatelliteContext` inside `satellite.api.ts`; UI code depends
// only on these types and does not know which one it is looking at.

import type { CaseKind, DatasetKey, GeoBounds, SpatialField } from '../retrospective.types';

// CaseKind (defined with the case contract) decides whether real satellite context may exist:
// synthetic prototype cases must never show real imagery.
export type { CaseKind };

export type SatelliteDataStatus = 'simulated' | 'real';

export interface SatelliteProvenance {
  dataStatus: SatelliteDataStatus;
  // 'prototype_simulation' today; e.g. 'mosdac' for real data.
  sourceType: string;
  // Human-readable, e.g. "Prototype satellite observation (simulated)".
  sourceName: string;
  // Source dataset identifier when real (e.g. a MOSDAC datasetId such as "3RIMG_L1C_SGP"); null otherwise.
  datasetId: string | null;
  // When the data was retrieved from the source (ISO 8601); null for simulated data.
  retrievedAt: string | null;
  // Licence / terms note for real data; disclaimer for simulated data.
  note: string;
}

// The observation's pixels. A regular lat/lon grid is preferred (it can be
// clipped to the case domain without distortion). A pre-rendered image is
// supported for later, with the exact bounds it covers.
export type SatelliteRaster =
  | { kind: 'grid'; field: SpatialField }
  | { kind: 'image'; url: string; bounds: GeoBounds; projection: string };

export interface SatelliteObservation {
  observationId: string;
  satellite: string;
  sensor: string;
  // Human-readable product name, e.g. "IR brightness temperature".
  product: string;
  // Source product code when real (e.g. "3SIMG_L2B_HEM"); null for simulated data.
  productCode: string | null;
  variable: string;
  unit: string;
  // The time the observation is valid for (ISO 8601). Null only when unknown.
  validTime: string | null;
  // Geographic extent covered by the raster.
  bbox: GeoBounds;
  spatialResolutionKm: number | null;
  raster: SatelliteRaster;
  // Share of the requested case domain that has valid pixels (0..1) and a note.
  coverage: { fraction: number; note: string };
  provenance: SatelliteProvenance;
}

// Whether satellite context can be shown for a case at all.
export interface SatelliteAvailability {
  // 'simulated'   — a clearly labelled simulated context exists (synthetic prototype cases).
  // 'real'        — real observations are available.
  // 'unavailable' — nothing to show; `reason` says why.
  status: 'simulated' | 'real' | 'unavailable';
  reason: string;
}

// MATCHED — an observation at exactly the analytic valid time.
// NEARBY  — nearest observation is within tolerance; shown as "nearest available observation" with its own time.
// MISSING — nothing within tolerance; NO satellite frame is shown for this step.
export type TemporalAlignment = 'matched' | 'nearby' | 'missing';

export interface SatelliteAlignment {
  stepIndex: number;
  leadTimeHours: number;
  // Valid times of the analytic datasets at this step (they normally coincide).
  analyticTimes: Record<DatasetKey, string | null>;
  status: TemporalAlignment;
  // The observation to display: set for matched / nearby, null for missing.
  observationId: string | null;
  // Nearest observation regardless of tolerance (for transparency), with its signed offset in minutes
  // (observation time − analytic time). Null when there are no observations or no analytic timestamp.
  nearestObservationTime: string | null;
  offsetMinutes: number | null;
}

export interface SatelliteContext {
  caseId: string;
  caseKind: CaseKind;
  availability: SatelliteAvailability;
  observations: SatelliteObservation[];
  // One entry per analytic time step.
  alignment: SatelliteAlignment[];
  // Maximum |offset| accepted as NEARBY. A design parameter, not a claim about the satellite.
  toleranceMinutes: number;
}
