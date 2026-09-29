import type { ApiEventListItem, ApiEventDetails } from '../event-monitor.api';

interface EventMonitorHeaderProps {
  eventDetails: ApiEventDetails;
  eventList: ApiEventListItem[];
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
}

export default function EventMonitorHeader({
  eventList,
  selectedEventId,
  onSelectEvent,
}: EventMonitorHeaderProps) {
  return (
    <header className="flex items-center justify-between pb-4 border-b border-[#e2e8f0] mb-6">
      {/* Document Main Title (Indigo Mono Spec: 20px / 1.25rem, 800 ExtraBold, Geist Mono, 0.05em, UPPERCASE, #1e1b4b) */}
      <h1 className="font-mono text-[20px] leading-[1.25rem] font-[800] tracking-[0.05em] uppercase text-[#1e1b4b]">
        EVENT MONITOR
      </h1>

      <div className="relative">
        <label htmlFor="event-select-dropdown" className="sr-only">
          Select Monitored Extreme Event
        </label>
        <select
          id="event-select-dropdown"
          aria-label="Select Monitored Extreme Event"
          value={selectedEventId}
          onChange={(e) => onSelectEvent(e.target.value)}
          className="h-9 px-3.5 pr-8 rounded-lg bg-white border border-[#e2e8f0] text-[#1e1b4b] font-mono font-[700] text-[13px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] cursor-pointer"
        >
          {eventList.map((evt) => (
            <option key={evt.id} value={evt.id}>
              {evt.name} ({evt.severity})
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
