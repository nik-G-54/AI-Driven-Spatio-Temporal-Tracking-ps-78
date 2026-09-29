import type { Provenance, SpatialField } from '../retrospective.types';
import { fieldToRows, formatValue, summarizeField, type ValueScale } from '../retrospective.utils';

interface FieldPanelProps {
  // Scientifically unambiguous role label, e.g. "Forecast (NWP)".
  title: string;
  // Data-origin line, e.g. the simulated source or model name.
  origin: string;
  variable: string;
  timestamp: string | null;
  field: SpatialField;
  scale: ValueScale;
  provenance: Provenance;
  extra?: Array<{ label: string; value: string }>;
}

// Structural placeholder: a plain cell grid + summary. The real map and
// layers arrive in later phases.
export default function FieldPanel({
  title,
  origin,
  variable,
  timestamp,
  field,
  scale,
  provenance,
  extra = [],
}: FieldPanelProps) {
  const rows = fieldToRows(field);
  const summary = summarizeField(field);
  const range = scale.max - scale.min || 1;

  const meta = [
    { label: 'Variable', value: `${variable} (${field.unit})` },
    { label: 'Timestamp', value: timestamp ?? 'Illustrative — no real date' },
    { label: 'Resolution', value: field.resolutionKm === null ? '—' : `${field.resolutionKm} km (nominal)` },
    { label: 'Peak', value: formatValue(summary.max, field.unit) },
    ...extra,
  ];

  return (
    <section className="flex flex-col gap-3 bg-white p-5 rounded-xl shadow-sm" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-headline-sm text-[#0F172A] font-bold">{title}</h2>
          <div className="text-label-sm text-[#475569]">{origin}</div>
        </div>
        {provenance.isMock && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-[#A16207] font-semibold uppercase">
            Simulated
          </span>
        )}
      </div>

      <div
        className="grid gap-px rounded-lg overflow-hidden bg-[#E2E8F0] border border-[#E2E8F0]"
        style={{ gridTemplateColumns: `repeat(${rows[0]?.length ?? 1}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`${title} placeholder grid (${summary.count} cells)`}
      >
        {rows.flat().map((point) => (
          <div
            key={`${point.latitude}:${point.longitude}`}
            className="aspect-square bg-white"
            title={`${point.latitude}°N, ${point.longitude}°E: ${point.value} ${field.unit}`}
            style={{ backgroundColor: `rgba(37, 99, 235, ${0.08 + 0.85 * ((point.value - scale.min) / range)})` }}
          />
        ))}
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        {meta.map((item) => (
          <div key={item.label} className="flex flex-col">
            <dt className="text-label-sm text-[#64748B] uppercase tracking-wider">{item.label}</dt>
            <dd className="text-body-sm text-[#0F172A] font-medium break-words">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
