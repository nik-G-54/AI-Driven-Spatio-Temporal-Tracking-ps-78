import type { DatasetKey, GeoBounds, SpatialField, TimeStepField } from './retrospective.types';
export { classNames } from '../shared/ui/classNames';

export interface ValueScale {
  min: number;
  max: number;
}

// Shared scale across several datasets (all frames) so cells are visually comparable.
export function sharedScale(datasets: TimeStepField[][]): ValueScale {
  let min = Infinity;
  let max = -Infinity;
  for (const frames of datasets) {
    for (const { field } of frames) {
      for (const point of field.points) {
        if (point.value < min) min = point.value;
        if (point.value > max) max = point.value;
      }
    }
  }
  return { min, max };
}

// Index of the time step whose field maximum is highest.
export function peakFrameIndex(frames: TimeStepField[]): number {
  let best = 0;
  let bestPeak = -Infinity;
  frames.forEach((frame, index) => {
    const peak = Math.max(...frame.field.points.map((p) => p.value));
    if (peak > bestPeak) {
      bestPeak = peak;
      best = index;
    }
  });
  return best;
}

export function formatLead(leadTimeHours: number): string {
  return leadTimeHours === 0 ? 'T0' : `T+${leadTimeHours}h`;
}

export function formatTimestamp(timestamp: string | null): string {
  return timestamp === null ? 'Illustrative — no real date' : timestamp.replace('T', ' ').replace('Z', ' UTC');
}

export interface FieldSummary {
  count: number;
  min: number;
  max: number;
  mean: number;
}

export function summarizeField(field: SpatialField): FieldSummary {
  const values = field.points.map((p) => p.value);
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    mean: sum / values.length,
  };
}

// Groups points into rows (north → south) for the placeholder cell grid.
export function fieldToRows(field: SpatialField): SpatialField['points'][] {
  const rows = new Map<number, SpatialField['points']>();
  for (const point of field.points) {
    const row = rows.get(point.latitude) ?? [];
    row.push(point);
    rows.set(point.latitude, row);
  }
  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, points]) => [...points].sort((a, b) => a.longitude - b.longitude));
}

export function formatBounds(bounds: GeoBounds): string {
  return `${bounds.south.toFixed(2)}°N–${bounds.north.toFixed(2)}°N, ${bounds.west.toFixed(2)}°E–${bounds.east.toFixed(2)}°E`;
}

export function formatValue(value: number | null, unit: string): string {
  return value === null ? '—' : `${Number(value.toFixed(1))} ${unit}`;
}

export function formatConfidence(confidence: number | null): string {
  return confidence === null ? '—' : `${Math.round(confidence * 100)}% (simulated)`;
}

export function formatEventType(eventType: string): string {
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Role labels: scientifically unambiguous names for the three datasets.
export const DATASET_LABEL: Record<DatasetKey, string> = {
  nwp: 'Forecast (NWP)',
  ai: 'AI output',
  reference: 'Reference',
};

const VARIABLE_LABELS: Record<string, string> = { precipitation_mm: 'Precipitation' };
export const variableLabel = (variable: string) => VARIABLE_LABELS[variable] ?? variable;

// "mm/6h" → "mm / 6h"
export const formatUnit = (unit: string) => unit.replace('/', ' / ');

export type DiffPairId = 'ai-nwp' | 'ai-reference' | 'nwp-reference';

// Difference maps are always "first − second".
export const DIFF_PAIRS: Record<DiffPairId, { a: DatasetKey; b: DatasetKey; label: string }> = {
  'ai-nwp': { a: 'ai', b: 'nwp', label: 'AI refined − NWP' },
  'ai-reference': { a: 'ai', b: 'reference', label: 'AI refined − Reference' },
  'nwp-reference': { a: 'nwp', b: 'reference', label: 'NWP − Reference' },
};
