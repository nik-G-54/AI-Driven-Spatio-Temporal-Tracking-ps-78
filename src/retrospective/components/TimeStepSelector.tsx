import type { TimeStepField } from '../retrospective.types';
import { classNames, formatLead } from '../retrospective.utils';

interface TimeStepSelectorProps {
  frames: TimeStepField[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  // Optional auto-advance; manual selection always works and pauses playback.
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

// Placeholder time-step picker; a proper timeline/scrubber comes in a later phase.
export default function TimeStepSelector({ frames, selectedIndex, onSelect, isPlaying = false, onTogglePlay }: TimeStepSelectorProps) {
  if (frames.length <= 1) return null;
  return (
    <section className="flex flex-wrap items-center gap-2 bg-white p-4 rounded-xl shadow-sm" aria-label="Time step">
      <span className="text-label-sm text-[#64748B] tracking-wider uppercase mr-2">Time step</span>
      {frames.map((frame, index) => (
        <button
          key={frame.leadTimeHours}
          type="button"
          onClick={() => onSelect(index)}
          aria-pressed={index === selectedIndex}
          className={classNames(
            'px-3 py-1.5 rounded-lg text-label-md font-mono transition-colors',
            index === selectedIndex
              ? 'bg-black text-white font-semibold'
              : 'bg-[#EFF4FF] text-[#475569] hover:bg-[#E5EEFF] hover:text-[#0F172A]',
          )}
        >
          {formatLead(frame.leadTimeHours)}
        </button>
      ))}
      {onTogglePlay && (
        <button
          type="button"
          onClick={onTogglePlay}
          aria-pressed={isPlaying}
          className="ml-2 px-3 py-1.5 rounded text-label-md bg-[#EFF4FF] text-[#0F172A] hover:bg-[#E5EEFF] flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      )}
    </section>
  );
}
