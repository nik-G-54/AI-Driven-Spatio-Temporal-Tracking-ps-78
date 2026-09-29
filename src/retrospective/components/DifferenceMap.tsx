import { useMemo, useState } from 'react';
import { DATASET_LABEL, DIFF_PAIRS, type DiffPairId } from '../retrospective.utils';
import type { VariableAnalysis, WeatherAnalysis } from '../analysis/analysis.types';
import type { VariableStyle } from '../analysis/variableStyles';
import type { MapSyncGroup } from '../map/mapSync';
import type { FieldData } from '../map/useFieldData';
import FieldMap from './FieldMap';
import LegendBar from './LegendBar';
import MapPanel from './MapPanel';
import { toMapRegions } from './weatherMapHelpers';

// Where does the simulated AI refinement differ from the NWP input? Default
// AI refined − NWP. AI − Reference and NWP − Reference exist only when the analysis has a
// (simulated) reference. Shares the viewport of the comparison maps.

interface DifferenceMapProps {
  analysis: WeatherAnalysis;
  variable: VariableAnalysis;
  data: FieldData;
  style: VariableStyle;
  frameIndex: number;
  sync: MapSyncGroup;
}

export default function DifferenceMap({ analysis, variable, data, style, frameIndex, sync }: DifferenceMapProps) {
  const [pair, setPair] = useState<DiffPairId>('ai-nwp');
  const pairs = (Object.entries(DIFF_PAIRS) as Array<[DiffPairId, (typeof DIFF_PAIRS)[DiffPairId]]>).filter(
    ([, p]) => data.hasReference || (p.a !== 'reference' && p.b !== 'reference'),
  );
  const { a, b, label } = DIFF_PAIRS[pair];
  const unit = variable.meta.unit;
  const footprintA = data.footprint(a, frameIndex);
  const footprintB = data.footprint(b, frameIndex);
  const regions = useMemo(() => toMapRegions(analysis), [analysis]);
  const contours = useMemo(
    () => [
      { valueAt: data.valueAt(a, frameIndex), level: variable.threshold, role: 'primary' as const },
      { valueAt: data.valueAt(b, frameIndex), level: variable.threshold, role: 'secondary' as const },
    ],
    [data, a, b, frameIndex, variable.threshold],
  );

  return (
    <MapPanel
      title="DIFFERENCE — SIMULATED"
      subtitle={`${label} · ${unit}`}
      controls={
        pairs.length > 1 ? (
          <select
            value={pair}
            onChange={(event) => setPair(event.target.value as DiffPairId)}
            aria-label="Difference pair"
            className="h-7 pl-1.5 pr-5 bg-[#0F151C] border border-[#2B3846] text-[#D9E1EA] text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
          >
            {pairs.map(([id, p]) => (
              <option key={id} value={id}>
                {p.label}
              </option>
            ))}
          </select>
        ) : undefined
      }
      footer={
        <>
          Red: <strong className="text-[#E6EDF4]">{DATASET_LABEL[a]}</strong> is higher than <strong className="text-[#E6EDF4]">{DATASET_LABEL[b]}</strong>; blue: lower. Amber
          contour = {DATASET_LABEL[a]} ≥ threshold{footprintA ? '' : ' (none at this step)'}, dashed = {DATASET_LABEL[b]}{footprintB ? '' : ' (none at this step)'}. Prototype
          threshold ≥ {variable.threshold} {unit}, not an official threshold.
        </>
      }
    >
      <FieldMap
        extent={data.extent}
        focus={data.focus}
        valueAt={data.differenceAt(a, b, frameIndex)}
        scale={style.diffScale}
        unit={unit}
        contours={contours}
        regions={regions}
        opacity={0.92}
        sync={sync}
        ariaLabel={`${label} difference map`}
        className="h-[420px] border-0"
      />
      <div className="px-3 pt-2.5">
        <LegendBar title={label} unit={unit} scale={style.diffScale} />
      </div>
    </MapPanel>
  );
}
