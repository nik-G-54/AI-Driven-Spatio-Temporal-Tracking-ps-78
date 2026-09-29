import { useMemo } from 'react';
import type { DatasetKey } from '../retrospective.types';
import { formatLead, formatTimestamp } from '../retrospective.utils';
import type { VariableAnalysis, WeatherAnalysis } from '../analysis/analysis.types';
import type { ContextLayer } from '../analysis/contextSynth';
import type { VariableStyle } from '../analysis/variableStyles';
import type { FieldData } from '../map/useFieldData';
import FieldMap from './FieldMap';
import MapLegend from './MapLegend';
import type { DataView } from './WeatherLayerSelector';
import { RIBBON, toMapRegions } from './weatherMapHelpers';

// One primary visualization at a time (the DATA VIEW): NWP · AI REFINED · REFERENCE ·
// DIFFERENCE · ANOMALY · SATELLITE · RADAR. The map lifecycle is FieldMap's; this
// component only chooses the sampler, colour scale, contours and overlays.

interface WeatherMapPanelProps {
  analysis: WeatherAnalysis;
  variable: VariableAnalysis;
  data: FieldData;
  style: VariableStyle;
  frameIndex: number;
  view: DataView;
  contexts: { satellite: ContextLayer; radar: ContextLayer };
  opacity: number;
  onOpacity: (opacity: number) => void;
}

// Bottom padding leaves room for the legend overlay.
const LEGEND_PADDING = { top: 56, bottom: 150, right: 70, left: 70 };

const DATASET_NAME: Record<DatasetKey, string> = { nwp: 'NWP', ai: 'AI refined', reference: 'Reference' };

