import type { ReplayValidationMetrics, SelectedEvent } from '../historical-replay.api';
import HistoricalMetrics from './HistoricalMetrics';

interface EventSummaryProps {
  event: SelectedEvent;
  validation: ReplayValidationMetrics;
  onExportDataset: () => void;
}

export default function EventSummary({ event, validation, onExportDataset }: EventSummaryProps) {
  return (
    <div className="xl:col-span-4 flex flex-col gap-4 bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#E5EEFF]">
        <div>
          <h2 className="text-headline-sm text-[#0F172A] font-bold">Verified Event Validation</h2>
          <div className="text-label-sm text-[#475569]">Ground Station &amp; Buoy Calibration</div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-[#93000A] text-[10px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
          {event.severityTag}
        </span>
      </div>

      <HistoricalMetrics validation={validation} />

      <div className="bg-[#DCE9FF] p-3.5 rounded-lg flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[#0F172A] text-[13px] font-bold">
          <span className="material-symbols-outlined text-[17px] text-black">insights</span>
          Synoptic Case Assessment
        </div>
        <p className="text-body-sm text-[#45464D] leading-relaxed">{event.synopticAssessment}</p>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          className="w-full py-2.5 px-4 rounded-lg bg-black text-white hover:bg-[#213145] text-label-md font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">grid_4x4</span>
          View Downscaled Grid Details
        </button>
        <button
          type="button"
          onClick={onExportDataset}
          className="w-full py-2 px-4 rounded-lg bg-white text-[#0F172A] hover:bg-[#EFF4FF] text-label-md font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] text-[#475569]">cloud_download</span>
          Download IMD Validation Dataset
        </button>
      </div>

      <div className="pt-2 text-center border-t border-[#E5EEFF]">
        <span className="font-mono text-[10px] text-[#475569] uppercase tracking-wider block">
          Historical Reconstruction • Verified Against IMD &amp; ECMWF ERA5 Reanalysis
        </span>
      </div>
    </div>
  );
}
