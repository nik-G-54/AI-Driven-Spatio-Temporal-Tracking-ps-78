import { lazy, Suspense, useState } from 'react';
import type { SatelliteAlignment, SatelliteContext } from '../satellite/satellite.types';
import { formatOffset } from '../satellite/satellite.utils';
import { classNames, formatLead, formatTimestamp } from '../retrospective.utils';
import type { MapSyncGroup } from '../map/mapSync';
import type { FieldData } from '../map/useFieldData';

// The map (MapLibre) loads only when the panel is opened.
const SatelliteContextMap = lazy(() => import('./SatelliteContextMap'));

// Satellite observational CONTEXT: secondary to the NWP → AI → Reference
// comparison and collapsed by default. It never claims validation. For a
// synthetic prototype case it shows a clearly labelled SIMULATED context, and
// it never substitutes a frame from a different time: each analytic step is
// MATCHED, NEARBY (shown as the nearest available observation with its own
// time) or MISSING (no frame shown).

interface ObservationalContextProps {
  context: SatelliteContext | null;
  data: FieldData;
  frameIndex: number;
  sync: MapSyncGroup;
}

const STATUS_STYLE: Record<SatelliteAlignment['status'], string> = {
  matched: 'border-[#22C55E]/60 text-[#86EFAC]',
  nearby: 'border-[#7A5A12] text-[#FBBF24]',
  missing: 'border-[#3A4756] text-[#8794A4]',
};

