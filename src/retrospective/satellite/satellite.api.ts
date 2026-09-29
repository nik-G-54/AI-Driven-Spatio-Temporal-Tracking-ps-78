// Data adapter for satellite observational context.
//
// UI code calls `getSatelliteContext` and receives a `SatelliteContext`; it does
// not know whether the source is the mock below or a real one. The replacement
// point for real data is this function: it should call OUR backend (which holds
// the MOSDAC credentials, queries the MOSDAC Data Download API by datasetId /
// time range / bounding box, converts HDF products to clipped grids or images,
// and returns the same contract). The frontend must never hold MOSDAC
// credentials or call MOSDAC directly.
//
// Today only a SIMULATED context exists (case 01). Real satellite imagery is
// deliberately NOT used with synthetic prototype cases.

import type { CaseKind, GeoBounds, GridPoint } from '../retrospective.types';
import type { SatelliteContext, SatelliteObservation } from './satellite.types';
import { alignObservations, type AnalyticStep } from './satellite.utils';

export type * from './satellite.types';
export type { AnalyticStep } from './satellite.utils';

// Nearest-observation tolerance for NEARBY. A design parameter.
const TOLERANCE_MINUTES = 30;

interface RawSatelliteFile {
  data_status: string;
  source_type: string;
  source_name: string;
  disclaimer: string;
  product: { name: string; variable: string; unit: string; sensor: string; satellite: string };
  coverage: { fraction: number; note: string };
  grid: { bounds: GeoBounds; resolution_km: number; latitudes: number[]; longitudes: number[] };
  observations: Array<{ observation_id: string; valid_time: string; brightness_temperature_k: number[][] }>;
}

// Mock files are loaded on demand so they stay out of the page chunk.
const MOCK_LOADERS: Record<string, () => Promise<RawSatelliteFile>> = {
  'case-01-extreme-precipitation': async () =>
    (await import('../../mockData/retrospective/case-01-extreme-precipitation/satellite.json')).default as unknown as RawSatelliteFile,
};

function fromMock(raw: RawSatelliteFile): SatelliteObservation[] {
  const { latitudes, longitudes, bounds } = raw.grid;
  return raw.observations.map((frame): SatelliteObservation => {
    const points: GridPoint[] = [];
    latitudes.forEach((latitude, row) => {
      longitudes.forEach((longitude, col) => {
        points.push({ latitude, longitude, value: frame.brightness_temperature_k[row][col] });
      });
    });
    return {
      observationId: frame.observation_id,
      satellite: raw.product.satellite,
      sensor: raw.product.sensor,
      product: raw.product.name,
      productCode: null,
      variable: raw.product.variable,
      unit: raw.product.unit,
      validTime: frame.valid_time,
      bbox: bounds,
      spatialResolutionKm: raw.grid.resolution_km,
      raster: { kind: 'grid', field: { unit: raw.product.unit, resolutionKm: raw.grid.resolution_km, bounds, points } },
      coverage: raw.coverage,
      provenance: {
        dataStatus: 'simulated',
        sourceType: raw.source_type,
        sourceName: raw.source_name,
        datasetId: null,
        retrievedAt: null,
        note: raw.disclaimer,
      },
    };
  });
}

export async function getSatelliteContext(input: { caseId: string; caseKind: CaseKind; steps: AnalyticStep[] }): Promise<SatelliteContext> {
  const { caseId, caseKind, steps } = input;
  const base = { caseId, caseKind, toleranceMinutes: TOLERANCE_MINUTES };

  if (caseKind !== 'synthetic_prototype') {
    // Real cases need the real-source path (backend + MOSDAC), which is not connected yet.
    return {
      ...base,
      availability: { status: 'unavailable', reason: 'Real satellite source is not connected yet (needs a backend service with MOSDAC access).' },
      observations: [],
      alignment: alignObservations(steps, [], TOLERANCE_MINUTES),
    };
  }

  const loadMock = MOCK_LOADERS[caseId];
  if (!loadMock) {
    return {
      ...base,
      availability: { status: 'unavailable', reason: 'No satellite context exists for this synthetic prototype case.' },
      observations: [],
      alignment: alignObservations(steps, [], TOLERANCE_MINUTES),
    };
  }

  const observations = fromMock(await loadMock());
  return {
    ...base,
    availability: {
      status: 'simulated',
      reason: 'Synthetic prototype case: real satellite imagery is deliberately not used. This is a simulated context for interface demonstration only.',
    },
    observations,
    alignment: alignObservations(steps, observations, TOLERANCE_MINUTES),
  };
}
