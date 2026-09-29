// Discrete (classed) colour scales. Classes make it possible to read values
// against the prototype threshold, which a continuous ramp hides.

export type Rgba = [number, number, number, number];

export interface ColorClass {
  // Inclusive lower bound and exclusive upper bound (±Infinity at the ends).
  min: number;
  max: number;
  color: Rgba;
  label: string;
}

export interface ColorScale {
  kind: 'sequential' | 'diverging';
  classes: ColorClass[];
  colorAt: (value: number) => Rgba;
}

export function hex(color: string, alpha = 0.86): Rgba {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, Math.round(alpha * 255)];
}

export const TRANSPARENT: Rgba = [0, 0, 0, 0];

export function makeScale(kind: ColorScale['kind'], classes: ColorClass[]): ColorScale {
  return {
    kind,
    classes,
    colorAt: (value) => {
      for (const c of classes) {
        if (value >= c.min && value < c.max) return c.color;
      }
      return TRANSPARENT;
    },
  };
}

// Precipitation, mm/6h: cool blues for light rain, then purple → red above the
// 60 mm/6h break so the prototype threshold is visible as a colour change.
const PRECIP_BREAKS = [2, 5, 10, 20, 30, 45, 60, 80, 100, 120];
const PRECIP_COLORS = ['#D6EAF8', '#AED6F1', '#7FB8E8', '#4E93D9', '#3A6FC4', '#4B4FB0', '#7B3FA0', '#B02E8C', '#D6336C', '#F03E3E'];

export const PRECIPITATION_SCALE: ColorScale = makeScale('sequential', [
  { min: -Infinity, max: PRECIP_BREAKS[0], color: TRANSPARENT, label: `< ${PRECIP_BREAKS[0]}` },
  ...PRECIP_BREAKS.map((min, i) => ({
    min,
    max: PRECIP_BREAKS[i + 1] ?? Infinity,
    color: hex(PRECIP_COLORS[i]),
    label: PRECIP_BREAKS[i + 1] === undefined ? `≥ ${min}` : `${min}–${PRECIP_BREAKS[i + 1]}`,
  })),
]);

// Differences (A − B), same unit as the field. Blue: A lower than B; red: A higher.
const DIFF_BREAKS = [5, 10, 20, 40, 60];
const DIFF_NEG = ['#C6DBEF', '#9ECAE1', '#6BAED6', '#3182BD', '#08519C']; // small → large magnitude
const DIFF_POS = ['#FCBBA1', '#FC9272', '#FB6A4A', '#DE2D26', '#A50F15'];

export const DIFFERENCE_SCALE: ColorScale = makeScale('diverging', [
  ...DIFF_BREAKS.map((b, i) => ({
    min: i === DIFF_BREAKS.length - 1 ? -Infinity : -DIFF_BREAKS[i + 1],
    max: -b,
    color: hex(DIFF_NEG[i], 0.88),
    label: i === DIFF_BREAKS.length - 1 ? `≤ −${b}` : `−${DIFF_BREAKS[i + 1]}…−${b}`,
  })).reverse(),
  { min: -DIFF_BREAKS[0], max: DIFF_BREAKS[0], color: TRANSPARENT, label: `±${DIFF_BREAKS[0]}` },
  ...DIFF_BREAKS.map((b, i) => ({
    min: b,
    max: DIFF_BREAKS[i + 1] ?? Infinity,
    color: hex(DIFF_POS[i], 0.88),
    label: DIFF_BREAKS[i + 1] === undefined ? `≥ ${b}` : `${b}–${DIFF_BREAKS[i + 1]}`,
  })),
]);

