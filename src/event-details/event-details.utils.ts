import type { MapBounds } from './event-details.api';

export type Variant = 'success' | 'danger' | 'dangerSolid' | 'info' | 'neutral' | 'neutralStrong' | 'primary';

export interface VariantStyle {
  bg: string;
  text: string;
  border: string;
}

const VARIANT_STYLES: Record<Variant, VariantStyle> = {
  success: { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', border: 'border-[#BBF7D0]' },
  danger: { bg: 'bg-red-100', text: 'text-[#93000A]', border: 'border-red-200' },
  dangerSolid: { bg: 'bg-[#BA1A1A]', text: 'text-white', border: 'border-[#BA1A1A]' },
  info: { bg: 'bg-[#D8E3FB]', text: 'text-[#111C2D]', border: 'border-[#BFDBFE]' },
  neutral: { bg: 'bg-[#D3E4FE]', text: 'text-[#45464D]', border: 'border-[#CBD5E1]' },
  neutralStrong: { bg: 'bg-[#D3E4FE]', text: 'text-[#0F172A]', border: 'border-[#CBD5E1]' },
  primary: { bg: 'bg-[#131B2E]', text: 'text-[#DAE2FD]', border: 'border-[#131B2E]' },
};

export function getVariantStyle(variant: string): VariantStyle {
  return VARIANT_STYLES[variant as Variant] ?? VARIANT_STYLES.neutral;
}

// Risk tiers for the AI-downscaled 5km grid cells.
export type CellTier = 'low' | 'moderate' | 'high' | 'severe' | 'extreme';

export const CELL_TIER_COLORS: Record<CellTier, string> = {
  low: '#0284C7',
  moderate: '#EAB308',
  high: '#EA580C',
  severe: '#EF4444',
  extreme: '#B91C1C',
};

export const CELL_TIER_OPACITY: Record<CellTier, number> = {
  low: 0.35,
  moderate: 0.75,
  high: 0.85,
  severe: 0.95,
  extreme: 1,
};

export function formatMetricValue(value: number, options?: { decimals?: number; suffix?: string }): string {
  const text = options?.decimals !== undefined ? value.toFixed(options.decimals) : String(value);
  return `${text}${options?.suffix ?? ''}`;
}

export function formatPercentage(value: number, options?: { decimals?: number; signed?: boolean }): string {
  const decimals = options?.decimals ?? 1;
  const sign = options?.signed && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatCoordinate(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
}

export interface MapPoint {
  x: number;
  y: number;
}

/**
 * Deterministically projects a lat/lon pair onto the Event Detail
 * comparison maps' shared SVG canvas. Not a scientific projection — a
 * simple linear mapping across the event's local domain bounds, so both
 * the NWP and AI fields (and any markers on them) stay aligned without
 * scattering coordinate math across JSX.
 */
export function projectCoordinateToMap(
  latitude: number,
  longitude: number,
  bounds: MapBounds,
  svgWidth = 540,
  svgHeight = 410,
): MapPoint {
  const x = ((longitude - bounds.west) / (bounds.east - bounds.west)) * svgWidth;
  const y = ((bounds.north - latitude) / (bounds.north - bounds.south)) * svgHeight;
  return { x, y };
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
