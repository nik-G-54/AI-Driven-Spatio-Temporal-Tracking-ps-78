import type { GeoBounds, SpatialField } from './retrospective.types';
export { classNames } from '../shared/ui/classNames';

export interface ValueScale {
  min: number;
  max: number;
}

// Shared scale across several fields so their cells are visually comparable.
export function sharedScale(fields: SpatialField[]): ValueScale {
  const values = fields.flatMap((f) => f.points.map((p) => p.value));
  return { min: Math.min(...values), max: Math.max(...values) };
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
