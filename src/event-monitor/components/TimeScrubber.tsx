import { classNames } from '../event-monitor.utils';

interface TimeScrubberProps {
  timesteps: number[];
  selectedIndex: number;
  isPlaying: boolean;
  onSelectIndex: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
}

export default function TimeScrubber({
  timesteps,
  selectedIndex,
  isPlaying,
  onSelectIndex,
  onPrev,
  onNext,
  onTogglePlay,
}: TimeScrubberProps) {
  const currentLeadHour = timesteps[selectedIndex] ?? 0;
  const label = currentLeadHour === 0 ? 'T+00h (OBSERVED)' : `T+${currentLeadHour}h (FORECAST)`;

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4 space-y-3 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous Timestep"
            className="w-9 h-9 rounded-lg bg-[#f8fafc] hover:bg-[#e0e7ff] text-[#1e1b4b] border border-[#e2e8f0] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">skip_previous</span>
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause Timeline' : 'Play Timeline'}
            className="w-9 h-9 rounded-lg bg-[#4f46e5] text-white hover:bg-[#4338ca] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[20px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            aria-label="Next Timestep"
            className="w-9 h-9 rounded-lg bg-[#f8fafc] hover:bg-[#e0e7ff] text-[#1e1b4b] border border-[#e2e8f0] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">skip_next</span>
          </button>

          <div className="ml-2 flex items-center gap-2 font-mono text-[12px] text-[#0f172a]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#991b1b] animate-pulse" />
            <span className="font-[700] text-[#64748b] tracking-[0.04em] uppercase">SELECTED TIMESTEP:</span>
            <span className="font-[800] text-[13px] text-[#1e1b4b]">{label}</span>
          </div>
        </div>

        {/* Buttons / Print Labels (13px 700 Bold font-mono) */}
        <div className="font-mono text-[11px] font-[700] tracking-[0.04em] uppercase text-[#64748b] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4f46e5]" />
          <span>FORECAST SCRUBBER • 12-HOUR INCREMENTS</span>
        </div>
      </div>

      <div className="pt-1">
        <div className="h-2.5 w-full bg-[#e0e7ff] rounded-full overflow-hidden relative mb-3">
          <div
            className="h-full bg-[#4f46e5] transition-all duration-300 rounded-full"
            style={{ width: `${((selectedIndex + 1) / timesteps.length) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
          {timesteps.map((hour, index) => {
            const isActive = index === selectedIndex;
            return (
              <button
                key={hour}
                type="button"
                onClick={() => onSelectIndex(index)}
                className={classNames(
                  'py-2 px-1 rounded-lg border font-mono text-[12px] transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5',
                  isActive
                    ? 'bg-[#1e1b4b] text-white border-[#1e1b4b] shadow-sm font-[800] ring-2 ring-indigo-300'
                    : 'bg-[#f8fafc] text-[#64748b] border-[#e2e8f0] hover:bg-[#e0e7ff] hover:text-[#1e1b4b]',
                )}
              >
                <span>T+{hour < 10 ? `0${hour}` : hour}h</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#f87171]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
