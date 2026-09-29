import type { Feature, FeatureCollection, LineString } from 'geojson';
import type { StyleSpecification } from 'maplibre-gl';
import type { Extent } from './fieldGrid';

// Basemap = local vector geometry, no tile server: Natural Earth land polygons
// (public domain, via the `world-atlas` package) drawn by MapLibre. Works
// offline and deterministically. To use a tile basemap later, replace the
// style below — nothing else in the map depends on it.
export const BASEMAP_CREDIT = 'Land: Natural Earth (public domain)';

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };

export function baseStyle(extent: Extent, graticuleStepDeg = 0.5): StyleSpecification {
  return {
    version: 8,
    sources: {
      land: { type: 'geojson', data: EMPTY },
      graticule: { type: 'geojson', data: graticule(extent, graticuleStepDeg) },
    },
    layers: [
      { id: 'sea', type: 'background', paint: { 'background-color': '#E8F0F7' } },
      { id: 'land-fill', type: 'fill', source: 'land', paint: { 'fill-color': '#F2EFE8' } },
    ],
  };
}

// Land polygons are loaded lazily and decoded once, then shared by every map.
let landPromise: Promise<FeatureCollection> | null = null;

async function decodeLand(): Promise<FeatureCollection> {
  const [{ feature }, topology] = await Promise.all([import('topojson-client'), import('world-atlas/land-50m.json')]);
  const land = topology.default as unknown as Parameters<typeof feature>[0];
  const objects = (land as unknown as { objects: { land: Parameters<typeof feature>[1] } }).objects;
  const result = feature(land, objects.land) as Feature | FeatureCollection;
  return result.type === 'FeatureCollection' ? result : { type: 'FeatureCollection', features: [result] };
}

export function loadLand(): Promise<FeatureCollection> {
  if (!landPromise) {
    landPromise = decodeLand().catch((error: unknown) => {
      landPromise = null;
      throw error;
    });
  }
  return landPromise;
}

// Lat/lon graticule (real coordinates) covering the extent, snapped to the step.
export function graticule(extent: Extent, step: number): FeatureCollection<LineString> {
  const features: Array<Feature<LineString>> = [];
  const pad = step;
  const south = Math.floor((extent.south - pad) / step) * step;
  const north = Math.ceil((extent.north + pad) / step) * step;
  const west = Math.floor((extent.west - pad) / step) * step;
  const east = Math.ceil((extent.east + pad) / step) * step;
  for (let lat = south; lat <= north + 1e-9; lat += step) {
    features.push({ type: 'Feature', properties: { lat }, geometry: { type: 'LineString', coordinates: [[west, lat], [east, lat]] } });
  }
  for (let lon = west; lon <= east + 1e-9; lon += step) {
    features.push({ type: 'Feature', properties: { lon }, geometry: { type: 'LineString', coordinates: [[lon, south], [lon, north]] } });
  }
  return { type: 'FeatureCollection', features };
}
