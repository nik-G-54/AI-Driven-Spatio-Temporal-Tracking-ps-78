// SIMULATED radar and satellite context, derived from the simulated AI fields.
//
// These are NOT observations: no IMD radar, INSAT image or any real feed is used.
// The radar echoes come from the precipitation field converted to reflectivity with a
// Marshall–Palmer Z–R relation plus deterministic texture; the satellite view is a
// brightness-temperature-style raster built from the same field. Both exist only to
// show where such context would sit in the workflow.

import type { ColorScale } from '../map/colorScales';
import { BRIGHTNESS_TEMPERATURE_SCALE, HOT_SURFACE_BT_SCALE, RADAR_SCALE } from '../map/colorScales';
import { sampleBilinear, toFieldGrid, type FieldGrid } from '../map/fieldGrid';
import type { ValueAt } from '../map/useFieldData';
import type { VariableAnalysis, WeatherAnalysis } from './analysis.types';

const DEG = Math.PI / 180;
const RADAR_RANGE_KM = 220;

export interface ContextLayer {
  id: 'satellite' | 'radar';
  // Full labelled name, always contains SIMULATED.
  label: string;
  unit: string;
  scale: ColorScale;
  note: string;
  available: boolean;
  unavailableReason?: string;
  // Sampler for a time step.
  valueAt: (stepIndex: number) => ValueAt;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

// Separable box blur on a FieldGrid (radius in cells, edges clamped).
function blur(grid: FieldGrid, radius: number): FieldGrid {
  const { nLat, nLon, values } = grid;
  const tmp = new Float32Array(values.length);
  const out = new Float32Array(values.length);
  for (let i = 0; i < nLat; i += 1) {
    for (let j = 0; j < nLon; j += 1) {
      let s = 0;
      for (let k = -radius; k <= radius; k += 1) s += values[i * nLon + clamp(j + k, 0, nLon - 1)];
      tmp[i * nLon + j] = s / (2 * radius + 1);
    }
  }
  for (let i = 0; i < nLat; i += 1) {
    for (let j = 0; j < nLon; j += 1) {
      let s = 0;
      for (let k = -radius; k <= radius; k += 1) s += tmp[clamp(i + k, 0, nLat - 1) * nLon + j];
      out[i * nLon + j] = s / (2 * radius + 1);
    }
  }
  return { ...grid, values: out };
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dx = (lon2 - lon1) * 111.32 * Math.cos(((lat1 + lat2) / 2) * DEG);
  const dy = (lat2 - lat1) * 111.32;
  return Math.hypot(dx, dy);
}

const findVariable = (analysis: WeatherAnalysis, id: string): VariableAnalysis | undefined => analysis.variables.find((v) => v.meta.id === id);

// Rain-rate divisor to mm/h from the field's unit.
const hoursPerUnit = (unit: string) => (unit === 'mm/6h' ? 6 : 24);

function radarLayer(analysis: WeatherAnalysis): ContextLayer {
  const precip = findVariable(analysis, 'precipitation');
  const base: Omit<ContextLayer, 'available' | 'valueAt'> = {
    id: 'radar',
    label: 'Radar Context — SIMULATED',
    unit: 'dBZ',
    scale: RADAR_SCALE,
    note: 'Simulated radar-style reflectivity derived from the AI precipitation field (Marshall–Palmer Z = 200·R^1.6) with deterministic texture, limited to a 220 km range circle. Not a real radar feed and not from IMD.',
  };
  if (!precip) {
    return { ...base, available: false, unavailableReason: 'This event has no precipitation field, so a simulated radar view would show clear air.', valueAt: () => () => null };
  }
  const grids = precip.ai.frames.map((f) => toFieldGrid(f.field));
  const denom = hoursPerUnit(precip.meta.unit);
  const path = precip.trajectory?.points.ai;
  return {
    ...base,
    available: true,
    valueAt: (step) => {
      const idx = Math.min(step, grids.length - 1);
      const grid = grids[idx];
      const centre = path?.[idx];
      const cLat = centre?.latitude ?? grid.north - (grid.nLat * grid.spacing) / 2;
      const cLon = centre?.longitude ?? grid.west + (grid.nLon * grid.spacing) / 2;
      return (lat, lon) => {
        if (distanceKm(cLat, cLon, lat, lon) > RADAR_RANGE_KM) return null;
        const v = sampleBilinear(grid, lat, lon);
        if (v === null) return null;
        const texture = 1 + 0.35 * Math.sin(2.7 * lat + 1.3 * lon + idx) * Math.cos(3.1 * lon - 1.7 * lat) + 0.15 * Math.sin(9 * lat) * Math.sin(9 * lon);
        const rate = (Math.max(0, v - precip.baseline) / denom) * texture;
        if (rate < 0.2) return null;
        const dbz = 10 * Math.log10(200 * rate ** 1.6);
        return dbz < 10 ? null : dbz;
      };
    },
  };
}

function satelliteLayer(analysis: WeatherAnalysis): ContextLayer {
  const variable = findVariable(analysis, analysis.contextVariable ?? '') ?? analysis.variables[0];
  const isHeat = variable.meta.id === 'temperature';
  const grids = variable.ai.frames.map((f) => toFieldGrid(f.field));
  const blurred = new Map<number, FieldGrid>();
  const range = Math.max(variable.range.max - variable.baseline, 1e-6);
  return {
    id: 'satellite',
    label: 'Satellite Context — SIMULATED',
    unit: 'K',
    scale: isHeat ? HOT_SURFACE_BT_SCALE : BRIGHTNESS_TEMPERATURE_SCALE,
    note: isHeat
      ? 'Simulated clear-sky infrared brightness temperature of the hot land surface, derived from the AI temperature field. Not a live INSAT image.'
      : 'Simulated infrared brightness temperature (cold cloud shield where the AI field is intense), derived from the AI precipitation field. Not a live INSAT image.',
    available: true,
    valueAt: (step) => {
      const idx = Math.min(step, grids.length - 1);
      const grid = grids[idx];
      if (isHeat) return (lat, lon) => {
        const v = sampleBilinear(grid, lat, lon);
        return v === null ? null : 288 + 1.15 * (v - variable.baseline);
      };
      let soft = blurred.get(idx);
      if (!soft) {
        soft = blur(grid, Math.max(2, Math.round(0.22 / grid.spacing)));
        blurred.set(idx, soft);
      }
      const cloud = soft;
      return (lat, lon) => {
        const v = sampleBilinear(grid, lat, lon);
        const b = sampleBilinear(cloud, lat, lon);
        if (v === null || b === null) return null;
        const x = clamp((v - variable.baseline) / range, 0, 1);
        const shield = clamp((b - variable.baseline) / range, 0, 1);
        return Math.max(195, 300 - 70 * shield - 30 * x);
      };
    },
  };
}

export function createContextLayers(analysis: WeatherAnalysis): { satellite: ContextLayer; radar: ContextLayer } {
  return { satellite: satelliteLayer(analysis), radar: radarLayer(analysis) };
}