export default function ObservationalContext({ context, data, frameIndex, sync }: ObservationalContextProps) {
  const [open, setOpen] = useState(false);
  if (!context) return null;

  const { availability } = context;
  const simulated = availability.status === 'simulated';
  const sample = context.observations[0];
  const alignment = context.alignment[Math.min(frameIndex, context.alignment.length - 1)];
  const observation = context.observations.find((o) => o.observationId === alignment?.observationId);

  const headline =
    availability.status === 'simulated'
      ? 'Satellite context: Prototype'
      : availability.status === 'real'
        ? 'Satellite context: available'
        : 'Satellite context: unavailable';

  return (
    <details
      className="bg-[#0B1117] border border-[#1F2A36]"
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer select-none px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-mono text-[11.5px] font-semibold tracking-[0.08em] uppercase text-[#E6EDF4]">Observational context</span>
        <span className="text-[12px] text-[#B7C2CF]">{headline}</span>
        {simulated && <span className="font-mono text-[9px] tracking-[0.08em] px-1.5 py-[1px] border border-[#7A5A12] text-[#FBBF24]">SIMULATED</span>}
        <span className="text-[11px] text-[#7F8C9C]">Secondary context — not part of the NWP → AI → Reference comparison</span>
      </summary>

      <div className="flex flex-col gap-3 px-4 pb-4">
        <div className="border border-[#4A3A12] bg-[#FBBF24]/[0.06] px-3 py-2 text-[12px] text-[#E9CF8C]">
          <strong>{simulated ? 'SIMULATED SATELLITE CONTEXT' : availability.status === 'real' ? 'SATELLITE OBSERVATION' : 'SATELLITE CONTEXT UNAVAILABLE'}.</strong>{' '}
          {availability.reason}
          {simulated && sample && ` ${sample.provenance.note}`}
        </div>

        {sample && (
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-[12px]">
            <Item label="Status" value={simulated ? 'SIMULATED' : sample.provenance.dataStatus.toUpperCase()} />
            <Item label="Source" value={sample.provenance.sourceName} />
            <Item label="Product" value={sample.product} />
            <Item label="Satellite / sensor" value={`${sample.satellite} / ${sample.sensor}`} />
            <Item label="Nominal resolution" value={sample.spatialResolutionKm === null ? '—' : `${sample.spatialResolutionKm} km`} />
            <Item label="Coverage" value={`${Math.round(sample.coverage.fraction * 100)} % — ${sample.coverage.note}`} />
            <Item label="Timestamps" value={simulated ? 'Synthetic (not a real date)' : 'As listed below'} />
            <Item label="Product code" value={sample.productCode ?? 'none (simulated)'} />
          </dl>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <caption className="text-left text-[11px] text-[#8794A4] pb-1">
              Temporal alignment with the analytic valid time (NWP, AI output and Reference share it). Tolerance for NEARBY: ±{context.toleranceMinutes} min.
            </caption>
            <thead>
              <tr className="font-mono text-[10px] text-[#7F8C9C] uppercase tracking-wider border-b border-[#1F2A36]">
                <th className="py-1 pr-3 font-semibold">Step</th>
                <th className="py-1 pr-3 font-semibold">Analytic valid time</th>
                <th className="py-1 pr-3 font-semibold">Nearest satellite time</th>
                <th className="py-1 pr-3 font-semibold">Offset</th>
                <th className="py-1 pr-3 font-semibold">Alignment</th>
              </tr>
            </thead>
            <tbody>
              {context.alignment.map((row) => (
                <tr key={row.stepIndex} className={classNames('border-b border-[#18212B] text-[#B7C2CF]', row.stepIndex === frameIndex && 'bg-[#38BDF8]/10 text-[#E6EDF4] font-semibold')}>
                  <td className="py-1 pr-3 font-mono">{formatLead(row.leadTimeHours)}</td>
                  <td className="py-1 pr-3 font-mono">{formatTimestamp(row.analyticTimes.reference)}</td>
                  <td className="py-1 pr-3 font-mono">{row.nearestObservationTime ? formatTimestamp(row.nearestObservationTime) : '—'}</td>
                  <td className="py-1 pr-3 font-mono">{formatOffset(row.offsetMinutes)}</td>
                  <td className="py-1 pr-3">
                    <span className={classNames('font-mono text-[9.5px] px-1.5 py-0.5 border uppercase', STATUS_STYLE[row.status])}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {alignment && (
          <div className="flex flex-col gap-2">
            <div className="text-[12px] text-[#D9E1EA]" role="status">
              {alignment.status === 'matched' && observation && (
                <>
                  <strong>Satellite observation (simulated)</strong> · {formatTimestamp(observation.validTime)} · matches {formatLead(alignment.leadTimeHours)}
                </>
              )}
              {alignment.status === 'nearby' && observation && (
                <>
                  <strong>Nearest available observation (simulated)</strong> · {formatTimestamp(observation.validTime)} · {formatOffset(alignment.offsetMinutes)}{' '}
                  from the {formatLead(alignment.leadTimeHours)} analytic time — not an exact match
                </>
              )}
              {alignment.status === 'missing' && (
                <>
                  <strong>No satellite observation within ±{context.toleranceMinutes} min of {formatLead(alignment.leadTimeHours)}.</strong>{' '}
                  {alignment.nearestObservationTime
                    ? `Nearest is ${formatTimestamp(alignment.nearestObservationTime)} (${formatOffset(alignment.offsetMinutes)}); no frame is shown rather than substituting a different time.`
                    : 'No frame is shown.'}
                </>
              )}
            </div>

            {open && observation && (
              <Suspense fallback={<div role="status" className="text-[12px] text-[#8794A4]">Loading satellite context map...</div>}>
                <SatelliteContextMap
                  observations={context.observations}
                  observationId={observation.observationId}
                  data={data}
                  frameIndex={frameIndex}
                  sync={sync}
                />
              </Suspense>
            )}
          </div>
        )}

        <div className="text-[11px] text-[#7F8C9C]">
          Satellite context is observational background for a forecaster and is never used as model input or as a validation score here. It
          follows the shared time step and camera.
        </div>
      </div>
    </details>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="font-mono text-[10px] text-[#7F8C9C] uppercase tracking-wider">{label}</dt>
      <dd className="text-[#E6EDF4] font-medium break-words">{value}</dd>
    </div>
  );
}
