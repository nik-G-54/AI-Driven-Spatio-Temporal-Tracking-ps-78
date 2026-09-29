import { useMemo } from 'react';
import type { DatasetKey } from '../retrospective.types';
import { formatLead, formatTimestamp } from '../retrospective.utils';
import type { VariableAnalysis, WeatherAnalysis } from '../analysis/analysis.types';
import type { ContextLayer } from '../analysis/contextSynth';
import type { VariableStyle } from '../analysis/variableStyles';
import type { MapSyncGroup } from '../map/mapSync';
import type { FieldData } from '../map/useFieldData';
import FieldMap from './FieldMap';
import LegendBar from './LegendBar';
import MapPanel from './MapPanel';
import { toMapRegions } from './weatherMapHelpers';

// INPUT | AI REFINED | REFERENCE-or-CONTEXT at the same time step. When the analysis has
// no separate reference (every event except retrospective case 01) the third panel is the
// selected SIMULATED context layer (satellite or radar) — never an invented "ground truth".
// The maps share one viewport, one colour scale and one geographic extent.

interface ComparativeWeatherMapsProps {
  analysis: WeatherAnalysis;
  variable: VariableAnalysis;
  data: FieldData;
  style: VariableStyle;
  frameIndex: number;
  sync: MapSyncGroup;
  context: ContextLayer;
  contextOpacity: number;
}

export default function ComparativeWeatherMaps({ analysis, variable, data, style, frameIndex, sync, context, contextOpacity }: ComparativeWeatherMapsProps) {
  const unit = variable.meta.unit;
  const step = data.frame('ai', frameIndex);
  const regions = useMemo(() => toMapRegions(analysis), [analysis]);
  const hasReference = data.hasReference;
  const thirdKey: DatasetKey = 'reference';

  const panels: Array<{ key: DatasetKey | 'context'; title: string; subtitle: string }> = [
    { key: 'nwp', title: hasReference ? 'NWP' : 'INPUT', subtitle: `NWP input · simulated · ${data.frame('nwp', frameIndex).field.resolutionKm ?? '—'} km grid` },
    { key: 'ai', title: 'AI REFINED — SIMULATED', subtitle: `AI output · simulated · ${data.frame('ai', frameIndex).field.resolutionKm ?? '—'} km grid` },
    hasReference
      ? { key: thirdKey, title: 'REFERENCE — SIMULATED', subtitle: 'Simulated reference field' }
      : { key: 'context', title: 'CONTEXT', subtitle: context.label },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 bg-[#0B1117] px-4 py-2.5 border border-[#1F2A36]">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[20px] font-semibold text-[#E6EDF4]">{formatLead(step.leadTimeHours)}</span>
          <span className="font-mono text-[11.5px] text-[#8794A4]">{formatTimestamp(step.timestamp)}</span>
        </div>
        <span className="text-[11px] text-[#8794A4]">Synchronised: same time step, camera and colour scale on every map · pan or zoom any map</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {panels.map(({ key, title, subtitle }) => {
          const isContext = key === 'context';
          const dataKey: DatasetKey = isContext ? 'ai' : key;
          const footprint = data.footprint(dataKey, frameIndex);
          const showPath = key === 'nwp' || key === 'ai';
          const contour = [{ valueAt: data.valueAt(dataKey, frameIndex), level: variable.threshold, role: 'primary' as const }];
          return (
            <MapPanel
              key={key}
              title={title}
              subtitle={subtitle}
              footer={
                isContext ? (
                  <>{context.available ? <span className="text-[#E9CF8C]">{context.note}</span> : <span className="text-[#E9CF8C]">{context.unavailableReason}</span>}</>
                ) : (
                  <>
                    <strong className="font-mono text-[#E6EDF4]">
                      Peak {Number(data.peak(dataKey, frameIndex).toFixed(1))} {unit}
                    </strong>
                    {' · '}
                    {footprint ? `footprint ${footprint.footprint.cellCount} cells, ${footprint.footprint.areaKm2} km²` : 'no cell reaches the prototype threshold'}
                  </>
                )
              }
            >
              <FieldMap
                extent={data.extent}
                focus={data.focus}
                valueAt={isContext ? context.valueAt(frameIndex) : data.valueAt(dataKey, frameIndex)}
                scale={isContext ? context.scale : style.scale}
                unit={isContext ? context.unit : unit}
                contours={contour}
                path={showPath ? data.path(key as DatasetKey, frameIndex) : null}
                regions={regions}
                opacity={isContext ? contextOpacity : 0.92}
                sync={sync}
                ariaLabel={`${title} map`}
                className="h-[420px] border-0"
              />
            </MapPanel>
          );
        })}
      </div>

      <div className="bg-[#0B1117] px-4 py-3 border border-[#1F2A36] flex flex-col gap-3">
        <LegendBar
          title={variable.meta.label}
          unit={unit}
          scale={style.scale}
          threshold={{ value: variable.threshold, unit }}
          outlines={[{ label: 'Exceedance contour at the prototype threshold' }]}
          pathNote={analysis.regions.some((r) => r.kind === 'cone') ? 'System track (current step highlighted)' : 'Centroid path (current step highlighted)'}
          note={`${variable.meta.description}. Fields are interpolated between grid cells; thin lines are isolines at the class breaks.`}
        />
        {!hasReference && context.available && <LegendBar title={context.label} unit={context.unit} scale={context.scale} />}
      </div>
    </div>
  );
}
