import type { Feature, FeatureCollection, LineString, MultiLineString, Point } from 'geojson';
import type { EventFootprint } from '../retrospective.types';

const key = (lon: number, lat: number) => `${lon.toFixed(6)},${lat.toFixed(6)}`;

// Outer boundary of a set of grid cells: every cell edge shared with another
// footprint cell is dropped, leaving only the edges on the boundary. Gives a
// crisp footprint outline without internal grid lines.
export function footprintOutline(footprint: EventFootprint, spacing: number): Feature<MultiLineString> {
  const half = spacing / 2;
  const edges = new Map<string, [[number, number], [number, number]]>();
  const counts = new Map<string, number>();

  const add = (a: [number, number], b: [number, number]) => {
    const id = [key(...a), key(...b)].sort().join('|');
    edges.set(id, [a, b]);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  };

  for (const { latitude: lat, longitude: lon } of footprint.cells) {
    const w = lon - half;
    const e = lon + half;
    const s = lat - half;
    const n = lat + half;
    add([w, n], [e, n]);
    add([e, n], [e, s]);
    add([e, s], [w, s]);
    add([w, s], [w, n]);
  }

  const lines = [...edges.entries()].filter(([id]) => counts.get(id) === 1).map(([, edge]) => edge);
  return { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: lines } };
}

export function centroidCollection(points: Array<{ latitude: number; longitude: number; role: 'primary' | 'secondary' }>): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      properties: { role: p.role },
      geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
    })),
  };
}

export const EMPTY_LINES: Feature<MultiLineString> = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'MultiLineString', coordinates: [] },
};

// ---- Evolving-footprint centroid path ---------------------------------------

export interface PathPoint {
  latitude: number;
  longitude: number;
  // Relative to the selected time step.
  state: 'past' | 'current' | 'future';
}

// The path is split at the current time step: the part already reached is drawn
// solid, the part still ahead dotted. Points carry their state for styling.
export function pathCollections(points: PathPoint[]): {
  lines: FeatureCollection<LineString>;
  points: FeatureCollection<Point>;
} {
  const currentIndex = Math.max(0, points.findIndex((p) => p.state === 'current'));
  const coordinates = points.map((p): [number, number] => [p.longitude, p.latitude]);
  const segment = (part: 'done' | 'ahead', coords: Array<[number, number]>): Feature<LineString> => ({
    type: 'Feature',
    properties: { part },
    geometry: { type: 'LineString', coordinates: coords },
  });
  const lines: Array<Feature<LineString>> = [];
  if (currentIndex > 0) lines.push(segment('done', coordinates.slice(0, currentIndex + 1)));
  if (currentIndex < points.length - 1) lines.push(segment('ahead', coordinates.slice(currentIndex)));
  return {
    lines: { type: 'FeatureCollection', features: lines },
    points: {
      type: 'FeatureCollection',
      features: points.map((p) => ({
        type: 'Feature',
        properties: { state: p.state },
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
      })),
    },
  };
}
