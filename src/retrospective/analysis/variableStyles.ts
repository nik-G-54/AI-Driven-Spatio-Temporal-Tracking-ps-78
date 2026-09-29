import {
  buildDivergingScale,
  buildExceedanceScale,
  buildSequentialScale,
  DIFFERENCE_SCALE,
  PRECIPITATION_SCALE,
  type ColorScale,
  type PaletteId,
} from '../map/colorScales';
import type { VariableAnalysis, VariableId } from './analysis.types';

export interface VariableStyle {
  // Field values (NWP / AI / reference).
  scale: ColorScale;
  // AI − NWP and other differences.
  diffScale: ColorScale;
  // Exceedance above the prototype threshold.
  anomalyScale: ColorScale;
}

const PALETTE: Record<VariableId, PaletteId> = {
  precipitation: 'precipitation',
  temperature: 'temperature',
  wind: 'wind',
  pressure: 'pressure',
};

export function styleFor(variable: VariableAnalysis): VariableStyle {
  const { meta, range, threshold, baseline } = variable;
  const maxDiff = Math.max(
    ...variable.evolution.map((e) => Math.abs(e.aiPeak - e.nwpPeak)),
    0.15 * (range.max - baseline),
  );
  // Case 01's precipitation (mm/6h) keeps the classed scales it was designed with.
  const isCase01Precipitation = meta.id === 'precipitation' && meta.unit === 'mm/6h';
  return {
    scale: isCase01Precipitation ? PRECIPITATION_SCALE : buildSequentialScale(PALETTE[meta.id], baseline, range.max, threshold),
    diffScale: isCase01Precipitation ? DIFFERENCE_SCALE : buildDivergingScale(maxDiff),
    anomalyScale: buildExceedanceScale(threshold, range.max),
  };
}
