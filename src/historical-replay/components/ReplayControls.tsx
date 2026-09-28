import type { TimelineFrame } from '../historical-replay.api';
import { classNames } from '../historical-replay.utils';

interface ReplayControlsProps {
  currentFrame: TimelineFrame;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  speed: number;
  onSetSpeed: (speed: number) => void;
}

const SPEED_OPTIONS = [1, 2, 4];

export default function ReplayControls({
  currentFrame,
  isPlaying,
  onTogglePlay,
  onReset,
  onStepBack,
  onStepForward,
  speed,
  onSetSpeed,
}: ReplayControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1 bg-[#EFF4FF] p-1 rounded-lg">
        <button
          type="button"
          onClick={onReset}
          title="Reset to Genesis"
          className="w-8 h-8 rounded flex items-center justify-center text-[#0F172A] hover:bg-[#E5EEFF] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">replay</span>
        </button>
        <button
          type="button"
          onClick={onStepBack}
          title="Step back"
          className="w-8 h-8 rounded flex items-center justify-center text-[#0F172A] hover:bg-[#E5EEFF] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">fast_rewind</span>
        </button>
        <button
          type="button"
          onClick={onTogglePlay}
          className="h-8 px-3 rounded bg-black text-white hover:bg-[#213145] text-label-md font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
          {isPlaying ? 'Pause' : `Play (${speed}x)`}
        </button>
        <button
          type="button"
          onClick={onStepForward}
          title="Step forward"
          className="w-8 h-8 rounded flex items-center justify-center text-[#0F172A] hover:bg-[#E5EEFF] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">fast_forward</span>
        </button>
      </div>

      <div className="flex items-center gap-2 font-mono text-code-sm bg-[#EFF4FF] px-3 py-1.5 rounded-lg text-[#0F172A]">
        <span className="material-symbols-outlined text-[16px] text-[#EF4444]">radio_button_checked</span>
        <span>
          Displaying: <strong className="font-bold text-[#0F172A]">{currentFrame.displayLabel}</strong>
          {currentFrame.isLandfall ? ' (Landfall Hour)' : ''}
        </span>
        <span className="text-[#76777D]">|</span>
        <span className="text-[#475569]">
          Observed: <strong className="text-[#0F172A]">{currentFrame.rainfallMmDay} mm/day</strong>
        </span>
      </div>

      <div className="flex items-center gap-1 text-label-sm text-[#475569]">
        {SPEED_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSetSpeed(option)}
            className={classNames(
              'px-2 py-1 rounded font-semibold',
              option === speed ? 'bg-[#E5EEFF] text-[#0F172A]' : 'hover:bg-[#EFF4FF]',
            )}
          >
            {option}x{option === speed && option === 1 ? ' Speed' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
