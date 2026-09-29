import type { BackendFieldUse, EventSummary } from '../analysis/analysis.types';
import { classNames } from '../retrospective.utils';

interface BackendMappingPanelProps {
  event: EventSummary;
  fields: BackendFieldUse[];
  facts: Array<{ label: string; value: string }>;
}

const ORIGIN: Record<BackendFieldUse['origin'], { label: string; style: string }> = {
  backend: { label: 'Backend mock', style: 'border-[#38BDF8]/60 text-[#BAE6FD]' },
  derived: { label: 'Derived', style: 'border-[#3A4756] text-[#B7C2CF]' },
  prototype: { label: 'Prototype constant', style: 'border-[#7A5A12] text-[#FBBF24]' },
};

// Transparency: which backend field feeds which part of the UI, and which numbers are
// derived or simply prototype constants.
export default function BackendMappingPanel({ event, fields, facts }: BackendMappingPanelProps) {
  return (
    <details className="bg-[#0B1117] border border-[#1F2A36]">
      <summary className="cursor-pointer select-none px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-mono text-[11.5px] font-semibold tracking-[0.08em] uppercase text-[#E6EDF4]">Backend data → UI mapping</span>
        <span className="text-[11px] text-[#8794A4]">{fields.length} fields · source: {event.source === 'backend-mock-api' ? 'existing mock API adapters' : 'retrospective mock adapter'}</span>
      </summary>
      <div className="px-4 pb-4 flex flex-col gap-3">
        <p className="text-[11px] text-[#8794A4]">
          {event.provenanceNote} The repository has no HTTP backend: the "mock API" is the existing <code>*.api.ts</code> adapters over
          <code> src/mockData</code>. The weather-analysis adapter is the only place that reads them; replacing it with a real backend does not touch the UI.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="font-mono text-[10px] text-[#7F8C9C] uppercase tracking-wider border-b border-[#1F2A36]">
                <th className="py-1 pr-3 font-semibold">Field</th>
                <th className="py-1 pr-3 font-semibold">Value</th>
                <th className="py-1 pr-3 font-semibold">Used for</th>
                <th className="py-1 pr-3 font-semibold">Origin</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.field} className="border-b border-[#18212B] align-top">
                  <td className="py-1 pr-3 font-mono text-[11px] text-[#E6EDF4]">{f.field}</td>
                  <td className="py-1 pr-3 text-[#B7C2CF] break-words">{f.value}</td>
                  <td className="py-1 pr-3 text-[#B7C2CF]">{f.usedFor}</td>
                  <td className="py-1 pr-3">
                    <span className={classNames('font-mono text-[9.5px] px-1.5 py-0.5 border uppercase whitespace-nowrap', ORIGIN[f.origin].style)}>{ORIGIN[f.origin].label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {facts.length > 0 && (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
            {facts.map((f, i) => (
              <div key={`${f.label}-${i}`} className="flex gap-2">
                <dt className="text-[#8794A4] w-[190px] shrink-0">{f.label}</dt>
                <dd className="text-[#E6EDF4]">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </details>
  );
}
