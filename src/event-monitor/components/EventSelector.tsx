import type { EventOption } from '../event-monitor.api';

interface EventSelectorProps {
  options: EventOption[];
  selectedId: string;
  onChange: (id: string) => void;
}

export default function EventSelector({ options, selectedId, onChange }: EventSelectorProps) {
  return (
    <div className="relative">
      <select
        value={selectedId}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none h-9 pl-3 pr-8 rounded-lg bg-white border border-[#CBD5E1] text-[#0F172A] text-label-md shadow-sm cursor-pointer focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined absolute right-2.5 top-2.5 pointer-events-none text-[#475569] text-[16px]">
        arrow_drop_down
      </span>
    </div>
  );
}
