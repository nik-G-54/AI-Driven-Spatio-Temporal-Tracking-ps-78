import type { SelectedEvent } from '../historical-replay.api';

interface EventMetaProps {
  event: SelectedEvent;
}

export default function EventMeta({ event }: EventMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-[#EFF4FF] px-3.5 py-2 rounded-lg font-mono text-code-sm text-[#475569]">
      <div className="flex items-center gap-1.5 text-[#0F172A] font-semibold">
        <span className="material-symbols-outlined text-[17px] text-[#EF4444]">cyclone</span>
        {event.name}
      </div>
      <span className="text-[#76777D]">/</span>
      <span>
        Gusts: <strong className="text-[#0F172A] font-semibold">{event.metaPill.gusts.value} {event.metaPill.gusts.unit}</strong>
      </span>
      <span className="text-[#76777D]">/</span>
      <span>
        Rain: <strong className="text-[#0F172A] font-semibold">{event.metaPill.rainfall.value} {event.metaPill.rainfall.unit}</strong>
      </span>
      <span className="text-[#76777D]">/</span>
      <span>
        Landfall: <strong className="text-[#0F172A] font-semibold">{event.metaPill.landfall}</strong>
      </span>
      <span className="text-[#76777D]">/</span>
      <span>
        Track: <strong className="text-[#0F172A] font-semibold">{event.metaPill.trackDurationHours} hrs</strong>
      </span>
    </div>
  );
}
