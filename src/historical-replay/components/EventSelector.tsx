import type { HistoricalEventOption } from '../historical-replay.api';
import { classNames } from '../historical-replay.utils';

interface EventSelectorProps {
  events: HistoricalEventOption[];
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
}

export default function EventSelector({ events, selectedEventId, onSelectEvent }: EventSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {events.map((event) => {
        const isSelected = event.id === selectedEventId;
        return (
          <button
            key={event.id}
            type="button"
            onClick={() => onSelectEvent(event.id)}
            className={classNames(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-label-sm font-medium tracking-wide transition-colors',
              isSelected
                ? 'bg-black text-white font-semibold'
                : 'bg-[#EFF4FF] text-[#475569] hover:bg-[#E5EEFF] hover:text-[#0F172A]',
            )}
          >
            <span
              className={classNames(
                'rounded-full',
                isSelected ? 'w-2 h-2 bg-[#EF4444] animate-pulse' : 'w-1.5 h-1.5 bg-[#76777D]',
              )}
            />
            {event.chipLabel}
            {isSelected && ' ● SELECTED'}
          </button>
        );
      })}
    </div>
  );
}
