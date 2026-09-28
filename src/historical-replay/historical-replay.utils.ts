import type { MapBounds } from './historical-replay.api';

export interface MapPoint {
  x: number;
  y: number;
}

/**
 * Deterministically projects a lat/lon pair onto the Historical Replay map's
 * SVG canvas. Not a scientific projection — a simple linear mapping across
 * the selected event's domain bounds, centralized here so it isn't
 * scattered across the track/hazard-envelope JSX.
 */
export function projectCoordinateToMap(
  latitude: number,
  longitude: number,
  bounds: MapBounds,
  svgWidth = 800,
  svgHeight = 450,
): MapPoint {
  const x = ((longitude - bounds.west) / (bounds.east - bounds.west)) * svgWidth;
  const y = ((bounds.north - latitude) / (bounds.north - bounds.south)) * svgHeight;
  return { x, y };
}

export function formatCoordinate(latitude: number, longitude: number): string {
  return `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
