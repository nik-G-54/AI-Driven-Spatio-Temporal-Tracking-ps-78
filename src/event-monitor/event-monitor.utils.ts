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

export function trajectoryToGeoJSON(trajectory: any, eventId: string): GeoJsonFeatureCollection {
  const historical = (trajectory.historical || []).map((p: any) => ({ ...p, phase: 'historical' as const }));
  const forecast = (trajectory.forecast || []).map((p: any) => ({ ...p, phase: 'forecast' as const }));
  const allPoints = [...historical, ...forecast].sort((a: any, b: any) => a.leadHour - b.leadHour);

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { eventId, kind: 'track' },
        geometry: {
          type: 'LineString',
          coordinates: allPoints.map((p: any) => [p.longitude || p.lon, p.latitude || p.lat]),
        },
      },
      ...allPoints.map((p: any) => ({
        type: 'Feature' as const,
        properties: {
          eventId,
          leadHour: p.leadHour,
          timestamp: p.timestamp,
          phase: p.phase,
          status: p.status,
        },
        geometry: { type: 'Point' as const, coordinates: [p.longitude || p.lon, p.latitude || p.lat] },
      })),
    ],
  };
}
