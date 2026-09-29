import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Map as MapLibreMap, NavigationControl, ScaleControl, setWorkerUrl, type GeoJSONSource, type IControl, type PaddingOptions } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { BitmapLayer, PathLayer, PolygonLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import type { Layer } from '@deck.gl/core';
import type { Feature, FeatureCollection, MultiLineString } from 'geojson';
import { graticuleStep, loadLand, SATELLITE_CREDIT, satelliteStyle } from '../map/basemap';
import { continuous, type ColorScale } from '../map/colorScales';
import { backgroundFade, isolines, latticeImage, sampleLattice } from '../map/contours';
import type { Extent } from '../map/fieldGrid';
import type { PathPoint } from '../map/footprintGeo';
import { MapSyncGroup } from '../map/mapSync';
import { placesWithin } from '../map/places';
import './FieldMap.css';

// MapLibre locates its worker relative to its own file, which breaks once Vite
// pre-bundles / chunks it; point it at a worker bundled by Vite instead.
setWorkerUrl(maplibreWorkerUrl);

// One analytical map. MapLibre owns the camera (and the shared-camera sync group) and
// draws the satellite imagery basemap, coastline and graticule; a deck.gl overlay that
// follows the MapLibre camera draws everything analytical:
//   field bitmap (smooth ramp) · isolines at the class breaks with value labels ·
//   uncertainty cone / affected region · anomaly cells · exceedance contours ·
//   track or centroid path · footprint centroids · place and grid labels.
// It knows nothing about the event: everything arrives through props.

type ValueAt = (lat: number, lon: number) => number | null;

export interface FieldMapProps {
  // Extent the field covers.
  extent: Extent;
  // Default camera: fitted on load and on resize until the user pans or zooms.
  focus?: Extent;
  valueAt: ValueAt;
  scale: ColorScale;
  // Unit shown in the hover readout.
  unit: string;
  // Smooth threshold contours of any sampler (e.g. the AI field at the prototype threshold).
  contours?: Array<{ valueAt: ValueAt; level: number; role: 'primary' | 'secondary' }>;
  // Cell-edge footprint outlines (legacy callers).
  primaryOutline?: Feature<MultiLineString> | null;
  secondaryOutline?: Feature<MultiLineString> | null;
  centroids?: Array<{ latitude: number; longitude: number; role: 'primary' | 'secondary' }>;
  path?: PathPoint[] | null;
  // Polygon overlays (uncertainty cone, affected region): rings of [lon, lat].
  regions?: MapRegion[];
  // Strongest anomaly cells (weight 0..1).
  anomalyPoints?: Array<{ latitude: number; longitude: number; weight: number }>;
  // Draw isolines at the colour-scale class breaks.
  isolines?: boolean;
  // Field opacity (0..1).
  opacity?: number;
  // Maps in the same group share one viewport.
  sync?: MapSyncGroup;
  padding?: PaddingOptions;
  ariaLabel: string;
  className?: string;
  // Overlays (legend etc.), positioned by the caller.
  children?: ReactNode;
}

export interface MapRegion {
  kind: 'cone' | 'affected';
  ring: Array<[number, number]>;
}

type Rgb = [number, number, number];
type Rgba4 = [number, number, number, number];
type LonLat = [number, number];

const LATTICE_COLS = 320;
const DEFAULT_PADDING: PaddingOptions = { top: 16, bottom: 16, left: 16, right: 16 };
const MAX_PADDING_SHARE = 0.5;
const MAX_ISOLINE_LABELS = 14;

const DASH = new PathStyleExtension({ dash: true });
const MONO = 'ui-monospace, SFMono-Regular, Consolas, monospace';
const SANS = 'Inter, "IBM Plex Sans", system-ui, sans-serif';

// Palette of the overlay (data colours come from the scale).
const INK: Rgba4 = [5, 8, 12, 220];
const AMBER: Rgb = [255, 190, 40];
const CYAN: Rgb = [56, 189, 248];
const SNOW: Rgb = [236, 242, 248];

function safePadding(padding: PaddingOptions, width: number, height: number): PaddingOptions {
  const fit = (a: number | undefined, b: number | undefined, size: number): [number, number] => {
    const pa = a ?? 0;
    const pb = b ?? 0;
    const limit = size * MAX_PADDING_SHARE;
    const k = pa + pb > limit ? limit / (pa + pb) : 1;
    return [pa * k, pb * k];
  };
  const [left, right] = fit(padding.left, padding.right, width);
  const [top, bottom] = fit(padding.top, padding.bottom, height);
  return { left, right, top, bottom };
}

const NO_CONTOURS: NonNullable<FieldMapProps['contours']> = [];
const NO_CENTROIDS: NonNullable<FieldMapProps['centroids']> = [];
const NO_REGIONS: MapRegion[] = [];
const NO_POINTS: NonNullable<FieldMapProps['anomalyPoints']> = [];

const fmtLevel = (v: number) => (Math.abs(v) >= 100 ? String(Math.round(v)) : String(Number(v.toFixed(1))));
const midpoint = (line: LonLat[]): LonLat => line[Math.floor(line.length / 2)];

export default function FieldMap({
  extent,
  focus = extent,
  valueAt,
  scale,
  unit,
  contours = NO_CONTOURS,
  primaryOutline = null,
  secondaryOutline = null,
  centroids = NO_CENTROIDS,
  path = null,
  regions = NO_REGIONS,
  anomalyPoints = NO_POINTS,
  isolines: showIsolines = true,
  opacity = 1,
  sync,
  padding = DEFAULT_PADDING,
  ariaLabel,
  className = 'h-[380px]',
  children,
}: FieldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ownGroup] = useState(() => new MapSyncGroup());
  const group = sync ?? ownGroup;
  const valueAtRef = useRef(valueAt);
  const unitRef = useRef(unit);
  const [overlay, setOverlay] = useState<MapboxOverlay | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    valueAtRef.current = valueAt;
    unitRef.current = unit;
  }, [valueAt, unit]);

  // Create the map once per extent / focus.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new MapLibreMap({
      container,
      style: satelliteStyle(extent),
      bounds: [
        [focus.west, focus.south],
        [focus.east, focus.north],
      ],
      fitBoundsOptions: { padding: safePadding(padding, container.clientWidth, container.clientHeight) },
      attributionControl: false,
      maxPitch: 0,
      dragRotate: false,
    });
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-right');
    const unsync = group.add(map);

    const fit = () => {
      const { clientWidth: width, clientHeight: height } = container;
      if (width < 50 || height < 50) return;
      map.resize();
      map.fitBounds(
        [
          [focus.west, focus.south],
          [focus.east, focus.north],
        ],
        { padding: safePadding(padding, width, height), animate: false },
      );
    };
    const resizeObserver = new ResizeObserver(() => {
      if (group.pristine) fit();
    });
    resizeObserver.observe(container);

    let styleLoaded = false;
    let landData: FeatureCollection | null = null;
    const applyLand = () => {
      if (styleLoaded && landData) (map.getSource('land') as GeoJSONSource | undefined)?.setData(landData);
    };

    // Overlaid (not interleaved): deck.gl 9.4's interleaved renderer does not support MapLibre 6's custom-layer API.
    // Blend alpha as ONE / ONE_MINUS_SRC_ALPHA so the overlay canvas stays correctly premultiplied:
    // otherwise faint (low-alpha) field colours composite far too bright over the imagery.
    const deck = new MapboxOverlay({
      interleaved: false,
      layers: [],
      parameters: {
        blend: true,
        blendColorOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaOperation: 'add',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha',
      },
    });

    // 'style.load', not 'load': 'load' waits for every imagery tile, which can take seconds on a slow link.
    map.once('style.load', () => {
      map.addLayer({ id: 'graticule', type: 'line', source: 'graticule', paint: { 'line-color': '#CBD5E1', 'line-opacity': 0.14, 'line-width': 0.6 } });
      map.addLayer({ id: 'coast', type: 'line', source: 'land', paint: { 'line-color': '#C7D5E3', 'line-opacity': 0.42, 'line-width': 0.8 } });
      map.addControl(deck as unknown as IControl);
      styleLoaded = true;
      applyLand();
      if (group.pristine) fit();
      setOverlay(deck);
    });

    loadLand()
      .then((land) => {
        landData = land;
        applyLand();
      })
      .catch(() => {
        /* coastline unavailable: imagery (or the plain background) still frames the field */
      });

    map.on('mousemove', (event) => {
      const value = valueAtRef.current(event.lngLat.lat, event.lngLat.lng);
      const position = `${event.lngLat.lat.toFixed(3)}°N ${event.lngLat.lng.toFixed(3)}°E`;
      setHover(value === null ? `${position} · no data` : `${position} · ${Number(value.toFixed(1))} ${unitRef.current}`);
    });
    map.on('mouseout', () => setHover(null));

    return () => {
      setOverlay(null);
      resizeObserver.disconnect();
      unsync();
      map.remove();
    };
    // The map is recreated only when the geographic extent / focus numbers change (not the object identity).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extent.west, extent.east, extent.south, extent.north, focus.west, focus.east, focus.south, focus.north]);

  // ---- Field: lattice → smooth bitmap + isolines ------------------------------------
  const field = useMemo(() => {
    const lattice = sampleLattice(extent, LATTICE_COLS, valueAt);
    const ramp = continuous(scale);
    const mode = scale.kind === 'diverging' ? 'magnitude' : scale.classes[0]?.color[3] === 0 ? 'rising' : 'none';
    const image = latticeImage(lattice, ramp.colorAt, backgroundFade(lattice, mode));
    const levels = showIsolines ? ramp.breaks : [];
    const lines = levels.flatMap((level) => isolines(lattice, level).map((line) => ({ level, line })));
    const labels = lines
      .filter((l) => l.line.length > 24)
      .sort((a, b) => b.line.length - a.line.length)
      .slice(0, MAX_ISOLINE_LABELS)
      .map((l) => ({ position: midpoint(l.line), text: fmtLevel(l.level) }));
    return { image, lines, labels };
  }, [extent, valueAt, scale, showIsolines]);

  const contourLines = useMemo(
    () =>
      contours.flatMap(({ valueAt: sampler, level, role }) =>
        isolines(sampleLattice(extent, LATTICE_COLS, sampler), level).map((line) => ({ role, line })),
      ),
    [contours, extent],
  );

  const legacyOutlines = useMemo(
    () => [
      ...(primaryOutline?.geometry.coordinates ?? []).map((line) => ({ role: 'primary' as const, line: line as LonLat[] })),
      ...(secondaryOutline?.geometry.coordinates ?? []).map((line) => ({ role: 'secondary' as const, line: line as LonLat[] })),
    ],
    [primaryOutline, secondaryOutline],
  );

  const labels = useMemo(() => {
    const step = graticuleStep(extent);
    const grid: Array<{ position: LonLat; text: string; align: 'lat' | 'lon' }> = [];
    for (let lon = Math.ceil(focus.west / step) * step; lon <= focus.east; lon += step) {
      grid.push({ position: [lon, focus.south], text: `${Number(lon.toFixed(1))}°E`, align: 'lon' });
    }
    for (let lat = Math.ceil(focus.south / step) * step; lat <= focus.north; lat += step) {
      grid.push({ position: [focus.west, lat], text: `${Number(lat.toFixed(1))}°N`, align: 'lat' });
    }
    return { places: placesWithin(extent), grid };
  }, [extent, focus]);

  // ---- deck.gl layers ------------------------------------------------------------------
  const layers = useMemo(() => {
    const out: Layer[] = [];
    const bounds: [number, number, number, number] = [extent.west, extent.south, extent.east, extent.north];

    out.push(new BitmapLayer({ id: 'field', image: field.image, bounds, opacity, pickable: false }));

    if (field.lines.length) {
      out.push(
        new PathLayer({
          id: 'isolines',
          data: field.lines,
          getPath: (d: { line: LonLat[] }) => d.line,
          getColor: [4, 7, 11, 150],
          getWidth: 0.9,
          widthUnits: 'pixels',
          opacity,
        }),
        new TextLayer({
          id: 'isoline-labels',
          data: field.labels,
          getPosition: (d: { position: LonLat }) => d.position,
          getText: (d: { text: string }) => d.text,
          getSize: 10,
          getColor: [...SNOW, 235],
          fontFamily: MONO,
          fontWeight: 600,
          fontSettings: { sdf: true },
          outlineWidth: 3,
          outlineColor: [4, 7, 11, 230],
          opacity,
        }),
      );
    }

    const cone = regions.filter((r) => r.kind === 'cone').map((r) => [...r.ring, r.ring[0]]);
    const affected = regions.filter((r) => r.kind === 'affected').map((r) => [...r.ring, r.ring[0]]);
    if (cone.length) {
      out.push(
        new PolygonLayer({ id: 'cone-fill', data: cone, getPolygon: (d: LonLat[]) => d, getFillColor: [203, 213, 225, 26], stroked: false }),
        new PathLayer({
          id: 'cone-line',
          data: cone,
          getPath: (d: LonLat[]) => d,
          getColor: [226, 232, 240, 190],
          getWidth: 1.3,
          widthUnits: 'pixels',
          getDashArray: [5, 4],
          dashJustified: true,
          extensions: [DASH],
        }),
      );
    }
    if (affected.length) {
      out.push(
        new PathLayer({
          id: 'affected-line',
          data: affected,
          getPath: (d: LonLat[]) => d,
          getColor: [251, 146, 60, 230],
          getWidth: 1.5,
          widthUnits: 'pixels',
          getDashArray: [2, 3],
          extensions: [DASH],
        }),
      );
    }

    if (anomalyPoints.length) {
      out.push(
        new ScatterplotLayer({
          id: 'anomaly-cells',
          data: anomalyPoints,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: (d: { weight: number }) => 3 + 7 * d.weight,
          radiusUnits: 'pixels',
          getFillColor: (d: { weight: number }) => [255, Math.round(200 - 150 * d.weight), 40, Math.round(70 + 150 * d.weight)],
          stroked: true,
          getLineColor: [255, 244, 214, 160],
          getLineWidth: 0.6,
          lineWidthUnits: 'pixels',
        }),
      );
    }

    const outlines = [...contourLines, ...legacyOutlines];
    const primary = outlines.filter((o) => o.role === 'primary');
    const secondary = outlines.filter((o) => o.role === 'secondary');
    if (secondary.length) {
      out.push(
        new PathLayer({ id: 'contour-2-casing', data: secondary, getPath: (d: { line: LonLat[] }) => d.line, getColor: INK, getWidth: 3.6, widthUnits: 'pixels' }),
        new PathLayer({
          id: 'contour-2',
          data: secondary,
          getPath: (d: { line: LonLat[] }) => d.line,
          getColor: [...SNOW, 240],
          getWidth: 1.6,
          widthUnits: 'pixels',
          getDashArray: [4, 3],
          extensions: [DASH],
        }),
      );
    }
    if (primary.length) {
      out.push(
        new PathLayer({ id: 'contour-1-casing', data: primary, getPath: (d: { line: LonLat[] }) => d.line, getColor: INK, getWidth: 5, widthUnits: 'pixels' }),
        new PathLayer({ id: 'contour-1', data: primary, getPath: (d: { line: LonLat[] }) => d.line, getColor: [...AMBER, 255], getWidth: 2.2, widthUnits: 'pixels' }),
      );
    }

    if (path && path.length > 1) {
      const current = Math.max(0, path.findIndex((p) => p.state === 'current'));
      const coords = path.map((p): LonLat => [p.longitude, p.latitude]);
      const done = coords.slice(0, current + 1);
      const ahead = coords.slice(current);
      if (done.length > 1) {
        out.push(
          new PathLayer({ id: 'track-glow', data: [done], getPath: (d: LonLat[]) => d, getColor: [...CYAN, 70], getWidth: 9, widthUnits: 'pixels', capRounded: true, jointRounded: true }),
          new PathLayer({ id: 'track-done', data: [done], getPath: (d: LonLat[]) => d, getColor: [...SNOW, 255], getWidth: 2.2, widthUnits: 'pixels', capRounded: true, jointRounded: true }),
        );
      }
      if (ahead.length > 1) {
        out.push(
          new PathLayer({ id: 'track-ahead-casing', data: [ahead], getPath: (d: LonLat[]) => d, getColor: [4, 7, 11, 150], getWidth: 3.5, widthUnits: 'pixels' }),
          new PathLayer({
            id: 'track-ahead',
            data: [ahead],
            getPath: (d: LonLat[]) => d,
            getColor: [...SNOW, 220],
            getWidth: 1.6,
            widthUnits: 'pixels',
            getDashArray: [3, 3],
            extensions: [DASH],
          }),
        );
      }
      out.push(
        new ScatterplotLayer({
          id: 'track-halo',
          data: [coords[current]],
          getPosition: (d: LonLat) => d,
          getRadius: 13,
          radiusUnits: 'pixels',
          filled: false,
          stroked: true,
          getLineColor: [...CYAN, 190],
          getLineWidth: 1.5,
          lineWidthUnits: 'pixels',
        }),
        new ScatterplotLayer({
          id: 'track-points',
          data: path,
          getPosition: (d: PathPoint) => [d.longitude, d.latitude],
          getRadius: (d: PathPoint) => (d.state === 'current' ? 6.5 : d.state === 'past' ? 3.6 : 3),
          radiusUnits: 'pixels',
          getFillColor: (d: PathPoint) => (d.state === 'current' ? [...CYAN, 255] : d.state === 'past' ? [...SNOW, 255] : [8, 12, 18, 235]),
          stroked: true,
          getLineColor: (d: PathPoint) => (d.state === 'current' ? [255, 255, 255, 255] : d.state === 'past' ? [4, 7, 11, 255] : [...SNOW, 220]),
          getLineWidth: (d: PathPoint) => (d.state === 'current' ? 2 : 1.2),
          lineWidthUnits: 'pixels',
        }),
      );
    }

    if (centroids.length) {
      out.push(
        new ScatterplotLayer({
          id: 'centroids',
          data: centroids,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: (d: { role: string }) => (d.role === 'primary' ? 5 : 4),
          radiusUnits: 'pixels',
          getFillColor: (d: { role: string }) => (d.role === 'primary' ? [...AMBER, 255] : [...SNOW, 255]),
          stroked: true,
          getLineColor: INK,
          getLineWidth: 1.8,
          lineWidthUnits: 'pixels',
        }),
      );
    }

    out.push(
      new ScatterplotLayer({
        id: 'places',
        data: labels.places,
        getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
        getRadius: 2.6,
        radiusUnits: 'pixels',
        getFillColor: [...SNOW, 255],
        stroked: true,
        getLineColor: INK,
        getLineWidth: 1,
        lineWidthUnits: 'pixels',
      }),
      new TextLayer({
        id: 'place-labels',
        data: labels.places,
        getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
        getText: (d: { name: string }) => d.name,
        getSize: 11.5,
        getColor: [...SNOW, 255],
        getTextAnchor: 'start',
        getAlignmentBaseline: 'center',
        getPixelOffset: [7, 0],
        fontFamily: SANS,
        fontWeight: 600,
        fontSettings: { sdf: true },
        outlineWidth: 4,
        outlineColor: [4, 7, 11, 235],
      }),
      new TextLayer({
        id: 'grid-labels',
        data: labels.grid,
        getPosition: (d: { position: LonLat }) => d.position,
        getText: (d: { text: string }) => d.text,
        getSize: 9.5,
        getColor: [203, 213, 225, 210],
        getTextAnchor: (d: { align: string }) => (d.align === 'lat' ? 'start' : 'middle'),
        getAlignmentBaseline: (d: { align: string }) => (d.align === 'lat' ? 'center' : 'bottom'),
        getPixelOffset: (d: { align: string }) => (d.align === 'lat' ? [4, 0] : [0, -4]),
        fontFamily: MONO,
        characterSet: 'auto',
        fontSettings: { sdf: true },
        outlineWidth: 3,
        outlineColor: [4, 7, 11, 220],
      }),
    );
    return out;
  }, [extent, field, opacity, regions, anomalyPoints, contourLines, legacyOutlines, path, centroids, labels]);

  useEffect(() => {
    overlay?.setProps({ layers });
  }, [overlay, layers]);

  return (
    <div className={`field-map field-map-frame relative overflow-hidden border border-[#1F2A36] bg-[#070C12] ${className}`} role="group" aria-label={ariaLabel}>
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute left-3 top-3 z-10 bg-[#05080C]/85 border border-[#2A3645] px-2 py-1 font-mono text-[10.5px] text-[#D9E1EA] pointer-events-none">
        {hover ?? 'CURSOR · hover to read simulated values'}
      </div>
      <div className="absolute right-2 bottom-7 z-10 max-w-[60%] text-right font-mono text-[8.5px] leading-tight text-[#94A3B8] pointer-events-none" title={SATELLITE_CREDIT}>
        Sentinel-2 cloudless 2020 © EOX · static basemap, not an observation
      </div>
      {children}
    </div>
  );
}
