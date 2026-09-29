import type { AnomalyData, DatasetKey, TrajectoryData } from '../retrospective.types';
import { classNames, DATASET_LABEL, formatLead, formatUnit } from '../retrospective.utils';

// How the extreme-precipitation footprint changes over the time steps, per
// dataset. A precipitation band is not a cyclone, so movement is shown as the
// path of the evolving-footprint centroid (drawn on the maps), not a storm
// track. Clicking a column sets the page's shared time step; there is no
// separate time selector.

interface TemporalEvolutionProps {
  anomaly: AnomalyData;
  trajectory: TrajectoryData | null;
  frameIndex: number;
  onSelectFrame: (index: number) => void;
}

const KEYS: DatasetKey[] = ['nwp', 'ai', 'reference'];

export default function TemporalEvolution({ anomaly, trajectory, frameIndex, onSelectFrame }: TemporalEvolutionProps) {
  const steps = anomaly.frames.reference;
  const unit = formatUnit(anomaly.unit);
  const maxArea = Math.max(1, ...KEYS.flatMap((k) => anomaly.frames[k].map((f) => f.footprint?.areaKm2 ?? 0)));

  return (
    <section className="flex flex-col gap-3 bg-white p-3 rounded-md border border-[#E2E8F0] h-full" aria-label="Footprint evolution">
      <div>
        <h3 className="text-body-sm font-bold text-[#0F172A] tracking-wide">FOOTPRINT EVOLUTION</h3>
        <div className="text-[11px] text-[#475569]">
          Exceedance footprint area per time step · prototype threshold ≥ {anomaly.threshold.value} {unit} (not an official IMD
          threshold) · simulated
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px] border-separate border-spacing-x-1 border-spacing-y-1">
          <thead>
            <tr>
              <th className="w-[110px]" />
              {steps.map((step, i) => (
                <th key={step.leadTimeHours} className="font-normal p-0">
                  <button
                    type="button"
                    onClick={() => onSelectFrame(i)}
                    aria-pressed={i === frameIndex}
                    aria-label={`Show ${formatLead(step.leadTimeHours)}`}
                    className={classNames(
                      'w-full px-2 py-1 rounded font-mono text-[12px] transition-colors',
                      i === frameIndex ? 'bg-black text-white font-semibold' : 'bg-[#EFF4FF] text-[#475569] hover:bg-[#E5EEFF]',
                    )}
                  >
                    {formatLead(step.leadTimeHours)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KEYS.map((key) => (
              <tr key={key}>
                <th scope="row" className="font-semibold text-[#0F172A] pr-2 align-middle">
                  {DATASET_LABEL[key]}
                </th>
                {anomaly.frames[key].map((frame, i) => {
                  const area = frame.footprint?.areaKm2 ?? 0;
                  return (
                    <td key={frame.leadTimeHours} className={classNames('align-bottom p-1 rounded', i === frameIndex && 'bg-[#F1F5F9]')}>
                      <div className="h-10 flex items-end">
                        <div
                          className={classNames('w-full', area > 0 ? 'bg-[#7B3FA0]' : 'border-t border-dashed border-[#94A3B8]')}
                          style={{ height: area > 0 ? `${Math.max(6, (area / maxArea) * 100)}%` : 0 }}
                          title={`${DATASET_LABEL[key]} · ${formatLead(frame.leadTimeHours)} · ${area > 0 ? `${area} km²` : 'below threshold'}`}
                        />
                      </div>
                      <div className="font-mono text-[10px] leading-tight text-[#334155] mt-0.5">
                        {area > 0 ? `${area} km²` : 'below thr.'}
                      </div>
                      <div className="font-mono text-[10px] leading-tight text-[#64748B]">
                        peak {frame.peak}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {trajectory && (
        <div className="flex flex-col gap-1 border-t border-[#E2E8F0] pt-2 text-[11px] text-[#334155]">
          <div className="font-semibold text-[#0F172A]">
            Centroid at {formatLead(steps[frameIndex]?.leadTimeHours ?? 0)} <span className="font-normal text-[#64748B]">({trajectory.basis.replace(/_/g, ' ')})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 font-mono">
            {KEYS.map((key) => {
              const p = trajectory.points[key][frameIndex];
              return (
                <div key={key}>
                  <span className="text-[#64748B]">{DATASET_LABEL[key]}: </span>
                  {p ? `${p.latitude.toFixed(2)}°N, ${p.longitude.toFixed(2)}°E` : '—'}
                </div>
              );
            })}
          </div>
          <div className="text-[#64748B]">
            Representation: {trajectory.representation.replace(/_/g, ' ')} — the footprint's movement, not a cyclone-style track.
          </div>
        </div>
      )}
    </section>
  );
}
