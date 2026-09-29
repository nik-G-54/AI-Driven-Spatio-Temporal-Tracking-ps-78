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
      { id: 'sea', type: 'background', paint: { 'background-color': '#EDF2F7' } },
      { id: 'land-fill', type: 'fill', source: 'land', paint: { 'fill-color': '#F5F3EE' } },
    ],
  };
}

// Satellite imagery basemap: Sentinel-2 cloudless 2020 mosaic by EOX (CC BY-NC-SA 4.0,
// non-commercial use with attribution). It is a static, cloud-free composite for
// geographic orientation — NOT a weather observation and not a satellite image of the
// event. Darkened so the analytical layers carry the colour. The Natural Earth land fill
// underneath is the fallback when the tiles cannot be reached (offline).
export const SATELLITE_CREDIT = 'Imagery: Sentinel-2 cloudless 2020 © EOX IT Services (Copernicus data), CC BY-NC-SA 4.0 · static basemap, not a weather observation';

export function satelliteStyle(extent: Extent): StyleSpecification {
  return {
    version: 8,
    sources: {
      land: { type: 'geojson', data: EMPTY },
      graticule: { type: 'geojson', data: graticule(extent, graticuleStep(extent)) },
      imagery: {
        type: 'raster',
        tiles: ['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg'],
        tileSize: 256,
        maxzoom: 14,
      },
    },
    layers: [
      { id: 'sea', type: 'background', paint: { 'background-color': '#070C12' } },
      { id: 'land-fill', type: 'fill', source: 'land', paint: { 'fill-color': '#151C24' } },
      {
        id: 'imagery',
        type: 'raster',
        source: 'imagery',
        paint: { 'raster-brightness-max': 0.62, 'raster-saturation': -0.45, 'raster-contrast': 0.12, 'raster-fade-duration': 150 },
      },
    ],
  };
}

export function graticuleStep(extent: Extent): number {
  const span = Math.max(extent.east - extent.west, extent.north - extent.south);
  return span > 14 ? 2 : span > 6 ? 1 : 0.5;
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
