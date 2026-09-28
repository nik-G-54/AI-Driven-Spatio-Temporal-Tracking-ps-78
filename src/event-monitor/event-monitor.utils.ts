import type { EventMonitorTrajectory, GeoPoint } from './event-monitor.api';

export type Severity = 'low' | 'moderate' | 'high' | 'severe' | 'extreme';

export interface SeverityStyle {
  accent: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

const SEVERITY_STYLES: Record<Severity, SeverityStyle> = {
  low: { accent: '#22C55E', badgeBg: 'bg-[#DCFCE7]', badgeText: 'text-[#15803D]', badgeBorder: 'border-[#BBF7D0]' },
  moderate: { accent: '#EAB308', badgeBg: 'bg-amber-100', badgeText: 'text-[#A16207]', badgeBorder: 'border-amber-200' },
  high: { accent: '#F97316', badgeBg: 'bg-orange-100', badgeText: 'text-[#C2410C]', badgeBorder: 'border-orange-200' },
  severe: { accent: '#EF4444', badgeBg: 'bg-red-100', badgeText: 'text-[#B91C1C]', badgeBorder: 'border-red-200' },
  extreme: { accent: '#B91C1C', badgeBg: 'bg-red-200', badgeText: 'text-[#7F1D1D]', badgeBorder: 'border-red-300' },
};

// Normalizes event-level status tiers (ADVISORY/WATCH/SEVERE) and alert-level
// tiers (low/moderate/high/severe/extreme) onto the same 5-stage spectrum.
const SEVERITY_ALIASES: Record<string, Severity> = {
  advisory: 'moderate',
  watch: 'high',
};

export function getSeverityStyle(severity: string): SeverityStyle {
  const key = severity.toLowerCase();
  const normalized = SEVERITY_ALIASES[key] ?? (key as Severity);
  return SEVERITY_STYLES[normalized] ?? SEVERITY_STYLES.moderate;
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface SvgPoint {
  x: number;
  y: number;
}

/**
 * Deterministically projects a lat/lon pair onto the Event Monitor's
 * stylized geospatial canvas. Not a scientific projection — a simple linear
 * mapping across the given bounds, so mock data authored in lat/lon renders
 * consistently without scattering pixel math across JSX.
 */
export function projectGeoPointToSvg(
  latitude: number,
  longitude: number,
  bounds: MapBounds,
  svgWidth = 1000,
  svgHeight = 600,
): SvgPoint {
  const x = ((longitude - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * svgWidth;
  const y = ((bounds.maxLat - latitude) / (bounds.maxLat - bounds.minLat)) * svgHeight;
  return { x, y };
}

const KM_PER_DEGREE = 111;

export function kmToSvgLength(km: number, bounds: MapBounds, axis: 'lat' | 'lon', svgWidth = 1000, svgHeight = 600): number {
  const degrees = km / KM_PER_DEGREE;
  return axis === 'lon'
    ? (degrees / (bounds.maxLon - bounds.minLon)) * svgWidth
    : (degrees / (bounds.maxLat - bounds.minLat)) * svgHeight;
}

export function formatCoordinate(point: GeoPoint): string {
  return `${point.latitude.toFixed(2)}°N, ${point.longitude.toFixed(2)}°E`;
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: { type: 'Point' | 'LineString'; coordinates: number[] | number[][] };
  }>;
};

/**
 * Converts the currently loaded trajectory (historical + forecast points)
 * into a standard GeoJSON FeatureCollection: one LineString for the full
 * track, plus one Point feature per waypoint carrying its lead hour/status.
 */
export function trajectoryToGeoJSON(trajectory: EventMonitorTrajectory, eventId: string): GeoJsonFeatureCollection {
  const allPoints = [
    ...trajectory.historical.map((p) => ({ ...p, phase: 'historical' as const })),
    ...trajectory.forecast.map((p) => ({ ...p, phase: 'forecast' as const })),
  ].sort((a, b) => a.leadHour - b.leadHour);

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { eventId, kind: 'track' },
        geometry: {
          type: 'LineString',
          coordinates: allPoints.map((p) => [p.longitude, p.latitude]),
        },
      },
      ...allPoints.map((p) => ({
        type: 'Feature' as const,
        properties: {
          eventId,
          leadHour: p.leadHour,
          timestamp: p.timestamp,
          phase: p.phase,
          status: 'status' in p ? p.status : undefined,
        },
        geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
      })),
    ],
  };
}
