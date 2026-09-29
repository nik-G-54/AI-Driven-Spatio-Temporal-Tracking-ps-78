// Data adapter for the Retrospective AI Validation page.
//
// Components must go through these functions instead of importing JSON or
// fetching data directly. Today the source is mock JSON (plus region geometry
// reused from the Historical Replay domains); later it becomes a real backend
// / ML pipeline. The function signatures and the `RetrospectiveCase` contract
// in `retrospective.types.ts` are the replacement point — UI code must not
// change.

import casesData from '../mockData/retrospective/cases.json';
import replayMapLayersData from '../mockData/historicalReplay/mapLayers.json';
import type {
  EventType,
  GeoBounds,
  GridPoint,
  Provenance,
  RetrospectiveCase,
  RetrospectiveCaseOption,
  SpatialField,
  ValidationMetric,
} from './retrospective.types';

export type * from './retrospective.types';

// ---- Mock source shapes (private to this adapter) --------------------------

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

interface MockCase {
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
  detection: {
    severity: string;
    confidence: number;
    affectedFrac: GeoBounds;
  };
}

interface ReplayDomain {
  domain: { name: string; bounds: GeoBounds };
}

// JSON arrays are typed number[], so go through unknown for the [lat, lon] tuples.
const MOCK_CASES = casesData as unknown as Record<string, MockCase>;
const REPLAY_DOMAINS = replayMapLayersData as Record<string, ReplayDomain>;

const MOCK_PROVENANCE: Provenance = {
  kind: 'mock',
  isMock: true,
  note: 'Prototype simulation — illustrative values, not a real observation or model run.',
};

// ---- Mock → contract transformation ----------------------------------------

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

function buildValidation(nwp: SpatialField, ai: SpatialField, reference: SpatialField): ValidationMetric[] {
  const pendingNote = 'Not computed — no real experiment has been run yet.';
  return [
    {
      name: 'Field peak value',
      value: null,
      unit: nwp.unit,
      baseline: peakOf(nwp),
      aiOutput: peakOf(ai),
      reference: peakOf(reference),
      status: 'simulated',
      note: 'Descriptive maximum of each simulated field. Illustrative comparison only; not a measure of accuracy.',
    },
    { name: 'Mean absolute error', value: null, unit: nwp.unit, baseline: null, aiOutput: null, reference: null, status: 'pending', note: pendingNote },
    { name: 'Spatial overlap', value: null, unit: '%', baseline: null, aiOutput: null, reference: null, status: 'pending', note: pendingNote },
    { name: 'Timing error', value: null, unit: 'h', baseline: null, aiOutput: null, reference: null, status: 'pending', note: pendingNote },
  ];
}

function toContract(caseId: string, mock: MockCase): RetrospectiveCase {
  const replay = REPLAY_DOMAINS[mock.regionSource];
  if (!replay) throw new Error(`Unknown region source for case: ${caseId}`);
  const bounds = replay.domain.bounds;

  const nwpField = expandField(mock.nwp, bounds);
  const aiField = expandField(mock.ai, bounds);
  const referenceField = expandField(mock.reference, bounds);

  return {
    info: {
      caseId,
      eventType: mock.eventType,
      eventName: mock.eventName,
      region: replay.domain.name,
      country: mock.country,
      dateRange: { start: null, end: null, label: mock.dateLabel },
      description: mock.description,
      provenance: MOCK_PROVENANCE,
    },
    nwp: {
      source: mock.nwp.source,
      variable: mock.nwp.variable,
      unit: mock.nwp.unit,
      timestamp: null,
      leadTimeHours: mock.nwp.leadTimeHours,
      field: nwpField,
      provenance: MOCK_PROVENANCE,
    },
    ai: {
      model: mock.ai.model,
      variable: mock.ai.variable,
      unit: mock.ai.unit,
      timestamp: null,
      confidence: mock.ai.confidence,
      field: aiField,
      provenance: MOCK_PROVENANCE,
    },
    reference: {
      source: mock.reference.source,
      variable: mock.reference.variable,
      unit: mock.reference.unit,
      timestamp: null,
      field: referenceField,
      provenance: MOCK_PROVENANCE,
    },
    validation: buildValidation(nwpField, aiField, referenceField),
    detection: {
      eventType: mock.eventType,
      severity: mock.detection.severity,
      confidence: mock.detection.confidence,
      affectedRegion: fractionToBounds(mock.detection.affectedFrac, bounds),
      provenance: MOCK_PROVENANCE,
    },
  };
}

// ---- Public adapter API ----------------------------------------------------

export async function getRetrospectiveCases(): Promise<RetrospectiveCaseOption[]> {
  return Object.entries(MOCK_CASES).map(([caseId, mock]) => ({
    caseId,
    label: mock.label,
    eventType: mock.eventType,
    isMock: true,
  }));
}

export async function getRetrospectiveCase(caseId: string): Promise<RetrospectiveCase> {
  const mock = MOCK_CASES[caseId];
  if (!mock) throw new Error(`Unknown retrospective case id: ${caseId}`);
  return toContract(caseId, mock);
}
