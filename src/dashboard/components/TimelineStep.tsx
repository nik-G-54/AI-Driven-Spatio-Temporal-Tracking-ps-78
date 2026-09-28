import { classNames } from '../dashboard.utils';
import type { ForecastTimelineStep } from '../dashboard.api';

type StepStatus = 'completed' | 'active' | 'upcoming';

interface TimelineStepProps {
  step: ForecastTimelineStep;
  status: StepStatus;
  onSelect: () => void;
}

export default function TimelineStep({ step, status, onSelect }: TimelineStepProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onSelect();
      }}
      className="flex flex-col items-center relative z-10 cursor-pointer group"
    >
      {status === 'completed' && (
        <div className="w-6 h-6 rounded-full bg-[#2563EB] border-2 border-white flex items-center justify-center text-white shadow-xs">
          <span className="material-symbols-outlined text-[12px]">check</span>
        </div>
      )}
      {status === 'active' && (
        <div className="w-7 h-7 rounded-full bg-[#2563EB] ring-4 ring-[#93C5FD]/50 border-2 border-white flex items-center justify-center text-white shadow-md animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-white" />
        </div>
      )}
      {status === 'upcoming' && (
        <div className="w-5 h-5 rounded-full bg-white border-2 border-[#CBD5E1] group-hover:border-[#94A3B8] transition-colors" />
      )}

      <span
        className={classNames(
          'font-mono mt-1',
          status === 'active' ? 'text-[11px] text-[#2563EB] font-bold' : 'text-[10px] text-[#475569] font-semibold',
        )}
      >
        {step.label}
      </span>
      <span
        className={classNames(
          'font-mono text-[9px]',
          status === 'active' ? 'px-1 rounded bg-[#DBEAFE] text-[#1D4ED8] font-bold text-[10px]' : 'text-[#76777D]',
        )}
      >
        {step.leadLabel}
      </span>
    </div>
  );
}