export default function WeatherMapPanel({ analysis, variable, data, style, frameIndex, view, contexts, opacity, onOpacity }: WeatherMapPanelProps) {
  const isContext = view === 'satellite' || view === 'radar';
  const context = view === 'satellite' ? contexts.satellite : view === 'radar' ? contexts.radar : null;
  const unit = variable.meta.unit;

  const selection = useMemo(() => {
    const primaryKey: DatasetKey = view === 'nwp' ? 'nwp' : view === 'reference' ? 'reference' : 'ai';
    const secondaryKey: DatasetKey | null = view === 'difference' || view === 'anomaly' ? 'nwp' : null;
    if (view === 'difference') return { scale: style.diffScale, valueAt: data.differenceAt('ai', 'nwp', frameIndex), unit, title: 'AI refined − NWP', primaryKey, secondaryKey };
    if (view === 'anomaly') {
      const ai = data.valueAt('ai', frameIndex);
      const cut = variable.threshold;
      return { scale: style.anomalyScale, valueAt: (lat: number, lon: number) => { const v = ai(lat, lon); return v !== null && v >= cut ? v : null; }, unit, title: `${variable.meta.label} above prototype threshold`, primaryKey, secondaryKey };
    }
    if (context) return { scale: context.scale, valueAt: context.valueAt(frameIndex), unit: context.unit, title: context.label.replace(' — SIMULATED', ''), primaryKey, secondaryKey };
    return { scale: style.scale, valueAt: data.valueAt(primaryKey, frameIndex), unit, title: variable.meta.label, primaryKey, secondaryKey };
  }, [view, data, style, frameIndex, variable, context, unit]);

  const primary = data.footprint(selection.primaryKey, frameIndex);
  const secondary = selection.secondaryKey ? data.footprint(selection.secondaryKey, frameIndex) : null;
  const centroids = useMemo(
    () => [
      ...(primary ? [{ ...primary.footprint.centroid, role: 'primary' as const }] : []),
      ...(secondary ? [{ ...secondary.footprint.centroid, role: 'secondary' as const }] : []),
    ],
    [primary, secondary],
  );

  // Exceedance contours at the prototype threshold (smooth isolines of the datasets).
  const contours = useMemo(
    () => [
      { valueAt: data.valueAt(selection.primaryKey, frameIndex), level: variable.threshold, role: 'primary' as const },
      ...(selection.secondaryKey ? [{ valueAt: data.valueAt(selection.secondaryKey, frameIndex), level: variable.threshold, role: 'secondary' as const }] : []),
    ],
    [data, selection.primaryKey, selection.secondaryKey, frameIndex, variable.threshold],
  );

  // Anomaly view: strongest exceedance cells as graduated points.
  const anomalyPoints = useMemo(() => {
    if (view !== 'anomaly' || !primary) return [];
    const cells = [...primary.footprint.cells].sort((a, b) => b.value - a.value).slice(0, 90);
    const span = Math.max(primary.footprint.peak - variable.threshold, 1e-6);
    return cells.map((c) => ({ latitude: c.latitude, longitude: c.longitude, weight: Math.min(1, 0.25 + (0.75 * (c.value - variable.threshold)) / span) }));
  }, [view, primary, variable.threshold]);

  const regions = useMemo(() => toMapRegions(analysis), [analysis]);
  const pathKey: DatasetKey = view === 'nwp' ? 'nwp' : 'ai';
  const step = data.frame('ai', frameIndex);
  const isTrack = analysis.regions.some((r) => r.kind === 'cone');
  const pathLabel = isTrack ? 'System track · past solid, forecast dashed' : analysis.event.type === 'heatwave' ? 'Anomaly footprint evolution (centroid)' : 'Evolving footprint centroid';
  const peak = data.peak(selection.primaryKey, frameIndex);

  return (
    <section className="flex flex-col bg-[#0B1117] border border-[#1F2A36]" aria-label="Weather map">
      <div className="flex flex-wrap items-center justify-between gap-2 h-11 px-3 border-b border-[#1F2A36]">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="font-mono text-[12px] font-semibold tracking-[0.06em] text-[#E6EDF4] whitespace-nowrap">{RIBBON[view]}</h2>
          <span className="font-mono text-[11px] text-[#8794A4] whitespace-nowrap">
            {variable.meta.label} · {formatLead(step.leadTimeHours)} · {formatTimestamp(step.timestamp)}
          </span>
        </div>
        {isContext && (
          <label className="flex items-center gap-2 text-[11px] text-[#B7C2CF]">
            Opacity
            <input type="range" min={0.2} max={1} step={0.05} value={opacity} onChange={(e) => onOpacity(Number(e.target.value))} aria-label="Context layer opacity" className="accent-[#38BDF8]" />
            <span className="font-mono text-[11px] w-8">{Math.round(opacity * 100)}%</span>
          </label>
        )}
      </div>

      <FieldMap
        extent={data.extent}
        focus={data.focus}
        valueAt={selection.valueAt}
        scale={selection.scale}
        unit={selection.unit}
        contours={contours}
        centroids={centroids}
        path={data.path(pathKey, frameIndex)}
        regions={regions}
        anomalyPoints={anomalyPoints}
        opacity={isContext ? opacity : 0.92}
        padding={LEGEND_PADDING}
        ariaLabel={`${RIBBON[view]} map`}
        className="h-[620px] border-0"
      >
        <div className="absolute right-14 top-3 z-10 flex flex-col items-end gap-1 pointer-events-none">
          <div className="bg-[#05080C]/88 border border-[#2A3645] px-2.5 py-1.5 font-mono text-[10.5px] text-[#D9E1EA] flex gap-4">
            <span>
              <span className="text-[#7F8C9C]">{isContext ? 'LAYER' : 'PEAK'} </span>
              {isContext ? 'context' : `${Number(peak.toFixed(1))} ${unit}`}
            </span>
            <span>
              <span className="text-[#7F8C9C]">FOOTPRINT </span>
              {primary ? `${primary.footprint.areaKm2.toLocaleString('en-IN')} km²` : 'none'}
            </span>
            <span>
              <span className="text-[#7F8C9C]">THR </span>≥ {variable.threshold} {unit}
            </span>
          </div>
        </div>
        <MapLegend
          title={selection.title}
          unit={selection.unit}
          scale={selection.scale}
          threshold={{ value: variable.threshold, unit }}
          showFootprint
          footprintLabels={{
            primary: `${DATASET_NAME[selection.primaryKey]} exceedance contour`,
            secondary: selection.secondaryKey ? `${DATASET_NAME[selection.secondaryKey]} exceedance contour` : null,
          }}
          pathLabel={pathLabel}
        />
      </FieldMap>

      <div className="px-3 py-2 border-t border-[#1F2A36] text-[11px] leading-snug text-[#8794A4]">
        {isContext && context ? (
          <span className="text-[#E9CF8C]">{context.note}</span>
        ) : (
          <>
            Simulated field on a real geographic frame.{isTrack ? ' Dashed grey polygon: backend uncertainty cone.' : ''} Dotted orange: affected region. {variable.meta.description}.
          </>
        )}
      </div>
    </section>
  );
}
