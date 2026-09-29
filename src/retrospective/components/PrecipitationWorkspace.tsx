import { lazy, Suspense, useState } from 'react';
import type { RetrospectiveCase } from '../retrospective.types';
import { classNames } from '../retrospective.utils';
import { MapSyncGroup } from '../map/mapSync';
import { useFieldData } from '../map/useFieldData';
import TemporalEvolution from './TemporalEvolution';
import ValidationPanel from './ValidationPanel';
import ValidationStrip from './ValidationStrip';

// MapLibre and the basemap geometry are large; load them only when a map is shown.
const ComparativeWeatherMaps = lazy(() => import('./ComparativeWeatherMaps'));
const DifferenceMap = lazy(() => import('./DifferenceMap'));
const AnalyticalWeatherMap = lazy(() => import('./AnalyticalWeatherMap'));

// Geospatial validation view for the extreme-precipitation case:
//   NWP | AI refined | Reference  →  difference + footprint evolution  →  metrics.
// The time step is the page's shared TimeStepSelector state (`frameIndex`).

interface PrecipitationWorkspaceProps {
  data: RetrospectiveCase;
  frameIndex: number;
  onSelectFrame: (index: number) => void;
}

type View = 'comparison' | 'single';

const VIEWS: Array<{ id: View; label: string }> = [
  { id: 'comparison', label: 'Comparison' },
  { id: 'single', label: 'Single field' },
];

export default function PrecipitationWorkspace({ data, frameIndex, onSelectFrame }: PrecipitationWorkspaceProps) {
  const [view, setView] = useState<View>('comparison');
  // One camera shared by the comparison maps and the difference map.
  const [sync] = useState(() => new MapSyncGroup());
  const fieldData = useFieldData({
    nwp: data.nwp,
    ai: data.ai,
    reference: data.reference,
    anomaly: data.anomaly,
    trajectory: data.trajectory,
  });

  const evolution = data.anomaly && (
    <TemporalEvolution anomaly={data.anomaly} trajectory={data.trajectory} frameIndex={frameIndex} onSelectFrame={onSelectFrame} />
  );

  return (
    <>
      <div className="flex items-center gap-2" role="group" aria-label="Map view">
        <span className="text-label-sm text-[#64748B] tracking-wider uppercase mr-1">View</span>
        {VIEWS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setView(option.id)}
            aria-pressed={view === option.id}
            className={classNames(
              'px-3 py-1.5 rounded text-label-md transition-colors',
              view === option.id ? 'bg-black text-white font-semibold' : 'bg-[#EFF4FF] text-[#475569] hover:bg-[#E5EEFF] hover:text-[#0F172A]',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {view === 'comparison' ? (
        <Suspense fallback={<Notice text="Loading maps..." />}>
          <ComparativeWeatherMaps data={fieldData} anomaly={data.anomaly} frameIndex={frameIndex} sync={sync} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch">
            <DifferenceMap data={fieldData} anomaly={data.anomaly} frameIndex={frameIndex} sync={sync} />
            <div className="lg:col-span-2">{evolution}</div>
          </div>
        </Suspense>
      ) : (
        <>
          <Suspense fallback={<Notice text="Loading map..." />}>
            <AnalyticalWeatherMap data={fieldData} frameIndex={frameIndex} anomaly={data.anomaly} />
          </Suspense>
          {evolution}
        </>
      )}

      <ValidationStrip metrics={data.validation} />

      <details className="bg-white rounded-md border border-[#E2E8F0] group">
        <summary className="cursor-pointer select-none px-4 py-3 text-body-sm font-semibold text-[#0F172A]">
          Detailed simulated metrics and event detection
        </summary>
        <div className="px-2 pb-2">
          <ValidationPanel metrics={data.validation} detection={data.detection} />
        </div>
      </details>
    </>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <div role="status" className="p-6 rounded-md bg-white border border-[#E2E8F0] text-[#475569] text-body-md">
      {text}
    </div>
  );
}
