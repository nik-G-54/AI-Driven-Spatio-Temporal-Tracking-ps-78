import { useState } from 'react';
import type { AnomalyData } from '../retrospective.types';
import { DATASET_LABEL, DIFF_PAIRS, formatUnit, type DiffPairId } from '../retrospective.utils';
import { DIFFERENCE_SCALE } from '../map/colorScales';
import type { MapSyncGroup } from '../map/mapSync';
import type { FieldData } from '../map/useFieldData';
import FieldMap from './FieldMap';
import LegendBar from './LegendBar';
import MapPanel from './MapPanel';

// Where does the simulated AI refinement differ from the NWP field? Default
// AI refined − NWP; AI − Reference and NWP − Reference are secondary options.
// Shares the viewport of the comparison maps.

interface DifferenceMapProps {
  data: FieldData;
  anomaly: AnomalyData | null;
  frameIndex: number;
  sync: MapSyncGroup;
}

export default function DifferenceMap({ data, anomaly, frameIndex, sync }: DifferenceMapProps) {
  const [pair, setPair] = useState<DiffPairId>('ai-nwp');
  const { a, b, label } = DIFF_PAIRS[pair];
  const unit = formatUnit(data.unit);
  const footprintA = data.footprint(a, frameIndex);
  const footprintB = data.footprint(b, frameIndex);

  return (
    <MapPanel
      title="DIFFERENCE"
      subtitle={`${label} · ${unit} · simulated`}
      controls={
        <select
          value={pair}
          onChange={(event) => setPair(event.target.value as DiffPairId)}
          aria-label="Difference pair"
          className="h-7 pl-1.5 pr-5 rounded bg-[#EFF4FF] text-[#0F172A] text-[11px] focus:outline-none focus:ring-1 focus:ring-black"
        >
          {Object.entries(DIFF_PAIRS).map(([id, p]) => (
            <option key={id} value={id}>
              {p.label}
            </option>
          ))}
        </select>
      }
      footer={
        <>
          Red: <strong>{DATASET_LABEL[a]}</strong> is higher than <strong>{DATASET_LABEL[b]}</strong>; blue: lower. Outlines:
          solid = {DATASET_LABEL[a]} footprint{footprintA ? '' : ' (none at this step)'}, dashed = {DATASET_LABEL[b]} footprint
          {footprintB ? '' : ' (none at this step)'}.{' '}
          {anomaly && `Prototype threshold ≥ ${anomaly.threshold.value} ${formatUnit(anomaly.threshold.unit)}, not an official IMD threshold.`}
        </>
      }
    >
      <FieldMap
        extent={data.extent}
        valueAt={data.differenceAt(a, b, frameIndex)}
        scale={DIFFERENCE_SCALE}
        unit={unit}
        primaryOutline={footprintA?.outline ?? null}
        secondaryOutline={footprintB?.outline ?? null}
        sync={sync}
        ariaLabel={`${label} difference map`}
        className="h-[340px]"
      />
      <LegendBar title={label} unit={unit} scale={DIFFERENCE_SCALE} />
    </MapPanel>
  );
}