export function rgbaCss(color: Rgba): string {
  return color[3] === 0 ? 'transparent' : `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
}

// Brightness temperature (K) for infrared context: cold cloud tops dark, warm
// surface transparent. Deliberately monochrome so it never competes with the
// precipitation colours.
const BT_BREAKS = [200, 220, 240, 260, 280];
const BT_COLORS = ['#0F172A', '#334155', '#64748B', '#94A3B8', '#CBD5E1'];

export const BRIGHTNESS_TEMPERATURE_SCALE: ColorScale = makeScale('sequential', [
  { min: -Infinity, max: BT_BREAKS[0], color: hex(BT_COLORS[0], 0.85), label: `< ${BT_BREAKS[0]}` },
  ...BT_BREAKS.slice(0, -1).map((min, i) => ({ min, max: BT_BREAKS[i + 1], color: hex(BT_COLORS[i + 1], 0.8), label: `${min}–${BT_BREAKS[i + 1]}` })),
  { min: BT_BREAKS[BT_BREAKS.length - 1], max: Infinity, color: TRANSPARENT, label: `≥ ${BT_BREAKS[BT_BREAKS.length - 1]}` },
]);

// ---- Scale factories (per-variable scales for the weather-analysis workspace) ----

export type PaletteId = 'precipitation' | 'temperature' | 'wind' | 'pressure' | 'exceedance' | 'radar' | 'hot-surface';

const PALETTES: Record<PaletteId, string[]> = {
  precipitation: ['#D6EAF8', '#AED6F1', '#7FB8E8', '#4E93D9', '#3A6FC4', '#4B4FB0', '#7B3FA0', '#B02E8C', '#D6336C', '#F03E3E'],
  temperature: ['#FFF3B0', '#FFE082', '#FFC107', '#FF9800', '#F57C00', '#E64A19', '#D32F2F', '#B71C1C', '#7F0000'],
  wind: ['#D5F0EA', '#A8E0D3', '#6FCFC0', '#3FB8A9', '#8BC34A', '#FFEB3B', '#FF9800', '#E53935', '#8E0038'],
  pressure: ['#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB', '#5C6BC0', '#3F51B5', '#303F9F', '#283593', '#1A237E'],
  exceedance: ['#FFE082', '#FFC107', '#FF9800', '#F4511E', '#D32F2F', '#7F0000'],
  radar: ['#04E9E7', '#019FF4', '#0300F4', '#02FD02', '#01C501', '#008E00', '#FDF802', '#E5BC00', '#FD9500', '#FD0000', '#D40000', '#BC0000', '#F800FD', '#9854C6'],
  'hot-surface': ['#FFF3B0', '#FFE082', '#FFC107', '#FF9800', '#F4511E', '#D32F2F'],
};

// The largest "nice" step (1, 2, 2.5, 5 × 10^n) not above `raw`, so the classes reach the data maximum.
function niceStep(raw: number): number {
  const exp = Math.floor(Math.log10(raw));
  const f = raw / 10 ** exp;
  const nice = f >= 5 ? 5 : f >= 2.5 ? 2.5 : f >= 2 ? 2 : 1;
  return nice * 10 ** exp;
}

const fmt = (v: number) => (Math.abs(v) >= 100 ? String(Math.round(v)) : String(Number(v.toFixed(1))));

// Classed sequential scale from `min` to `max` in palette-many classes. Values below the
// first break are transparent. If `threshold` is given it becomes a class break exactly, so
// the exceedance boundary is visible as a colour change.
export function buildSequentialScale(palette: PaletteId, min: number, max: number, threshold?: number, alpha = 0.86): ColorScale {
  const colors = PALETTES[palette];
  const step = niceStep((max - min) / colors.length);
  const start = Math.floor(min / step) * step;
  let breaks = colors.map((_, i) => Number((start + i * step).toFixed(6)));
  if (threshold !== undefined) {
    // Snap the nearest break to the threshold and keep the ramp monotonic.
    let nearest = 0;
    breaks.forEach((b, i) => {
      if (Math.abs(b - threshold) < Math.abs(breaks[nearest] - threshold)) nearest = i;
    });
    breaks = breaks.map((b, i) => (i === nearest ? threshold : b));
    breaks.sort((a, b) => a - b);
  }
  const classes: ColorClass[] = [
    { min: -Infinity, max: breaks[0], color: TRANSPARENT, label: `< ${fmt(breaks[0])}` },
    ...breaks.map((b, i) => ({
      min: b,
      max: breaks[i + 1] ?? Infinity,
      color: hex(colors[i], alpha),
      label: breaks[i + 1] === undefined ? `≥ ${fmt(b)}` : `${fmt(b)}–${fmt(breaks[i + 1])}`,
    })),
  ];
  return makeScale('sequential', classes);
}

// Diverging (A − B) scale with breaks at fractions of `maxAbs`.
export function buildDivergingScale(maxAbs: number): ColorScale {
  const step = niceStep(maxAbs / 12);
  const b = [1, 2, 4, 7, 10].map((k) => Number((k * step).toFixed(6)));
  const neg = ['#C6DBEF', '#9ECAE1', '#6BAED6', '#3182BD', '#08519C'];
  const pos = ['#FCBBA1', '#FC9272', '#FB6A4A', '#DE2D26', '#A50F15'];
  const classes: ColorClass[] = [
    ...b
      .map((v, i) => ({
        min: i === b.length - 1 ? -Infinity : -b[i + 1],
        max: -v,
        color: hex(neg[i], 0.88),
        label: i === b.length - 1 ? `≤ −${fmt(v)}` : `−${fmt(b[i + 1])}…−${fmt(v)}`,
      }))
      .reverse(),
    { min: -b[0], max: b[0], color: TRANSPARENT, label: `±${fmt(b[0])}` },
    ...b.map((v, i) => ({
      min: v,
      max: b[i + 1] ?? Infinity,
      color: hex(pos[i], 0.88),
      label: b[i + 1] === undefined ? `≥ ${fmt(v)}` : `${fmt(v)}–${fmt(b[i + 1])}`,
    })),
  ];
  return makeScale('diverging', classes);
}

// Exceedance above a threshold: classes are fractions of (peak − threshold).
export function buildExceedanceScale(threshold: number, peak: number): ColorScale {
  const colors = PALETTES.exceedance;
  const span = Math.max(peak - threshold, 1e-6);
  const breaks = colors.map((_, i) => Number((threshold + (span * i) / colors.length).toFixed(6)));
  const classes: ColorClass[] = [
    { min: -Infinity, max: threshold, color: TRANSPARENT, label: `< ${fmt(threshold)}` },
    ...breaks.map((b, i) => ({
      min: b,
      max: breaks[i + 1] ?? Infinity,
      color: hex(colors[i], 0.9),
      label: breaks[i + 1] === undefined ? `≥ ${fmt(b)}` : `${fmt(b)}–${fmt(breaks[i + 1])}`,
    })),
  ];
  return makeScale('sequential', classes);
}

// Simulated radar reflectivity (dBZ), standard-looking 5 dBZ ramp from 10 dBZ.
export const RADAR_SCALE: ColorScale = (() => {
  const colors = PALETTES.radar;
  const breaks = colors.map((_, i) => 10 + i * 4);
  const classes: ColorClass[] = [
    { min: -Infinity, max: breaks[0], color: TRANSPARENT, label: '< 10' },
    ...breaks.map((b, i) => ({
      min: b,
      max: breaks[i + 1] ?? Infinity,
      color: hex(colors[i], 0.92),
      label: breaks[i + 1] === undefined ? `≥ ${b}` : `${b}–${breaks[i + 1]}`,
    })),
  ];
  return makeScale('sequential', classes);
})();

// Clear-sky infrared brightness temperature (hot land surface), K.
export const HOT_SURFACE_BT_SCALE: ColorScale = buildSequentialScale('hot-surface', 292, 310);

// ---- Continuous rendering of a classed scale ----------------------------------
// The map draws fields as a smooth ramp through the class colours (the class
// breaks stay visible as contour lines); the legend uses the same function.

interface Stop {
  value: number;
  color: Rgba;
}

function classStops(scale: ColorScale): Stop[] {
  const widths = scale.classes.filter((c) => Number.isFinite(c.min) && Number.isFinite(c.max)).map((c) => c.max - c.min);
  const w = widths.length ? widths.sort((a, b) => a - b)[Math.floor(widths.length / 2)] : 1;
  const stops: Stop[] = scale.classes.map((c) => {
    const clear = c.color[3] === 0;
    let value: number;
    if (clear) value = Number.isFinite(c.min) && Number.isFinite(c.max) ? (c.min + c.max) / 2 : Number.isFinite(c.min) ? c.min + w / 2 : c.max - w / 2;
    else if (scale.kind === 'diverging' && c.max <= 0) value = c.max;
    else value = Number.isFinite(c.min) ? c.min : c.max - w;
    return { value, color: c.color };
  });
  stops.sort((a, b) => a.value - b.value);
  // Opacity grows mildly with distance (in classes) from the transparent class, so the
  // extreme core is the most opaque. (Background suppression is done per field by the map.)
  const clearIdx = stops.flatMap((s, i) => (s.color[3] === 0 ? [i] : []));
  const dist = stops.map((_, i) => (clearIdx.length ? Math.min(...clearIdx.map((c) => Math.abs(c - i))) : 0));
  const maxDist = Math.max(1, ...dist);
  // Transparent stops borrow the RGB of the nearest coloured stop (no dark fringes).
  return stops.map((s, i) => {
    if (s.color[3] !== 0) {
      const k = clearIdx.length ? 0.6 + (0.4 * (dist[i] - 1)) / Math.max(1, maxDist - 1) : 1;
      return { value: s.value, color: [s.color[0], s.color[1], s.color[2], Math.round(s.color[3] * k)] };
    }
    const near = [...stops.slice(i + 1), ...stops.slice(0, i).reverse()].find((o) => o.color[3] !== 0);
    return near ? { value: s.value, color: [near.color[0], near.color[1], near.color[2], 0] } : s;
  });
}

export interface ContinuousScale {
  colorAt: (value: number) => Rgba;
  min: number;
  max: number;
  // Class breaks inside [min, max], for contour levels and legend ticks.
  breaks: number[];
}

const continuousCache = new WeakMap<ColorScale, ContinuousScale>();

export function continuous(scale: ColorScale): ContinuousScale {
  const cached = continuousCache.get(scale);
  if (cached) return cached;
  const stops = classStops(scale);
  const colorAt = (value: number): Rgba => {
    if (value <= stops[0].value) return stops[0].color;
    for (let i = 1; i < stops.length; i += 1) {
      const b = stops[i];
      if (value <= b.value) {
        const a = stops[i - 1];
        const t = (value - a.value) / (b.value - a.value || 1);
        return [
          Math.round(a.color[0] + (b.color[0] - a.color[0]) * t),
          Math.round(a.color[1] + (b.color[1] - a.color[1]) * t),
          Math.round(a.color[2] + (b.color[2] - a.color[2]) * t),
          Math.round(a.color[3] + (b.color[3] - a.color[3]) * t),
        ];
      }
    }
    return stops[stops.length - 1].color;
  };
  const min = stops[0].value;
  const max = stops[stops.length - 1].value;
  const breaks = [...new Set(scale.classes.flatMap((c) => [c.min, c.max]).filter((v) => Number.isFinite(v) && v >= min && v <= max))].sort((a, b) => a - b);
  const result = { colorAt, min, max, breaks };
  continuousCache.set(scale, result);
  return result;
}

// Legend ticks at the class breaks (position in % of the ramp), thinned to at most `max` labels.
export function legendTicks(scale: ColorScale, max = 6): Array<{ value: number; at: number }> {
  const { min, max: hi, breaks } = continuous(scale);
  const every = Math.max(1, Math.ceil(breaks.length / max));
  return breaks.filter((_, i) => i % every === 0).map((value) => ({ value, at: ((value - min) / (hi - min || 1)) * 100 }));
}

// Position of a value on the legend ramp (%), or null outside it.
export function thresholdAt(scale: ColorScale, value: number): number | null {
  const { min, max } = continuous(scale);
  if (value < min || value > max) return null;
  return ((value - min) / (max - min || 1)) * 100;
}

// CSS gradient of the continuous ramp from min to max (legend bar).
export function gradientCss(scale: ColorScale): string {
  const { colorAt, min, max } = continuous(scale);
  const parts: string[] = [];
  for (let i = 0; i <= 32; i += 1) {
    const c = colorAt(min + ((max - min) * i) / 32);
    parts.push(`rgba(${c[0]},${c[1]},${c[2]},${Math.max(c[3], 0) / 255}) ${((i / 32) * 100).toFixed(1)}%`);
  }
  return `linear-gradient(90deg, ${parts.join(', ')})`;
}
