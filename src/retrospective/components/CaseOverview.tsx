import type { CaseInfo } from '../retrospective.types';
import { formatEventType } from '../retrospective.utils';

interface CaseOverviewProps {
  info: CaseInfo;
}

export default function CaseOverview({ info }: CaseOverviewProps) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Case ID', value: info.caseId },
    { label: 'Event type', value: formatEventType(info.eventType) },
    { label: 'Region', value: info.region },
    { label: 'Country', value: info.country },
    { label: 'Time range', value: info.dateRange.label },
    { label: 'Data status', value: info.provenance.isMock ? 'Mock / prototype simulation' : 'Real' },
  ];

  return (
    <section className="flex flex-col gap-3 bg-white p-5 rounded-xl shadow-sm" aria-label="Case overview">
      <h2 className="text-headline-sm text-[#0F172A] font-bold">{info.eventName}</h2>
      <p className="text-body-sm text-[#475569]">{info.description}</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5 rounded-lg bg-[#F8FAFC] px-3 py-2">
            <dt className="text-label-sm text-[#64748B] uppercase tracking-wider">{row.label}</dt>
            <dd className="text-body-sm text-[#0F172A] font-medium break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
