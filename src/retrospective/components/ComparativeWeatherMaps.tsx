import type { AnomalyData, DatasetKey } from '../retrospective.types';
import { DATASET_LABEL, formatLead, formatTimestamp, formatUnit, variableLabel } from '../retrospective.utils';
import { PRECIPITATION_SCALE } from '../map/colorScales';
import type { MapSyncGroup } from '../map/mapSync';
import type { FieldData } from '../map/useFieldData';
import FieldMap from './FieldMap';
import LegendBar from './LegendBar';
import MapPanel from './MapPanel';

// NWP | AI REFINED | REFERENCE at the same time step. The three maps share one
// viewport (pan/zoom any of them), one colour scale and one geographic extent.
// Each shows its own exceedance footprint outline and the centroid path of the
// evolving footprint (current step highlighted).

interface ComparativeWeatherMapsProps {
  data: FieldData;
  anomaly: AnomalyData | null;
  frameIndex: number;
  sync: MapSyncGroup;
}

const PANELS: Array<{ key: DatasetKey; title: string }> = [
  { key: 'nwp', title: 'NWP' },
  { key: 'ai', title: 'AI REFINED' },
  { key: 'reference', title: 'REFERENCE' },
];

export default function ComparativeWeatherMaps({ data, anomaly, frameIndex, sync }: ComparativeWeatherMapsProps) {
  const unit = formatUnit(data.unit);
  const step = data.frame('reference', frameIndex);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 bg-white px-4 py-3 rounded-md border border-[#E2E8F0]">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-headline-lg font-semibold text-[#0F172A]">{formatLead(step.leadTimeHours)}</span>
          <span className="font-mono text-[12px] text-[#475569]">{formatTimestamp(step.timestamp)}</span>
        </div>
        <span className="text-[11px] text-[#475569]">
          Same time step, viewport and colour scale on all three maps · pan or zoom any map to move them together
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {PANELS.map(({ key, title }) => {
          const frame = data.frame(key, frameIndex);
          const footprint = data.footprint(key, frameIndex);
          return (
            <MapPanel
              key={key}
              title={title}
              subtitle={`${DATASET_LABEL[key]} · simulated · ${frame.field.resolutionKm ?? '—'} km grid`}
              footer={
                <>
                  <strong className="font-mono">
                    Peak {data.peak(key, frameIndex)} {unit}
                  </strong>
                  {' · '}
                  {footprint
                    ? `footprint ${footprint.footprint.cellCount} cells, ${footprint.footprint.areaKm2} km²`
                    : 'no cell reaches the prototype threshold'}
                </>
              }
            >
              <FieldMap
                extent={data.extent}
                valueAt={data.valueAt(key, frameIndex)}
                scale={PRECIPITATION_SCALE}
                unit={unit}
                primaryOutline={footprint?.outline ?? null}
                path={data.path(key, frameIndex)}
                sync={sync}
                ariaLabel={`${title} map`}
                className="h-[340px]"
              />
            </MapPanel>
          );
        })}
      </div>

      <div className="bg-white px-4 py-3 rounded-md border border-[#E2E8F0]">
        <LegendBar
          title={variableLabel(data.variable)}
          unit={unit}
          scale={PRECIPITATION_SCALE}
          threshold={anomaly ? { value: anomaly.threshold.value, unit: formatUnit(anomaly.threshold.unit) } : null}
          outlines={[{ label: 'Exceedance footprint (cells ≥ threshold)' }]}
          pathNote="Centroid path T0 → T+24h (current step highlighted)"
          note="Field: continuous precipitation. Footprint: where the field reaches the prototype threshold. Cells are drawn at their native grid size."
        />
      </div>
    </div>
  );
}
