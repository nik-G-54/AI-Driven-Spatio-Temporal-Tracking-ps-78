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

function hex(color: string, alpha = 0.86): Rgba {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, Math.round(alpha * 255)];
}

const TRANSPARENT: Rgba = [0, 0, 0, 0];

function makeScale(kind: ColorScale['kind'], classes: ColorClass[]): ColorScale {
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
