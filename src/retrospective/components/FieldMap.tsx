import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Map as MapLibreMap, NavigationControl, ScaleControl, setWorkerUrl, type GeoJSONSource, type ImageSource, type PaddingOptions } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Feature, FeatureCollection, MultiLineString } from 'geojson';
import { baseStyle, loadLand } from '../map/basemap';
import type { ColorScale } from '../map/colorScales';
import type { Extent } from '../map/fieldGrid';
import { centroidCollection, EMPTY_LINES, pathCollections, type PathPoint } from '../map/footprintGeo';
import type { MapSyncGroup } from '../map/mapSync';
import { rasterizeField } from '../map/rasterize';

// MapLibre locates its worker relative to its own file, which breaks once Vite
// pre-bundles / chunks it; point it at a worker bundled by Vite instead.
setWorkerUrl(maplibreWorkerUrl);

// One MapLibre map showing a weather field, with optional footprint outlines,
// centroid markers and an evolving-centroid path. Used by the single-field map,
// the three comparison maps and the difference map. It knows nothing about the
// case: everything arrives through props.
//
// Layers (bottom → top): base geography · field raster · graticule · coast ·
// centroid path · footprint outlines · footprint centroids.

export interface FieldMapProps {
  extent: Extent;
  valueAt: (lat: number, lon: number) => number | null;
  scale: ColorScale;
  // Unit shown in the hover readout.
  unit: string;
  primaryOutline?: Feature<MultiLineString> | null;
  secondaryOutline?: Feature<MultiLineString> | null;
  centroids?: Array<{ latitude: number; longitude: number; role: 'primary' | 'secondary' }>;
  path?: PathPoint[] | null;
  // Maps in the same group share one viewport.
  sync?: MapSyncGroup;
  padding?: PaddingOptions;
  ariaLabel: string;
  className?: string;
  // Overlays (legend etc.), positioned by the caller.
  children?: ReactNode;
}

const RASTER_WIDTH = 900;
const DEFAULT_PADDING: PaddingOptions = { top: 24, bottom: 24, left: 24, right: 24 };

const imageCoordinates = (extent: Extent): [[number, number], [number, number], [number, number], [number, number]] => [
  [extent.west, extent.north],
  [extent.east, extent.north],
  [extent.east, extent.south],
  [extent.west, extent.south],
];

const EMPTY_COLLECTION: FeatureCollection = { type: 'FeatureCollection', features: [] };
const NO_CENTROIDS: NonNullable<FieldMapProps['centroids']> = [];

