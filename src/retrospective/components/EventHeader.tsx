import type { EventSummary } from '../analysis/analysis.types';
import { EVENT_TYPE_LABEL } from '../analysis/analysis.types';
import { classNames, formatTimestamp } from '../retrospective.utils';
import { CAP, PANEL } from './ui';

interface EventHeaderProps {
  event: EventSummary;
}

const severityStyle = (severity: string) => {
  const s = severity.toUpperCase();
  if (s.includes('EXTREME') || s.includes('SEVERE')) return 'border-[#EF4444] text-[#FCA5A5] bg-[#EF4444]/10';
  if (s.includes('HIGH') || s.includes('WATCH')) return 'border-[#F2994A] text-[#FDBA74] bg-[#F2994A]/10';
  return 'border-[#FBBF24] text-[#FCD34D] bg-[#FBBF24]/10';
};

// Event identity strip: backend event_type / severity / status / location / confidence.
export default function EventHeader({ event }: EventHeaderProps) {
  const items: Array<{ label: string; value: string }> = [
    { label: 'Region', value: event.region },
    { label: 'Centroid', value: `${event.centroid.latitude.toFixed(2)}°N ${event.centroid.longitude.toFixed(2)}°E` },
    { label: 'Detected', value: event.detectedAt ? formatTimestamp(event.detectedAt) : '—' },
    { label: 'Forecast window', value: event.forecastStart && event.forecastEnd ? `${formatTimestamp(event.forecastStart)} → ${formatTimestamp(event.forecastEnd)}` : '—' },
    { label: 'Pipeline', value: event.modelLabel },
    { label: 'Prototype confidence', value: event.confidence === null ? '—' : `${Math.round(event.confidence * 100)} %` },
  ];
  return (
    <section className={`${PANEL} flex flex-col`} aria-label="Event overview">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 border-b border-[#1F2A36]">
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 bg-[#38BDF8]/15 border border-[#38BDF8]/60 text-[#BAE6FD]">{EVENT_TYPE_LABEL[event.type]}</span>
        <h2 className="text-[16px] font-semibold text-[#E6EDF4]">{event.name}</h2>
        <span className={classNames('font-mono text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 border', severityStyle(event.severity))}>{event.severity}</span>
        <span className="text-[11.5px] text-[#8794A4]">
          {event.classification} · {event.status}
        </span>
      </div>
      <dl className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 divide-x divide-[#1F2A36]">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5 px-4 py-2">
            <dt className={CAP}>{item.label}</dt>
            <dd className="font-mono text-[11.5px] text-[#E6EDF4] break-words">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
