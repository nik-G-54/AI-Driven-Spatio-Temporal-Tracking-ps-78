import type { GeoDomain } from './dashboard.api';
export { classNames } from '../shared/ui/classNames';

export type Severity = 'low' | 'moderate' | 'high' | 'severe' | 'extreme';

export interface SeverityStyle {
  dot: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accent: string;
}

const SEVERITY_STYLES: Record<Severity, SeverityStyle> = {
  low: {
    dot: '#22C55E',
    badgeBg: 'bg-[#DCFCE7]',
    badgeText: 'text-[#15803D]',
    badgeBorder: 'border-[#BBF7D0]',
    accent: '#22C55E',
  },
  moderate: {
    dot: '#EAB308',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-[#A16207]',
    badgeBorder: 'border-amber-200',
    accent: '#EAB308',
  },
  high: {
    dot: '#F97316',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-[#C2410C]',
    badgeBorder: 'border-orange-200',
    accent: '#F97316',
  },
  severe: {
    dot: '#EF4444',
    badgeBg: 'bg-red-100',
    badgeText: 'text-[#B91C1C]',
    badgeBorder: 'border-red-200',
    accent: '#EF4444',
  },
  extreme: {
    dot: '#B91C1C',
    badgeBg: 'bg-red-200',
    badgeText: 'text-[#7F1D1D]',
    badgeBorder: 'border-red-300',
    accent: '#B91C1C',
  },
};

export function getSeverityStyle(severity: string): SeverityStyle {
  const key = severity.toLowerCase() as Severity;
  return SEVERITY_STYLES[key] ?? SEVERITY_STYLES.moderate;
}

export type PipelineStatus = 'ready' | 'complete' | 'dispatched' | 'running' | 'failed';

export interface PipelineStatusStyle {
  dot: string;
  text: string;
}

const PIPELINE_STATUS_STYLES: Record<PipelineStatus, PipelineStatusStyle> = {
  ready: { dot: 'bg-[#16A34A]', text: 'text-[#16A34A]' },
  complete: { dot: 'bg-[#16A34A]', text: 'text-[#16A34A]' },
  dispatched: { dot: 'bg-[#2563EB]', text: 'text-[#2563EB]' },
  running: { dot: 'bg-[#2563EB] animate-pulse', text: 'text-[#2563EB]' },
  failed: { dot: 'bg-[#DC2626]', text: 'text-[#DC2626]' },
};

export function getPipelineStatusStyle(status: string): PipelineStatusStyle {
  const key = status.toLowerCase() as PipelineStatus;
  return PIPELINE_STATUS_STYLES[key] ?? PIPELINE_STATUS_STYLES.running;
}

export function formatLeadHour(hours: number): string {
  return `T+${hours}h`;
}

export interface SvgPoint {
  x: number;
  y: number;
}

const MAP_VIEWPORT = {
  width: 1000,
  height: 520,
  originX: 120,
  originY: 90,
  pxPerDegreeLon: 32,
  pxPerDegreeLat: 22,
};

/**
 * Deterministically projects a lat/lon pair onto the Dashboard's stylized
 * geospatial viewport (a 1000x520 SVG canvas). Not a scientific projection —
 * it's a simple linear mapping calibrated to the domain's graticule anchors
 * (defined by `domain`) so mock data authored in lat/lon stays visually
 * consistent with the drawn coordinate grid.
 */
export function projectGeoPointToSvg(
  latitude: number,
  longitude: number,
  domain: GeoDomain,
): SvgPoint {
  const [minLon] = domain.lonRange;
  const [, maxLat] = domain.latRange;
  const x = MAP_VIEWPORT.originX + (longitude - minLon) * MAP_VIEWPORT.pxPerDegreeLon;
  const y = MAP_VIEWPORT.originY + (maxLat - latitude) * MAP_VIEWPORT.pxPerDegreeLat;
  return { x, y };
}

export function degreesToSvgLength(degrees: number, axis: 'lat' | 'lon' = 'lon'): number {
  return degrees * (axis === 'lon' ? MAP_VIEWPORT.pxPerDegreeLon : MAP_VIEWPORT.pxPerDegreeLat);
}
