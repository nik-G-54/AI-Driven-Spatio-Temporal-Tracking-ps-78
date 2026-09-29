import type { SpatialField } from '../retrospective.types';

// A regular lat/lon grid in array form, rebuilt from the contract's
// `{latitude, longitude, value}` points. Cell centres sit on the grid points;
// each cell covers ±spacing/2 around its centre.
export interface FieldGrid {
  north: number; // latitude of the northernmost cell centre
  west: number; // longitude of the westernmost cell centre
  spacing: number; // degrees
  nLat: number;
  nLon: number;
  values: Float32Array; // row-major, rows north → south
}

export function toFieldGrid(field: SpatialField): FieldGrid {
  const lats = [...new Set(field.points.map((p) => p.latitude))].sort((a, b) => b - a);
  const lons = [...new Set(field.points.map((p) => p.longitude))].sort((a, b) => a - b);
  const steps = [
    ...lats.slice(1).map((v, i) => lats[i] - v),
    ...lons.slice(1).map((v, i) => v - lons[i]),
  ];
  const spacing = Math.min(...steps);
  const north = lats[0];
  const west = lons[0];
  const nLat = Math.round((north - lats[lats.length - 1]) / spacing) + 1;
  const nLon = Math.round((lons[lons.length - 1] - west) / spacing) + 1;
  const values = new Float32Array(nLat * nLon).fill(NaN);
  for (const p of field.points) {
    const i = Math.round((north - p.latitude) / spacing);
    const j = Math.round((p.longitude - west) / spacing);
    values[i * nLon + j] = p.value;
  }
  return { north, west, spacing, nLat, nLon, values };
}

export interface Extent {
  west: number;
  east: number;
  south: number;
  north: number;
}

// Geographic footprint of the cells (including the half-cell overhang).
export function gridExtent(grid: FieldGrid): Extent {
  const half = grid.spacing / 2;
  return {
    north: grid.north + half,
    south: grid.north - (grid.nLat - 1) * grid.spacing - half,
    west: grid.west - half,
    east: grid.west + (grid.nLon - 1) * grid.spacing + half,
  };
}

export function unionExtent(extents: Extent[]): Extent {
  return {
    north: Math.max(...extents.map((e) => e.north)),
    south: Math.min(...extents.map((e) => e.south)),
    west: Math.min(...extents.map((e) => e.west)),
    east: Math.max(...extents.map((e) => e.east)),
  };
}

// Value of the cell containing (lat, lon), or null outside the grid. Keeps the
// native cell structure visible (NWP cells are visibly coarser than AI cells).
export function sampleNearest(grid: FieldGrid, lat: number, lon: number): number | null {
  const i = Math.round((grid.north - lat) / grid.spacing);
  const j = Math.round((lon - grid.west) / grid.spacing);
  if (i < 0 || j < 0 || i >= grid.nLat || j >= grid.nLon) return null;
  const value = grid.values[i * grid.nLon + j];
  return Number.isNaN(value) ? null : value;
}

// Bilinear interpolation between cell centres, used for difference fields so two
// grids of different resolution can be compared at the same location.
export function sampleBilinear(grid: FieldGrid, lat: number, lon: number): number | null {
  const fi = (grid.north - lat) / grid.spacing;
  const fj = (lon - grid.west) / grid.spacing;
  if (fi < -0.5 || fj < -0.5 || fi > grid.nLat - 0.5 || fj > grid.nLon - 0.5) return null;
  const ci = Math.min(grid.nLat - 1, Math.max(0, fi));
  const cj = Math.min(grid.nLon - 1, Math.max(0, fj));
  const i0 = Math.floor(ci);
  const j0 = Math.floor(cj);
  const i1 = Math.min(grid.nLat - 1, i0 + 1);
  const j1 = Math.min(grid.nLon - 1, j0 + 1);
  const ti = ci - i0;
  const tj = cj - j0;
  const v = (i: number, j: number) => grid.values[i * grid.nLon + j];
  const value = v(i0, j0) * (1 - ti) * (1 - tj) + v(i0, j1) * (1 - ti) * tj + v(i1, j0) * ti * (1 - tj) + v(i1, j1) * ti * tj;
  return Number.isNaN(value) ? null : value;
}
