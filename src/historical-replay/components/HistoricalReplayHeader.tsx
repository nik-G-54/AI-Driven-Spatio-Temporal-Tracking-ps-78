import type { ComparisonMode, HistoricalEventOption } from '../historical-replay.api';

interface HistoricalReplayHeaderProps {
  events: HistoricalEventOption[];
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
  comparisonModes: ComparisonMode[];
  selectedComparisonModeId: string;
  onSelectComparisonMode: (id: string) => void;
  onExportPdf: () => void;
}

export default function HistoricalReplayHeader({
  events,
  selectedEventId,
  onSelectEvent,
  comparisonModes,
  selectedComparisonModeId,
  onSelectComparisonMode,
  onExportPdf,
}: HistoricalReplayHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-sm">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-black text-white">
            <span className="material-symbols-outlined text-[15px]">history_edu</span>
          </span>
          <h1 className="text-display-md text-[#0F172A] tracking-tight">Historical Event Replay</h1>
          <span className="text-label-sm px-2 py-0.5 rounded-full bg-[#E5EEFF] text-[#475569] uppercase font-semibold">
            Hindcast Validation
          </span>
        </div>
        <p className="text-body-md text-[#475569]">
          Reconstruct and inspect the spatio-temporal evolution and downscaled hazard fields of verified historical
          extreme events.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative inline-flex items-center">
          <select
            value={selectedEventId}
            onChange={(event) => onSelectEvent(event.target.value)}
            className="appearance-none h-9 pl-3 pr-8 rounded bg-[#EFF4FF] text-[#0F172A] text-body-sm font-medium hover:bg-[#E5EEFF] cursor-pointer focus:outline-none focus:ring-1 focus:ring-black"
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.dropdownLabel}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-2 text-[#475569] text-[18px]">
            unfold_more
          </span>
        </div>

        <div className="relative inline-flex items-center">
          <select
            value={selectedComparisonModeId}
            onChange={(event) => onSelectComparisonMode(event.target.value)}
            className="appearance-none h-9 pl-3 pr-8 rounded bg-[#EFF4FF] text-[#0F172A] text-body-sm font-medium hover:bg-[#E5EEFF] cursor-pointer focus:outline-none focus:ring-1 focus:ring-black"
          >
            {comparisonModes.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-2 text-[#475569] text-[18px]">
            tune
          </span>
        </div>

        <button
          type="button"
          onClick={onExportPdf}
          className="h-9 px-3.5 rounded bg-white hover:bg-[#EFF4FF] text-[#0F172A] text-label-md font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] text-[#475569]">picture_as_pdf</span>
          Export Case Study PDF
        </button>
      </div>
    </div>
  );
}
