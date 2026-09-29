import type { Rgba } from './colorScales';
import type { Extent } from './fieldGrid';

// A field sampled on a regular lattice in Web-Mercator space (rows evenly spaced
// in Mercator Y, like the map), so one lattice both paints the field bitmap and
// feeds the contour tracer. NaN = no data.

const DEG = Math.PI / 180;
const mercatorY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * DEG) / 2));
const latFromMercatorY = (y: number) => (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / DEG;

export interface Lattice {
  cols: number;
  rows: number;
  values: Float32Array;
  // Geographic position of a (fractional) lattice index.
  toLonLat: (row: number, col: number) => [number, number];
}

export function sampleLattice(extent: Extent, cols: number, valueAt: (lat: number, lon: number) => number | null): Lattice {
  const yNorth = mercatorY(extent.north);
  const ySouth = mercatorY(extent.south);
  const lonSpan = extent.east - extent.west;
  const rows = Math.max(2, Math.min(cols * 2, Math.round((cols * (yNorth - ySouth)) / (lonSpan * DEG))));
  const toLonLat = (row: number, col: number): [number, number] => [
    extent.west + ((col + 0.5) / cols) * lonSpan,
    latFromMercatorY(yNorth - ((row + 0.5) / rows) * (yNorth - ySouth)),
  ];
  const values = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r += 1) {
    const lat = toLonLat(r, 0)[1];
    for (let c = 0; c < cols; c += 1) {
      const v = valueAt(lat, extent.west + ((c + 0.5) / cols) * lonSpan);
      values[r * cols + c] = v === null ? NaN : v;
    }
  }
  return { cols, rows, values, toLonLat };
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a || 1)));
  return t * t * (3 - 2 * t);
};

// Opacity factor that hides the field's quiet background and keeps its signal, scaled
// to this lattice's own range: rising values for sequential fields whose lowest class is
// transparent, magnitude for diverging fields, none otherwise (e.g. cold cloud tops).
export function backgroundFade(lattice: Lattice, mode: 'rising' | 'magnitude' | 'none'): (value: number) => number {
  if (mode === 'none') return () => 1;
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of lattice.values) {
    if (Number.isNaN(v)) continue;
    const x = mode === 'magnitude' ? Math.abs(v) : v;
    if (x < lo) lo = x;
    if (x > hi) hi = x;
  }
  if (!Number.isFinite(lo) || hi <= lo) return () => 1;
  const base = mode === 'magnitude' ? 0 : lo;
  const span = hi - base;
  const a = base + 0.06 * span;
  const b = base + 0.4 * span;
  return mode === 'magnitude' ? (v) => smoothstep(a, b, Math.abs(v)) : (v) => smoothstep(a, b, v);
}