export default function FieldMap({
  extent,
  valueAt,
  scale,
  unit,
  primaryOutline = null,
  secondaryOutline = null,
  centroids = NO_CENTROIDS,
  path = null,
  sync,
  padding = DEFAULT_PADDING,
  ariaLabel,
  className = 'h-[380px]',
  children,
}: FieldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const valueAtRef = useRef(valueAt);
  const unitRef = useRef(unit);
  // The map instance once its style and layers are loaded (null before / after).
  const [readyMap, setReadyMap] = useState<MapLibreMap | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    valueAtRef.current = valueAt;
    unitRef.current = unit;
  }, [valueAt, unit]);

  // Create the map once per extent.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new MapLibreMap({
      container,
      style: baseStyle(extent),
      bounds: [
        [extent.west, extent.south],
        [extent.east, extent.north],
      ],
      fitBoundsOptions: { padding },
      attributionControl: false,
      maxPitch: 0,
      dragRotate: false,
    });
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-right');
    const unsync = sync?.add(map);

    const blank = document.createElement('canvas');
    blank.width = 1;
    blank.height = 1;

    let styleLoaded = false;
    let landData: FeatureCollection | null = null;
    // Whichever of "style loaded" / "land loaded" happens last applies the data.
    const applyLand = () => {
      if (styleLoaded && landData) (map.getSource('land') as GeoJSONSource | undefined)?.setData(landData);
    };

    map.on('load', () => {
      map.addSource('field', { type: 'image', url: blank.toDataURL(), coordinates: imageCoordinates(extent) });
      map.addLayer({ id: 'field', type: 'raster', source: 'field', paint: { 'raster-resampling': 'nearest', 'raster-fade-duration': 0 } });
      map.addLayer({ id: 'graticule', type: 'line', source: 'graticule', paint: { 'line-color': '#64748B', 'line-opacity': 0.25, 'line-width': 0.6 } });
      map.addLayer({ id: 'coast', type: 'line', source: 'land', paint: { 'line-color': '#475569', 'line-width': 1 } });

      map.addSource('path-lines', { type: 'geojson', data: EMPTY_COLLECTION });
      map.addSource('path-points', { type: 'geojson', data: EMPTY_COLLECTION });
      map.addLayer({ id: 'path-ahead', type: 'line', source: 'path-lines', filter: ['==', ['get', 'part'], 'ahead'], paint: { 'line-color': '#111827', 'line-width': 1.2, 'line-dasharray': [1, 2] } });
      map.addLayer({ id: 'path-done-casing', type: 'line', source: 'path-lines', filter: ['==', ['get', 'part'], 'done'], paint: { 'line-color': '#FFFFFF', 'line-width': 4 } });
      map.addLayer({ id: 'path-done', type: 'line', source: 'path-lines', filter: ['==', ['get', 'part'], 'done'], paint: { 'line-color': '#111827', 'line-width': 1.8 } });
      map.addLayer({
        id: 'path-points',
        type: 'circle',
        source: 'path-points',
        paint: {
          'circle-radius': ['match', ['get', 'state'], 'current', 6.5, 'past', 4, 3],
          'circle-color': ['match', ['get', 'state'], 'current', '#FFFFFF', 'past', '#111827', '#FFFFFF'],
          'circle-stroke-color': ['match', ['get', 'state'], 'future', '#64748B', '#111827'],
          'circle-stroke-width': ['match', ['get', 'state'], 'current', 2.5, 1.5],
        },
      });

      map.addSource('footprint-primary', { type: 'geojson', data: EMPTY_LINES });
      map.addSource('footprint-secondary', { type: 'geojson', data: EMPTY_LINES });
      map.addSource('centroids', { type: 'geojson', data: centroidCollection([]) });
      map.addLayer({ id: 'footprint-secondary-casing', type: 'line', source: 'footprint-secondary', paint: { 'line-color': '#FFFFFF', 'line-width': 3.5 } });
      map.addLayer({ id: 'footprint-secondary', type: 'line', source: 'footprint-secondary', paint: { 'line-color': '#111827', 'line-width': 1.5, 'line-dasharray': [2, 2] } });
      map.addLayer({ id: 'footprint-primary-casing', type: 'line', source: 'footprint-primary', paint: { 'line-color': '#FFFFFF', 'line-width': 4.5 } });
      map.addLayer({ id: 'footprint-primary', type: 'line', source: 'footprint-primary', paint: { 'line-color': '#111827', 'line-width': 2.2 } });
      map.addLayer({
        id: 'centroids',
        type: 'circle',
        source: 'centroids',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'role'], 'primary'], 6, 4.5],
          'circle-color': '#FFFFFF',
          'circle-stroke-color': '#111827',
          'circle-stroke-width': 2,
        },
      });

      styleLoaded = true;
      applyLand();
      setReadyMap(map);
    });

    // The land polygons are a separate lazy chunk; the map is usable without them.
    loadLand()
      .then((land) => {
        landData = land;
        applyLand();
      })
      .catch(() => {
        /* basemap geometry unavailable: the field is still shown on a plain background */
      });

    map.on('mousemove', (event) => {
      const value = valueAtRef.current(event.lngLat.lat, event.lngLat.lng);
      const position = `${event.lngLat.lat.toFixed(3)}°N, ${event.lngLat.lng.toFixed(3)}°E`;
      setHover(value === null ? `${position} — outside grid` : `${position} — ${Number(value.toFixed(1))} ${unitRef.current}`);
    });
    map.on('mouseout', () => setHover(null));

    return () => {
      setReadyMap(null);
      unsync?.();
      map.remove();
    };
    // The map is recreated only when the geographic extent changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extent]);

  // Update the field raster whenever the sampler or scale changes.
  useEffect(() => {
    if (!readyMap) return;
    const canvas = rasterizeField(extent, RASTER_WIDTH, valueAt, scale);
    (readyMap.getSource('field') as ImageSource).updateImage({ image: canvas, coordinates: imageCoordinates(extent) });
  }, [readyMap, extent, valueAt, scale]);

  // Update the vector overlays.
  useEffect(() => {
    if (!readyMap) return;
    (readyMap.getSource('footprint-primary') as GeoJSONSource).setData(primaryOutline ?? EMPTY_LINES);
    (readyMap.getSource('footprint-secondary') as GeoJSONSource).setData(secondaryOutline ?? EMPTY_LINES);
    (readyMap.getSource('centroids') as GeoJSONSource).setData(centroidCollection(centroids));
    const collections = path ? pathCollections(path) : { lines: EMPTY_COLLECTION, points: EMPTY_COLLECTION };
    (readyMap.getSource('path-lines') as GeoJSONSource).setData(collections.lines);
    (readyMap.getSource('path-points') as GeoJSONSource).setData(collections.points);
  }, [readyMap, primaryOutline, secondaryOutline, centroids, path]);

  return (
    <div className={`relative rounded-md overflow-hidden border border-[#CBD5E1] ${className}`} role="group" aria-label={ariaLabel}>
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute left-2 top-2 z-10 rounded bg-white/90 px-1.5 py-0.5 font-mono text-[10px] text-[#334155] shadow-sm pointer-events-none">
        {hover ?? 'Hover to read simulated values'}
      </div>
      {children}
    </div>
  );
}
