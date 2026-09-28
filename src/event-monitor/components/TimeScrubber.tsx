import type { EventTimeline } from '../event-monitor.api';
import { classNames } from '../event-monitor.utils';

interface TimeScrubberProps {
  timeline: EventTimeline;
  selectedIndex: number;
  isPlaying: boolean;
  onSelectIndex: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
}

export default function TimeScrubber({
  timeline,
  selectedIndex,
  isPlaying,
  onSelectIndex,
  onPrev,
  onNext,
  onTogglePlay,
}: TimeScrubberProps) {
  const selectedStep = timeline.steps[selectedIndex];

  return (
    <div className="mt-4 pt-3 flex flex-col gap-2.5 bg-[#F8FAFC] p-3 rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            className="w-8 h-8 rounded bg-white hover:bg-[#F1F5F9] text-[#0F172A] shadow-sm flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">skip_previous</span>
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-8 h-8 rounded bg-black text-white hover:bg-[#213145] shadow-sm flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            className="w-8 h-8 rounded bg-white hover:bg-[#F1F5F9] text-[#0F172A] shadow-sm flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">skip_next</span>
          </button>
          <div className="ml-2 flex items-center gap-1.5 font-mono text-code-sm text-[#0F172A]">
            <span className="w-2 h-2 rounded-full bg-[#BA1A1A]" />
            <span className="font-semibold">Selected Time:</span>
            <span className="text-[#0F172A] font-bold">{selectedStep.label}</span>
            <span className="text-[#475569] font-normal">(Valid: {selectedStep.validTime})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-code-sm">
          <span className="text-[#475569]">Step: {timeline.stepLabel}</span>
          <span className="text-[#475569]">•</span>
          <span className="text-[#475569]">{timeline.ensembleMembers} Ensemble Members</span>
        </div>
      </div>

      <div className="relative w-full pt-1 pb-1">
        <div className="h-2 w-full bg-[#DCE9FF] rounded-full overflow-hidden relative">
          <div className="h-full bg-[#BCC7DE] rounded-full" style={{ width: `${timeline.cacheLoadedPercent}%` }} />
          <div className="absolute top-0 bottom-0 left-0 bg-black" style={{ width: `${selectedStep.progress}%` }} />
        </div>

        <div className="flex justify-between items-center mt-2.5">
          {timeline.steps.map((step, index) => {
            const isActive = index === selectedIndex;
            return (
              <button
                key={step.leadHour}
                type="button"
                onClick={() => onSelectIndex(index)}
                className="flex flex-col items-center group focus:outline-none"
              >
                <div
                  className={classNames(
                    'rounded-full transition-colors',
                    isActive ? 'w-3.5 h-3.5 bg-[#BA1A1A] ring-2 ring-red-200' : 'w-2.5 h-2.5 bg-[#76777D] group-hover:bg-black',
                  )}
                />
                <span
                  className={classNames(
                    'font-mono text-[11px] mt-1',
                    isActive ? 'text-[#BA1A1A] font-bold' : 'text-[#475569]',
                  )}
                >
                  {step.label}
                  {isActive ? ' ● ACTIVE' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