// RGBA image of the lattice (north row first), for a deck.gl BitmapLayer.
export function latticeImage(lattice: Lattice, colorAt: (value: number) => Rgba, fade: (value: number) => number = () => 1): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = lattice.cols;
  canvas.height = lattice.rows;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const { cols, rows } = lattice;
  const image = context.createImageData(cols, rows);
  // Feather the last few percent of the domain so the field has no hard rectangular edge.
  const feather = Math.max(2, Math.round(Math.min(cols, rows) * 0.14));
  for (let i = 0; i < lattice.values.length; i += 1) {
    const v = lattice.values[i];
    if (Number.isNaN(v)) continue;
    const r0 = Math.floor(i / cols);
    const c0 = i % cols;
    const edge = Math.min(r0, c0, rows - 1 - r0, cols - 1 - c0);
    const t = Math.min(1, edge / feather);
    const [r, g, b, a] = colorAt(v);
    image.data[i * 4] = r;
    image.data[i * 4 + 1] = g;
    image.data[i * 4 + 2] = b;
    image.data[i * 4 + 3] = Math.round(a * t * t * (3 - 2 * t) * fade(v));
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

// ---- Marching squares ------------------------------------------------------------

type EdgeId = string;
// Segment table: corners tl=8, tr=4, br=2, bl=1 (1 = at or above level).
// Edges: t(op), r(ight), b(ottom), l(eft). Saddles (5, 10) are resolved by the cell centre.
const TABLE: Record<number, Array<[string, string]>> = {
  1: [['l', 'b']],
  2: [['b', 'r']],
  3: [['l', 'r']],
  4: [['t', 'r']],
  6: [['t', 'b']],
  7: [['t', 'l']],
  8: [['t', 'l']],
  9: [['t', 'b']],
  11: [['t', 'r']],
  12: [['l', 'r']],
  13: [['r', 'b']],
  14: [['l', 'b']],
};

// Contour polylines of the lattice at `level`, as [lon, lat] paths (lightly smoothed).
export function isolines(lattice: Lattice, level: number): Array<Array<[number, number]>> {
  const { cols, rows, values } = lattice;
  const at = (r: number, c: number) => values[r * cols + c];
  const points = new Map<EdgeId, [number, number]>();
  const segments: Array<[EdgeId, EdgeId]> = [];

  const edgePoint = (r: number, c: number, side: string): EdgeId => {
    // Corners of the edge, in lattice indices.
    const [r0, c0, r1, c1] =
      side === 't' ? [r, c, r, c + 1] : side === 'b' ? [r + 1, c, r + 1, c + 1] : side === 'l' ? [r, c, r + 1, c] : [r, c + 1, r + 1, c + 1];
    const id = r0 === r1 ? `h${r0}_${c0}` : `v${r0}_${c0}`;
    if (!points.has(id)) {
      const a = at(r0, c0);
      const b = at(r1, c1);
      const t = Math.min(1, Math.max(0, (level - a) / (b - a || 1e-9)));
      points.set(id, [r0 + (r1 - r0) * t, c0 + (c1 - c0) * t]);
    }
    return id;
  };

  for (let r = 0; r < rows - 1; r += 1) {
    for (let c = 0; c < cols - 1; c += 1) {
      const tl = at(r, c);
      const tr = at(r, c + 1);
      const br = at(r + 1, c + 1);
      const bl = at(r + 1, c);
      if (Number.isNaN(tl) || Number.isNaN(tr) || Number.isNaN(br) || Number.isNaN(bl)) continue;
      const code = (tl >= level ? 8 : 0) | (tr >= level ? 4 : 0) | (br >= level ? 2 : 0) | (bl >= level ? 1 : 0);
      if (code === 0 || code === 15) continue;
      let pairs = TABLE[code];
      if (code === 5 || code === 10) {
        const centreAbove = (tl + tr + br + bl) / 4 >= level;
        pairs =
          code === 5
            ? centreAbove
              ? [['t', 'l'], ['r', 'b']]
              : [['t', 'r'], ['l', 'b']]
            : centreAbove
              ? [['t', 'r'], ['l', 'b']]
              : [['t', 'l'], ['r', 'b']];
      }
      for (const [a, b] of pairs) segments.push([edgePoint(r, c, a), edgePoint(r, c, b)]);
    }
  }

  // Chain segments into polylines through their shared edge points.
  const byEdge = new Map<EdgeId, number[]>();
  segments.forEach(([a, b], i) => {
    byEdge.set(a, [...(byEdge.get(a) ?? []), i]);
    byEdge.set(b, [...(byEdge.get(b) ?? []), i]);
  });
  const used = new Uint8Array(segments.length);
  const next = (edge: EdgeId): EdgeId | null => {
    const i = (byEdge.get(edge) ?? []).find((s) => !used[s]);
    if (i === undefined) return null;
    used[i] = 1;
    return segments[i][0] === edge ? segments[i][1] : segments[i][0];
  };

  const lines: Array<Array<[number, number]>> = [];
  segments.forEach(([a, b], i) => {
    if (used[i]) return;
    used[i] = 1;
    const chain: EdgeId[] = [a, b];
    for (let e = next(b); e; e = next(e)) chain.push(e);
    for (let e = next(a); e; e = next(e)) chain.unshift(e);
    if (chain.length < 3) return;
    const closed = chain[0] === chain[chain.length - 1];
    lines.push(smooth(chain.map((id) => points.get(id) as [number, number]), closed).map(([row, col]) => lattice.toLonLat(row, col)));
  });
  return lines;
}

// One pass of Chaikin corner cutting: removes the lattice facets.
function smooth(line: Array<[number, number]>, closed: boolean): Array<[number, number]> {
  if (line.length < 3) return line;
  const out: Array<[number, number]> = closed ? [] : [line[0]];
  const n = line.length - 1;
  for (let i = 0; i < n; i += 1) {
    const [a0, a1] = line[i];
    const [b0, b1] = line[i + 1];
    out.push([0.75 * a0 + 0.25 * b0, 0.75 * a1 + 0.25 * b1], [0.25 * a0 + 0.75 * b0, 0.25 * a1 + 0.75 * b1]);
  }
  if (closed) out.push(out[0]);
  else out.push(line[n]);
  return out;
}
