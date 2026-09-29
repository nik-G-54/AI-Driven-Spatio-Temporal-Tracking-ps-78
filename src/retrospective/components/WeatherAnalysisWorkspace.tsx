import { lazy, Suspense, useMemo, useState } from 'react';
import type { SatelliteContext } from '../satellite/satellite.types';
import type { VariableId, WeatherAnalysis } from '../analysis/analysis.types';
import { createContextLayers } from '../analysis/contextSynth';
import { styleFor } from '../analysis/variableStyles';
import { MapSyncGroup } from '../map/mapSync';
import { useFieldData } from '../map/useFieldData';
import { segment } from './ui';
import AIRefinementPanel from './AIRefinementPanel';
import AnomalySummary from './AnomalySummary';
import BackendMappingPanel from './BackendMappingPanel';
import ForecastEvolution from './ForecastEvolution';
import ObservationalContext from './ObservationalContext';
import ValidationStrip from './ValidationStrip';
import WeatherLayerSelector, { type DataView, type DataViewOption } from './WeatherLayerSelector';

// MapLibre and the basemap geometry are large; load them only when a map is shown.
const WeatherMapPanel = lazy(() => import('./WeatherMapPanel'));
const ComparativeWeatherMaps = lazy(() => import('./ComparativeWeatherMaps'));
const DifferenceMap = lazy(() => import('./DifferenceMap'));

// One reusable analysis workspace for every event type. The selected variable,
// data view and time step decide what is drawn; the data arrives as a WeatherAnalysis
// (see analysis/analysis.adapter.ts). Everything shown is SIMULATED prototype output.
//
// NWP input → AI refined → difference → anomaly footprint → radar/satellite context,
// with a shared time step (the page's TimeStepSelector) and shared map camera.

interface WeatherAnalysisWorkspaceProps {
  analysis: WeatherAnalysis;
  frameIndex: number;
  onSelectFrame: (index: number) => void;
  // Retrospective case 01's simulated satellite alignment demo (null for other events).
  satellite: SatelliteContext | null;
}

export default function WeatherAnalysisWorkspace({ analysis, frameIndex, onSelectFrame, satellite }: WeatherAnalysisWorkspaceProps) {
  const [variableId, setVariableId] = useState<VariableId>(analysis.defaultVariable);
  const [layout, setLayout] = useState<'single' | 'comparison'>('single');
  const [view, setView] = useState<DataView>('nwp');
  const [contextChoice, setContextChoice] = useState<'satellite' | 'radar'>('satellite');
  const [opacity, setOpacity] = useState(0.85);
  // One camera shared by the comparison maps and the difference map.
  const [sync] = useState(() => new MapSyncGroup());

  const variable = analysis.variables.find((v) => v.meta.id === variableId) ?? analysis.variables[0];
  const fieldData = useFieldData({
    nwp: variable.nwp,
    ai: variable.ai,
    reference: variable.reference,
    anomaly: variable.anomaly,
    trajectory: variable.trajectory,
  });
  // Keep the initial camera when only the variable changes (no map recreation / flicker).
  const [initialFocus] = useState(() => fieldData.focus);
  const data = useMemo(() => ({ ...fieldData, focus: initialFocus }), [fieldData, initialFocus]);
  const style = useMemo(() => styleFor(variable), [variable]);
  const contexts = useMemo(() => createContextLayers(analysis), [analysis]);

  const step = Math.min(frameIndex, variable.evolution.length - 1);
  const point = variable.evolution[step];

  const views: DataViewOption[] = [
    { id: 'nwp', label: 'NWP' },
    { id: 'ai', label: 'AI REFINED' },
    ...(data.hasReference ? [{ id: 'reference' as const, label: 'REFERENCE' }] : []),
    { id: 'difference', label: 'DIFFERENCE' },
    { id: 'anomaly', label: 'ANOMALY' },
    { id: 'satellite', label: 'SATELLITE' },
    { id: 'radar', label: 'RADAR', disabled: !contexts.radar.available, hint: contexts.radar.unavailableReason },
  ];
  const context = contexts[contextChoice].available ? contexts[contextChoice] : contexts.satellite;

  const sidePanels = (
    <>
      <AIRefinementPanel variable={variable} point={point} />
      <AnomalySummary variable={variable} steps={analysis.steps} evolution={variable.evolution} frameIndex={step} />
    </>
  );
  const evolution = <ForecastEvolution variable={variable} steps={analysis.steps} evolution={variable.evolution} frameIndex={step} onSelectFrame={onSelectFrame} />;

  return (
    <div className="flex flex-col gap-3">
      <WeatherLayerSelector
        variables={analysis.variables.map((v) => v.meta.id)}
        variable={variable.meta.id}
        onVariable={setVariableId}
        layout={layout}
        onLayout={setLayout}
        views={views}
        view={view}
        onView={setView}
      />

      {layout === 'comparison' && !data.hasReference && (
        <div className="flex items-center gap-2 bg-[#0B1117] px-4 py-2 border border-[#1F2A36]" role="group" aria-label="Context layer">
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#7F8C9C] mr-1">Context panel</span>
          {(['satellite', 'radar'] as const).map((id) => (
            <button
              key={id}
              type="button"
              disabled={!contexts[id].available}
              title={contexts[id].unavailableReason}
              onClick={() => setContextChoice(id)}
              aria-pressed={contextChoice === id}
              className={segment(contextChoice === id, !contexts[id].available)}
            >
              {id === 'satellite' ? 'Satellite' : 'Radar'}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-[11px] text-[#B7C2CF]">
            Opacity
            <input className="accent-[#38BDF8]" type="range" min={0.2} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} aria-label="Context layer opacity" />
          </label>
        </div>
      )}

      {layout === 'single' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
          <div className="xl:col-span-8">
            <Suspense fallback={<Notice text="Loading map..." />}>
              <WeatherMapPanel analysis={analysis} variable={variable} data={data} style={style} frameIndex={step} view={view} contexts={contexts} opacity={opacity} onOpacity={setOpacity} />
            </Suspense>
          </div>
          <div className="xl:col-span-4 flex flex-col gap-3">
            {sidePanels}
            {evolution}
          </div>
        </div>
      ) : (
        <Suspense fallback={<Notice text="Loading maps..." />}>
          <ComparativeWeatherMaps analysis={analysis} variable={variable} data={data} style={style} frameIndex={step} sync={sync} context={context} contextOpacity={opacity} />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 items-start">
            <DifferenceMap analysis={analysis} variable={variable} data={data} style={style} frameIndex={step} sync={sync} />
            <div className="flex flex-col gap-3">{sidePanels}</div>
            {evolution}
          </div>
        </Suspense>
      )}

      {variable.validation && <ValidationStrip metrics={variable.validation} />}
      {variable.validation && satellite && <ObservationalContext context={satellite} data={data} frameIndex={step} sync={sync} />}

      <BackendMappingPanel event={analysis.event} fields={analysis.backendFields} facts={analysis.facts} />
    </div>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <div role="status" className="p-6 bg-[#0B1117] border border-[#1F2A36] font-mono text-[12px] text-[#8794A4]">
      {text}
    </div>
  );
}
