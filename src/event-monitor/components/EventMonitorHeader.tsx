import { Link } from 'react-router-dom';
import type { EventOption, MonitoredEvent } from '../event-monitor.api';
import EventSelector from './EventSelector';

interface EventMonitorHeaderProps {
  event: MonitoredEvent;
  eventOptions: EventOption[];
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
  ensembleMembers: number;
}

export default function EventMonitorHeader({
  event,
  eventOptions,
  selectedEventId,
  onSelectEvent,
  ensembleMembers,
}: EventMonitorHeaderProps) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center font-mono text-code-sm px-2 py-0.5 rounded bg-[#DCE9FF] text-[#0F172A] font-semibold">
            TRACK ID: {event.trackId}
          </span>
          <span className="inline-flex items-center gap-1 text-label-sm px-2 py-0.5 rounded bg-red-100 text-[#93000A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A] animate-ping" />
            LIVE TRACKING
          </span>
        </div>
        <h1 className="text-display-md text-[#0F172A] font-bold tracking-tight">
          Event Monitor: Spatio-Temporal Trajectory
        </h1>
        <p className="text-body-md text-[#475569] max-w-3xl">
          Track spatial and temporal evolution of identified atmospheric anomaly:{' '}
          <span className="font-semibold text-[#0F172A]">{event.displayName}</span>. Cross-referenced with
          high-resolution diffusion downscaling models.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <EventSelector options={eventOptions} selectedId={selectedEventId} onChange={onSelectEvent} />
        <button
          type="button"
          className="h-9 px-3 rounded-lg bg-white text-[#0F172A] hover:bg-[#E5EEFF] text-label-md shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] text-[#565E74]">tune</span>
          Ensemble (N={ensembleMembers})
        </button>
        <Link
          to="/event-details"
          className="h-9 px-4 rounded-lg bg-black text-white hover:bg-[#213145] text-label-md shadow-sm flex items-center gap-2 transition-all"
        >
          <span>View 12km/5km Downscaling</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
