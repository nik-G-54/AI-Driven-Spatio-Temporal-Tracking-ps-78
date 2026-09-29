import type { ValidationMetric } from '../retrospective.types';
import { formatValue } from '../retrospective.utils';

// Compact strip of the existing simulated metrics (no new numbers are computed
// here). Full scope and notes for every metric are in the detailed table below.

interface ValidationStripProps {
  metrics: ValidationMetric[];
}

// Metric names as produced by the adapter, in display order.
const STRIP: Array<{ name: string; label: string }> = [
  { name: 'Peak intensity', label: 'PEAK' },
  { name: 'Mean absolute error', label: 'MAE' },
  { name: 'Spatial overlap (IoU of exceedance area)', label: 'SPATIAL OVERLAP' },
  { name: 'Centroid distance', label: 'CENTROID DISTANCE' },
  { name: 'Affected area (exceedance footprint)', label: 'AFFECTED AREA' },
  { name: 'Timing difference of peak', label: 'PEAK TIMING' },
];

export default function ValidationStrip({ metrics }: ValidationStripProps) {
  const columns = STRIP.map((item) => ({ ...item, metric: metrics.find((m) => m.name === item.name) })).filter(
    (c): c is typeof c & { metric: ValidationMetric } => c.metric !== undefined,
  );
  if (columns.length === 0) return null;

  const rows: Array<{ label: string; value: (m: ValidationMetric) => number | null }> = [
    { label: 'NWP', value: (m) => m.baseline },
    { label: 'AI REFINED', value: (m) => m.aiOutput },
    { label: 'REFERENCE', value: (m) => m.reference },
  ];

  return (
    <section className="flex flex-col gap-2 bg-[#0B1117] p-3 border border-[#1F2A36]" aria-label="Validation metrics strip">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-[11.5px] font-semibold tracking-[0.08em] text-[#E6EDF4]">SIMULATED PROTOTYPE METRICS</h3>
        <span className="text-[11px] text-[#8794A4]">
          Calculated from the simulated fields for illustration — not accuracy, verified performance or a real model score.
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="font-mono text-[10px] text-[#7F8C9C] uppercase tracking-wider border-b border-[#1F2A36]">
              <th className="py-1 pr-3 font-semibold" />
              {columns.map((c) => (
                <th key={c.name} className="py-1 pr-3 font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-[#18212B]">
                <th scope="row" className="py-1 pr-3 font-mono text-[11px] font-semibold text-[#B7C2CF]">
                  {row.label}
                </th>
                {columns.map((c) => (
                  <td key={c.name} className="py-1 pr-3 font-mono text-[#E6EDF4]">
                    {formatValue(row.value(c.metric), c.metric.unit)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[11px] text-[#7F8C9C]">
        Each metric&apos;s scope (frames, grid, sign convention) is listed in the detailed table below. A dash means the metric has
        no value for that dataset.
      </div>
    </section>
  );
}
