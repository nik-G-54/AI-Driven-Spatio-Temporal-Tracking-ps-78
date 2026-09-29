import { useMemo, useState } from 'react';
import type { AnomalyData, DatasetKey } from '../retrospective.types';
import {
  classNames,
  DATASET_LABEL,
  DIFF_PAIRS,
  formatLead,
  formatTimestamp,
  formatUnit,
  variableLabel,
  type DiffPairId,
} from '../retrospective.utils';
import { DIFFERENCE_SCALE, PRECIPITATION_SCALE } from '../map/colorScales';
import type { FieldData } from '../map/useFieldData';
import FieldMap from './FieldMap';
import MapLegend from './MapLegend';

// Single-field analytical map: one field at a time, switchable between NWP,
// AI REFINED, REFERENCE and DIFFERENCE. The time step comes from the page's
// TimeStepSelector (`frameIndex`); data arrives through props only.

interface AnalyticalWeatherMapProps {
  data: FieldData;
  frameIndex: number;
  anomaly: AnomalyData | null;
}

type Mode = DatasetKey | 'difference';

const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'nwp', label: 'NWP' },
  { id: 'ai', label: 'AI REFINED' },
  { id: 'reference', label: 'REFERENCE' },
  { id: 'difference', label: 'DIFFERENCE' },
];

// Left padding leaves room for the legend overlay.
const LEGEND_PADDING = { top: 40, bottom: 40, right: 60, left: 260 };

export default function AnalyticalWeatherMap({ data, frameIndex, anomaly }: AnalyticalWeatherMapProps) {
  const [mode, setMode] = useState<Mode>('nwp');
  const [diffPair, setDiffPair] = useState<DiffPairId>('ai-nwp');
  const [showFootprint, setShowFootprint] = useState(true);

  const selection = useMemo(() => {
    if (mode === 'difference') {
      const { a, b, label } = DIFF_PAIRS[diffPair];
      return {
        title: label,
        scale: DIFFERENCE_SCALE,
        valueAt: data.differenceAt(a, b, frameIndex),
        primary: a,
        secondary: b as DatasetKey | null,
      };
    }
    return {
      title: variableLabel(data.variable),
      scale: PRECIPITATION_SCALE,
      valueAt: data.valueAt(mode, frameIndex),
      primary: mode,
      secondary: null as DatasetKey | null,
    };
  }, [mode, diffPair, frameIndex, data]);

  const primary = showFootprint ? data.footprint(selection.primary, frameIndex) : null;
  const secondary = showFootprint && selection.secondary ? data.footprint(selection.secondary, frameIndex) : null;
  const centroids = useMemo(
    () => [
      ...(primary ? [{ ...primary.footprint.centroid, role: 'primary' as const }] : []),
      ...(secondary ? [{ ...secondary.footprint.centroid, role: 'secondary' as const }] : []),
    ],
    [primary, secondary],
  );

  const unit = formatUnit(data.unit);
  const step = data.frame('reference', frameIndex);
  const describe = mode === 'difference' ? DIFF_PAIRS[diffPair].label : DATASET_LABEL[mode];

  // Note absent footprints in the legend so an empty overlay is not mistaken for a bug.
  const footprintLabel = (key: DatasetKey) =>
    `${DATASET_LABEL[key]} footprint${data.footprint(key, frameIndex) ? '' : ' (none at this step)'}`;

  return (
    <section className="flex flex-col gap-3 bg-white p-5 rounded-lg shadow-sm" aria-label="Spatial field analysis map">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-headline-sm text-[#0F172A] font-bold">Spatial field analysis map</h2>
          <div className="text-label-sm text-[#475569]">
            {describe} (simulated) · {formatLead(step.leadTimeHours)} · {formatTimestamp(step.timestamp)}
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-[#A16207] font-semibold uppercase">Prototype simulation</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {MODES.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setMode(option.id)}
            aria-pressed={mode === option.id}
            className={classNames(
              'px-3 py-1.5 rounded text-label-md transition-colors',
              mode === option.id ? 'bg-black text-white font-semibold' : 'bg-[#EFF4FF] text-[#475569] hover:bg-[#E5EEFF] hover:text-[#0F172A]',
            )}
          >
            {option.label}
          </button>
        ))}

        {mode === 'difference' && (
          <select
            value={diffPair}
            onChange={(event) => setDiffPair(event.target.value as DiffPairId)}
            aria-label="Difference pair"
            className="h-8 pl-2 pr-6 rounded bg-[#EFF4FF] text-[#0F172A] text-label-md focus:outline-none focus:ring-1 focus:ring-black"
          >
            {Object.entries(DIFF_PAIRS).map(([id, pair]) => (
              <option key={id} value={id}>
                {pair.label}
              </option>
            ))}
          </select>
        )}

        <label className="ml-auto flex items-center gap-2 text-label-md text-[#475569] cursor-pointer select-none">
          <input type="checkbox" checked={showFootprint} onChange={(event) => setShowFootprint(event.target.checked)} />
          Footprint (prototype threshold)
        </label>
      </div>

      <FieldMap
        extent={data.extent}
        valueAt={selection.valueAt}
        scale={selection.scale}
        unit={unit}
        primaryOutline={primary?.outline ?? null}
        secondaryOutline={secondary?.outline ?? null}
        centroids={centroids}
        padding={LEGEND_PADDING}
        ariaLabel={`${describe} map`}
        className="h-[560px]"
      >
        <MapLegend
          title={selection.title}
          unit={unit}
          scale={selection.scale}
          threshold={anomaly ? { value: anomaly.threshold.value, unit: formatUnit(anomaly.threshold.unit) } : null}
          showFootprint={showFootprint}
          footprintLabels={{
            primary: footprintLabel(selection.primary),
            secondary: selection.secondary ? footprintLabel(selection.secondary) : null,
          }}
        />
      </FieldMap>

      <div className="text-label-sm text-[#64748B]">
        Simulated data on a real geographic frame. Land: Natural Earth (public domain).{' '}
        {mode === 'difference'
          ? 'Differences are computed pixel by pixel with each grid bilinearly interpolated to the same location.'
          : 'Cells are drawn at their native grid size (NWP ≈ 0.125°, AI and reference ≈ 0.05°).'}
      </div>
    </section>
  );
}
