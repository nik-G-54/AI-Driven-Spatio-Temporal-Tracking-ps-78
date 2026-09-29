import { useMemo } from 'react';
import type { Feature, MultiLineString } from 'geojson';
import type {
  AiOutput,
  AnomalyData,
  DatasetKey,
  EventFootprint,
  NwpInput,
  ReferenceData,
  TimeStepField,
  TrajectoryData,
} from '../retrospective.types';
import { footprintOutline, type PathPoint } from './footprintGeo';
import { gridExtent, sampleBilinear, sampleNearest, toFieldGrid, unionExtent, type Extent, type FieldGrid } from './fieldGrid';

export type ValueAt = (lat: number, lon: number) => number | null;

export interface FootprintLayer {
  footprint: EventFootprint;
  outline: Feature<MultiLineString>;
}

export interface FieldData {
  hasReference: boolean;
  // Full geographic extent of the gridded data (what the maps can show fields for).
  extent: Extent;
  // Default camera: the event region (all footprints, every step and dataset) with a
  // margin, clamped to `extent`. Falls back to `extent` when there is no footprint.
  focus: Extent;
  variable: string;
  unit: string;
  frameCount: number;
  frame: (key: DatasetKey, index: number) => TimeStepField;
  // Field values as drawn on the map (bilinear between cell centres).
  valueAt: (key: DatasetKey, index: number) => ValueAt;
  // a − b at the same location, each grid bilinearly interpolated.
  differenceAt: (a: DatasetKey, b: DatasetKey, index: number) => ValueAt;
  // Exceedance footprint of a dataset at a time step, or null when none.
  footprint: (key: DatasetKey, index: number) => FootprintLayer | null;
  // Field maximum at a time step.
  peak: (key: DatasetKey, index: number) => number;
  // Centroid path of the evolving footprint, marked relative to `index`.
  path: (key: DatasetKey, index: number) => PathPoint[] | null;
}

const KEYS: DatasetKey[] = ['nwp', 'ai', 'reference'];

// Margin around the event region, as a fraction of its size (and a minimum in degrees).
const FOCUS_MARGIN = 0.4;
const FOCUS_MIN_MARGIN_DEG = 0.15;

function focusExtent(extent: Extent, anomaly: AnomalyData | null): Extent {
  const regions = KEYS.flatMap((k) => anomaly?.frames[k] ?? []).flatMap((f) => (f.footprint ? [f.footprint.boundingRegion] : []));
  if (regions.length === 0) return extent;
  const north = Math.max(...regions.map((r) => r.north));
  const south = Math.min(...regions.map((r) => r.south));
  const east = Math.max(...regions.map((r) => r.east));
  const west = Math.min(...regions.map((r) => r.west));
  const padLat = Math.max(FOCUS_MIN_MARGIN_DEG, (north - south) * FOCUS_MARGIN);
  const padLon = Math.max(FOCUS_MIN_MARGIN_DEG, (east - west) * FOCUS_MARGIN);
  return {
    north: Math.min(extent.north, north + padLat),
    south: Math.max(extent.south, south - padLat),
    east: Math.min(extent.east, east + padLon),
    west: Math.max(extent.west, west - padLon),
  };
}

interface Input {
  nwp: NwpInput;
  ai: AiOutput;
  // null when the analysis has no separate reference (the slot then mirrors the AI field and is never shown).
  reference: ReferenceData | null;
  anomaly: AnomalyData | null;
  trajectory: TrajectoryData | null;
}

// Builds grids, samplers and footprint geometry once per case so the map
// components only pick a time step. Stable identities keep MapLibre from
// re-rasterizing when unrelated state changes.
export function useFieldData({ nwp, ai, reference, anomaly, trajectory }: Input): FieldData {
  return useMemo(() => {
    const frames: Record<DatasetKey, TimeStepField[]> = { nwp: nwp.frames, ai: ai.frames, reference: (reference ?? ai).frames };
    const clamp = (key: DatasetKey, index: number) => Math.min(index, frames[key].length - 1);

    const grids = Object.fromEntries(KEYS.map((k) => [k, frames[k].map((f) => toFieldGrid(f.field))])) as Record<DatasetKey, FieldGrid[]>;
    const gridAt = (key: DatasetKey, index: number) => grids[key][clamp(key, index)];
    const extent = unionExtent(KEYS.flatMap((k) => grids[k].map(gridExtent)));

    // Bilinear between cell centres (nearest at the grid rim, where bilinear has no neighbours).
    const smooth = Object.fromEntries(
      KEYS.map((k) => [k, grids[k].map((g): ValueAt => (lat, lon) => sampleBilinear(g, lat, lon) ?? sampleNearest(g, lat, lon))]),
    ) as Record<DatasetKey, ValueAt[]>;

    const peaks = Object.fromEntries(
      KEYS.map((k) => [k, frames[k].map((f) => Math.max(...f.field.points.map((p) => p.value)))]),
    ) as Record<DatasetKey, number[]>;

    const footprints = Object.fromEntries(
      KEYS.map((k) => [
        k,
        frames[k].map((_, i): FootprintLayer | null => {
          const footprint = anomaly?.frames[k][i]?.footprint ?? null;
          return footprint ? { footprint, outline: footprintOutline(footprint, grids[k][i].spacing) } : null;
        }),
      ]),
    ) as Record<DatasetKey, Array<FootprintLayer | null>>;

    const differenceCache = new Map<string, ValueAt>();

    const paths = Object.fromEntries(
      KEYS.map((k) => {
        const points = trajectory?.points[k];
        return [
          k,
          frames[k].map((_, current): PathPoint[] | null =>
            points
              ? points.map((p, i) => ({
                  latitude: p.latitude,
                  longitude: p.longitude,
                  state: i < current ? 'past' : i === current ? 'current' : 'future',
                }))
              : null,
          ),
        ];
      }),
    ) as Record<DatasetKey, Array<PathPoint[] | null>>;

    return {
      hasReference: reference !== null,
      extent,
      focus: focusExtent(extent, anomaly),
      variable: nwp.variable,
      unit: nwp.unit,
      frameCount: Math.max(...KEYS.map((k) => frames[k].length)),
      frame: (key, index) => frames[key][clamp(key, index)],
      valueAt: (key, index) => smooth[key][clamp(key, index)],
      differenceAt: (a, b, index) => {
        const id = `${a}-${b}-${index}`;
        let sampler = differenceCache.get(id);
        if (!sampler) {
          const ga = gridAt(a, index);
          const gb = gridAt(b, index);
          sampler = (lat, lon) => {
            const va = sampleBilinear(ga, lat, lon);
            const vb = sampleBilinear(gb, lat, lon);
            return va === null || vb === null ? null : va - vb;
          };
          differenceCache.set(id, sampler);
        }
        return sampler;
      },
      footprint: (key, index) => footprints[key][clamp(key, index)],
      peak: (key, index) => peaks[key][clamp(key, index)],
      path: (key, index) => paths[key][clamp(key, index)],
    };
  }, [nwp, ai, reference, anomaly, trajectory]);
}
