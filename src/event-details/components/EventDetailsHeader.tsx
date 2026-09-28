import type { SelectedEvent } from '../event-details.api';
import { classNames } from '../event-details.utils';

export type ViewMode = 'side-by-side' | 'swipe';

interface EventDetailsHeaderProps {
  event: SelectedEvent;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onDownloadCapJson: () => void;
}

export default function EventDetailsHeader({
  event,
  viewMode,
  onSetViewMode,
  showGrid,
  onToggleGrid,
  onDownloadCapJson,
}: EventDetailsHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-sm">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center font-mono text-code-sm px-2 py-0.5 rounded bg-black text-white font-semibold">
            {event.eventCode}
          </span>
          <h1 className="text-display-md text-[#0F172A] tracking-tight">{event.title}</h1>
        </div>
        <p className="text-body-md text-[#475569]">{event.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex p-1 bg-[#E5EEFF] rounded-lg shadow-sm">
          <button
            type="button"
            onClick={() => onSetViewMode('side-by-side')}
            className={classNames(
              'px-3 py-1.5 rounded-md text-label-md flex items-center gap-1.5 transition-all',
              viewMode === 'side-by-side' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#475569] hover:text-[#0F172A]',
            )}
          >
            <span className="material-symbols-outlined text-[16px]">view_column</span>
            <span>Side-by-Side</span>
          </button>
          <button
            type="button"
            onClick={() => onSetViewMode('swipe')}
            className={classNames(
              'px-3 py-1.5 rounded-md text-label-md flex items-center gap-1.5 transition-all',
              viewMode === 'swipe' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#475569] hover:text-[#0F172A]',
            )}
          >
            <span className="material-symbols-outlined text-[16px]">compare</span>
            <span>Swipe Slider</span>
          </button>
        </div>

        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EFF4FF] cursor-pointer hover:bg-[#E5EEFF] transition-colors select-none">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={onToggleGrid}
            className="w-4 h-4 rounded accent-[#131B2E] cursor-pointer"
          />
          <span className="text-label-md text-[#0F172A]">5 km Grid Cells</span>
        </label>

        <button
          type="button"
          onClick={onDownloadCapJson}
          className="px-3.5 py-1.5 rounded-lg bg-white text-[#0F172A] hover:bg-[#EFF4FF] text-label-md flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span>Download CAP Alert JSON</span>
        </button>
      </div>
    </div>
  );
}
